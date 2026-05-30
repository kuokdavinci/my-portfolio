import os
import json
import logging
import asyncio
import sqlite3
import math
import random
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union
from contextlib import asynccontextmanager
from pathlib import Path
from collections import deque

from fastapi import FastAPI, BackgroundTasks, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from qdrant_client import QdrantClient
from openai import AsyncOpenAI
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

from retrieval_boost import detect_boost, build_qdrant_filter, merge_parent_child, get_dynamic_top_k, route_query

# Load environment variables from .env
def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    val = val.strip("'\"")
                    os.environ[key.strip()] = val.strip()

load_env()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-gateway")

# Constants & Configuration
DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "tracking_events.db")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC = "user.activity.raw"

# Kafka disabled
kafka_available = False

DATABASE_URL = os.getenv("DATABASE_URL")

class Database:
    @staticmethod
    def get_conn():
        if DATABASE_URL:
            import psycopg2
            import socket
            from urllib.parse import urlparse

            db_url = DATABASE_URL
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)

            parsed = urlparse(db_url)
            hostname = parsed.hostname
            if hostname:
                try:
                    ipv4_addr = socket.getaddrinfo(hostname, None, socket.AF_INET)[0][4][0]
                    return psycopg2.connect(db_url, hostaddr=ipv4_addr)
                except Exception:
                    pass

            return psycopg2.connect(db_url)
        else:
            return sqlite3.connect(DB_PATH)

    @staticmethod
    def param_placeholder():
        return "%s" if DATABASE_URL else "?"

def init_db():
    """Initializes the database (PostgreSQL if DATABASE_URL is present, otherwise SQLite) and creates events table."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = Database.get_conn()
    cursor = conn.cursor()
    if DATABASE_URL:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tracking_events (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL
            )
        """)
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tracking_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL
            )
        """)
    conn.commit()
    conn.close()
    if DATABASE_URL:
        logger.info("PostgreSQL database initialized successfully.")
    else:
        logger.info(f"SQLite database initialized at: {DB_PATH}")

# Kafka functionality removed

# Global AI clients
openai_client: Optional[AsyncOpenAI] = None
qdrant_client: Optional[QdrantClient] = None
chat_history: Dict[str, List[Dict[str, str]]] = {}

async def init_ai_components():
    """Initializes AsyncOpenAI and QdrantClient on application startup."""
    global openai_client, qdrant_client
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        openai_client = AsyncOpenAI(api_key=api_key)
        
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        if qdrant_url:
            qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
            logger.info("QdrantClient connected to remote Qdrant Cloud instance.")
        else:
            qdrant_client = QdrantClient(host=os.getenv("QDRANT_HOST", "localhost"), port=6333)
            logger.info("QdrantClient connected to local Qdrant server.")
            
        logger.info("AsyncOpenAI client initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing AI components: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    init_db()
    await init_ai_components()
    yield
    # Shutdown actions

app = FastAPI(
    title="AI Portfolio Copilot API Gateway",
    version="1.0.0",
    description="API Gateway for tracking visitor behavior and personalized chatbot interactions.",
    lifespan=lifespan
)

# Prometheus Metrics
REQUEST_COUNT = Counter(
    "api_requests_total",
    "Total number of HTTP requests processed by API Gateway",
    ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "api_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"]
)
CHATBOT_QUERIES = Counter(
    "chatbot_queries_total",
    "Total number of chatbot queries sent to API Gateway",
    ["session_id", "category"]
)
LLM_LATENCY = Histogram(
    "chatbot_llm_duration_seconds",
    "Duration of LLM API calls in seconds"
)

# Extended observability metrics
PORTFOLIO_SESSIONS = Counter(
    "portfolio_sessions_total",
    "Total unique browsing sessions",
    ["session_id"]
)
RESUME_DOWNLOADS = Counter(
    "resume_download_total",
    "Total resume downloads",
    ["session_id"]
)
PROJECT_VIEWS = Counter(
    "project_view_total",
    "Total project page views",
    ["project", "session_id"]
)
CACHE_HITS = Counter(
    "cache_hits_total",
    "Total cache hits",
    ["key_prefix"]
)
CACHE_MISSES = Counter(
    "cache_misses_total",
    "Total cache misses",
    ["key_prefix"]
)
RATE_LIMIT_TRIGGERS = Counter(
    "rate_limit_trigger_total",
    "Total rate limit events",
    ["endpoint", "session_id"]
)
CHATBOT_INPUT_TOKENS = Counter(
    "chatbot_input_tokens_total",
    "Total input tokens consumed",
    ["session_id", "model"]
)
CHATBOT_OUTPUT_TOKENS = Counter(
    "chatbot_output_tokens_total",
    "Total output tokens consumed",
    ["session_id", "model"]
)
CHATBOT_COST_USD = Counter(
    "chatbot_cost_usd_total",
    "Total estimated AI cost in USD",
    ["session_id", "model"]
)
SESSION_DURATION = Histogram(
    "session_duration_seconds",
    "Session duration in seconds",
    ["session_id"]
)
SCROLL_DEPTH = Histogram(
    "scroll_depth_reached",
    "Maximum scroll depth reached",
    ["session_id", "depth_percentile"]
)
ACTIVE_SESSIONS = Gauge(
    "active_sessions",
    "Currently connected visitors"
)

COST_PER_MODEL = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
}

# Active session tracking
active_session_heartbeats = {}

# SSE request stream — in-memory request log (last 100 requests)
request_log = deque(maxlen=100)
sse_clients: set = set()

# Prometheus middleware for tracking request count and latency
@app.middleware("http")
async def prometheus_middleware(request, call_next):
    method = request.method
    endpoint = request.url.path
    
    # Exclude /metrics and /api/v1/health from metrics
    if endpoint == "/metrics" or endpoint == "/api/v1/health":
        return await call_next(request)
        
    import time
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    status_code = response.status_code

    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status_code).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)

    # Log HTTP requests to SQLite for Dashboard stats
    try:
        req_payload = {
            "method": method,
            "endpoint": endpoint,
            "status": status_code,
            "duration": duration
        }
        # Run asynchronously or directly as it is very fast in SQLite
        save_event_to_sqlite_direct("api_request", "http_request", req_payload)
    except Exception as db_err:
        logger.error(f"Failed to log HTTP request to SQLite: {db_err}")

    # Broadcast to SSE clients (T-05.3-01: only method, path, status, duration — no bodies/params)
    entry = {
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "method": method,
        "path": endpoint,
        "status": status_code,
        "duration_ms": round(duration * 1000),
    }
    request_log.append(entry)
    # Broadcast to SSE clients (limit to 10 concurrent connections — T-05.3-02)
    if sse_clients:
        for client_queue in list(sse_clients):
            try:
                client_queue.put_nowait(entry)
            except asyncio.QueueFull:
                pass  # Drop events if client queue is full

    return response

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class TrackingEvent(BaseModel):
    session_id: str = Field(..., description="Unique UUID representing the client session")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC event timestamp")
    event_type: str = Field(..., description="Type of event e.g., page_view, project_click, scroll, chat_query")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Custom event metadata properties")

def save_event_to_sqlite_direct(session_id: str, event_type: str, payload: dict, timestamp: Optional[str] = None):
    try:
        conn = Database.get_conn()
        cursor = conn.cursor()
        ts = timestamp or datetime.utcnow().isoformat()
        placeholder = Database.param_placeholder()
        cursor.execute(
            f"INSERT INTO tracking_events (session_id, timestamp, event_type, payload) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})",
            (session_id, ts, event_type, json.dumps(payload))
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error saving direct event to database: {e}")

# DB insertion background task
def save_event_to_sqlite(event: TrackingEvent):
    """Saves event data into SQLite fallback database in a background thread."""
    save_event_to_sqlite_direct(event.session_id, event.event_type, event.payload, event.timestamp.isoformat())

# Kafka publishing removed

@app.post("/api/v1/track", status_code=status.HTTP_202_ACCEPTED)
async def track_event(event: Union[TrackingEvent, List[TrackingEvent]], background_tasks: BackgroundTasks):
    """
    Receives and processes tracking events asynchronously.
    Supports both a single event object and a batch list of event objects.
    Saves immediately to SQLite in the background, and forwards to Kafka if available.
    Also increments corresponding Prometheus metrics for user behavior analytics.
    """
    events = event if isinstance(event, list) else [event]
    
    for ev in events:
        # 1. Update Prometheus metrics based on event type
        try:
            if ev.event_type == "scroll_depth":
                pct = ev.payload.get("percent", 0)
                SCROLL_DEPTH.labels(session_id=ev.session_id, depth_percentile=str(pct)).observe(float(pct))
            elif ev.event_type == "project_click":
                proj = ev.payload.get("project_id", "unknown")
                PROJECT_VIEWS.labels(project=proj, session_id=ev.session_id).inc()
            elif ev.event_type == "resume_download":
                RESUME_DOWNLOADS.labels(session_id=ev.session_id).inc()
        except Exception as e:
            logger.error(f"Error updating Prometheus metrics from tracking event: {e}")

        # 2. Add background job to save event to local SQLite database (non-blocking)
        background_tasks.add_task(save_event_to_sqlite, ev)
        
        # 3. Kafka publishing removed
        
    return {"status": "accepted", "message": f"{len(events)} events processed successfully"}

class HeartbeatRequest(BaseModel):
    session_id: str

@app.post("/api/v1/heartbeat", status_code=status.HTTP_200_OK)
async def session_heartbeat(req: HeartbeatRequest):
    """Updates active session heartbeat for real-time visitor tracking."""
    import time
    active_session_heartbeats[req.session_id] = time.time()
    # Clean up stale sessions (no heartbeat for 120s)
    now = time.time()
    stale = [sid for sid, ts in active_session_heartbeats.items() if now - ts > 120]
    for sid in stale:
        del active_session_heartbeats[sid]
    ACTIVE_SESSIONS.set(len(active_session_heartbeats))
    return {"status": "ok", "active_sessions": len(active_session_heartbeats)}

@app.post("/api/v1/resume-download", status_code=status.HTTP_202_ACCEPTED)
async def track_resume_download(req: HeartbeatRequest):
    """Tracks resume download events."""
    RESUME_DOWNLOADS.labels(session_id=req.session_id).inc()
    return {"status": "accepted"}

@app.post("/api/v1/project-view", status_code=status.HTTP_202_ACCEPTED)
async def track_project_view(req: HeartbeatRequest, project: str = ""):
    """Tracks project case study views."""
    PROJECT_VIEWS.labels(project=project or "unknown", session_id=req.session_id).inc()
    return {"status": "accepted"}

@app.get("/api/v1/health")
async def health_check():
    """Returns the gateway health and connector statuses."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "kafka_connected": kafka_available,
        "sqlite_database_path": DB_PATH
    }

@app.get("/metrics")
async def metrics():
    """Exposes Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

MAX_SSE_CLIENTS = 10

@app.get("/api/v1/stream")
async def request_stream():
    """
    SSE endpoint for live request stream (T-05.3-01, T-05.3-02).
    Only exposes method, path, status, duration — no request/response bodies,
    no query params, no session IDs.
    """
    if len(sse_clients) >= MAX_SSE_CLIENTS:
        return Response(content="Too many SSE connections", status_code=503)

    async def event_generator():
        client_queue = asyncio.Queue(maxsize=50)
        sse_clients.add(client_queue)
        try:
            # Send existing log first (T-05.3-01: sanitized entries only)
            for existing_entry in list(request_log):
                yield f"data: {json.dumps(existing_entry)}\n\n"
            # Then stream new events
            while True:
                entry = await client_queue.get()
                yield f"data: {json.dumps(entry)}\n\n"
        finally:
            sse_clients.discard(client_queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Visitor's session ID")
    message: str = Field(..., description="Visitor's chat question")

def generate_mock_answer(message: str, contexts: List[str], score: int, category: str) -> str:
    """Fallback response generator if LLM API is unavailable."""
    message_lower = message.lower()
    prefix = ""
    if score >= 30:
        prefix = f"[AI Assistant: Welcome back! I noticed you are deeply engaged with my portfolio (Engagement Score: {score}, main interest: {category})!]\n\n"
        
    if category == "contact" or "contact" in message_lower or "email" in message_lower or "phone" in message_lower:
        return prefix + "You can contact Quoc via email at kuokdavinci@gmail.com, phone 0768040802, or find him on GitHub (github.com/kuokdavinci) and LinkedIn (linkedin.com/in/kuokdavinci)."
    elif category == "education" or "school" in message_lower or "university" in message_lower or "hcmus" in message_lower or "vinuni" in message_lower:
        return prefix + "Quoc graduated from HCMUS (University of Science - Ho Chi Minh City) with a GPA of 3.1/4.0 in October 2025, and is currently enrolled in the AI in Action program at VinUni."
    elif category == "experience" or "experience" in message_lower or "intern" in message_lower or "company" in message_lower:
        return prefix + "Quoc worked as a Software Engineer Intern at Phu An Phuoc Investment Company from March to June 2024."
    elif category == "skills" or category == "competencies" or "skill" in message_lower or "tech" in message_lower:
        return prefix + "Quoc's core competencies include backend (Spring Boot, Java, PostgreSQL), mobile development (Flutter, Dart, Firebase), AI/ML, and he is currently exploring distributed systems, microservices, and fintech domain knowledge."
    elif "project" in message_lower:
        ans = "Here are some of Quoc's projects: "
        proj_contexts = [c for c in contexts if "System" in c or "App" in c or "Booking" in c]
        if proj_contexts:
            ans += " ".join(proj_contexts)
        else:
            ans += "Movie Ticket Booking System (Spring Boot + Flutter) and Attendance Tracking App (Flutter + Firebase)."
        return prefix + ans
    else:
        return prefix + (contexts[0] if contexts else "Hi there! I am Quoc's AI Assistant. Ask me anything about his skills, experience, or projects.")

@app.post("/api/v1/chat")
async def chat(request: ChatRequest):
    """
    Personalized chatbot RAG endpoint.
    Retrieves session engagement features from Feast Online Store, 
    retrieves knowledge context from Qdrant vector database, 
    and constructs a personalized system prompt for Gemini LLM response generation.
    """
    global embedding_model, qdrant_client, chat_history
    
    # 1. Fetch visitor features from Feast Online Store (Redis)
    engagement_score = 0
    last_viewed_category = "General"
    chat_count = 0
    
    try:
        repo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "feature_store"))
        if os.path.exists(repo_path):
            from feast import FeatureStore
            store = FeatureStore(repo_path=repo_path)
            
            entity_rows = [{"session_id": request.session_id}]
            features_to_fetch = [
                "session_features:engagement_score",
                "session_features:last_viewed_category",
                "session_features:chat_count"
            ]
            
            features_res = store.get_online_features(
                features=features_to_fetch,
                entity_rows=entity_rows
            ).to_dict()
            
            if features_res.get("engagement_score") and features_res["engagement_score"][0] is not None:
                engagement_score = features_res["engagement_score"][0]
            if features_res.get("last_viewed_category") and features_res["last_viewed_category"][0] is not None:
                last_viewed_category = features_res["last_viewed_category"][0]
            if features_res.get("chat_count") and features_res["chat_count"][0] is not None:
                chat_count = features_res["chat_count"][0]
    except Exception as e:
        logger.warning(f"Feast online feature fetch failed (normal if not materialized): {e}")

    # 2. Retrieve context from Qdrant
    contexts = []
    sources = []
    route = route_query(request.message)
    query_category = route.category if route else "general"
    
    # Increment chatbot query metric with category
    CHATBOT_QUERIES.labels(session_id=request.session_id, category=query_category).inc()
    
    if qdrant_client and openai_client:
        try:
            route = route_query(request.message)
            # Rule-based intent detection
            boost = detect_boost(request.message)
            top_k = get_dynamic_top_k(request.message, boost)
            
            if top_k > 0:
                # Generate query embedding using OpenAI
                embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
                emb_resp = await openai_client.embeddings.create(
                    input=request.message,
                    model=embedding_model
                )
                query_vector = emb_resp.data[0].embedding
                
                qdrant_filter = build_qdrant_filter(boost)
                
                # General vector search (fetch more for parent-child merge)
                general_results = qdrant_client.query_points(
                    collection_name="portfolio_knowledge",
                    query=query_vector,
                    limit=8,
                ).points
                
                # Filtered search if rule matched
                filtered_results = []
                if qdrant_filter:
                    filtered_results = qdrant_client.query_points(
                        collection_name="portfolio_knowledge",
                        query=query_vector,
                        query_filter=qdrant_filter,
                        limit=5,
                    ).points
                
                # Merge with parent-child awareness
                search_results = merge_parent_child(
                    general_results, filtered_results,
                    boost=boost,
                    top_k=top_k,
                )
                
                for hit in search_results:
                    contexts.append(hit.payload.get("text", ""))
                    metadata = hit.payload.get("metadata", {})
                    category = hit.payload.get("category", "")
                    if (category == "project" or category == "project_detail") and metadata.get("project_id"):
                        proj_id = metadata.get("project_id")
                        if proj_id in ("legal-edu-app", "legal-edu", "edurag-app"):
                            proj_id = "edurag"
                        title_map_proj = {
                            "edurag-app": "EduRAG - Vietnamese Education Law RAG",
                            "attendance-app": "Attendance Tracking App",
                            "movie-ticket": "Movie Ticket Booking System",
                            "movie-ticket-app": "Movie Ticket Booking System",
                        }
                        sources.append({
                            "title": title_map_proj.get(proj_id, metadata.get("doc_title", proj_id)),
                            "link": f"#/project/{proj_id}"
                        })
                    elif category in ("personal_info", "education", "experience", "skills", "competencies"):
                        title_map = {
                            "personal_info": "Personal Info",
                            "education": "Education",
                            "experience": "Experience",
                            "skills": "Skills",
                            "competencies": "Competencies",
                        }
                        sources.append({
                            "title": title_map.get(category, "Portfolio Profile"),
                            "link": f"#/profile/{category}"
                        })
                    elif category == "contact" and metadata.get("github"):
                        sources.append({
                            "title": "GitHub Profile",
                            "link": "https://github.com/kuokdavinci"
                        })
                
                # Deduplicate sources by link
                seen_links = set()
                dedup_sources = []
                for s in sources:
                    if s["link"] not in seen_links:
                        seen_links.add(s["link"])
                        dedup_sources.append(s)
                sources = dedup_sources
        except Exception as e:
            logger.error(f"Error searching Qdrant collection: {e}")
            
    if not contexts:
        contexts.append(generate_mock_answer(request.message, [], 0, query_category))
 
    # 3. Call LLM (OpenAI Chat Completions API)
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    response_text = ""
    system_instruction = f"""You are Lê Trung Anh Quốc's AI Portfolio Assistant, an intelligent, helpful agent representing Quoc.
You will answer questions about Quoc's projects, skills, education, experience, and contact info.
 
Here is some retrieved context from Quoc's knowledge base to help you answer:
{chr(10).join("- " + c for c in contexts)}
 
Here is the current visitor's session information retrieved from the Feast Feature Store:
- Engagement Score: {engagement_score} (This indicates how thoroughly they have browsed the portfolio. Scale: 0 to 100+. High scores indicate a very interested recruiter/visitor).
- Last Category Viewed: {last_viewed_category} (The domain they are currently looking at).
- Chat Count: {chat_count} (Number of questions asked in this session).
 
CRITICAL GUARDRAIL & FOCUS RULES:
1. STRICT PORTFOLIO FOCUS: You must ONLY answer questions, write code, or perform tasks related to Lê Trung Anh Quốc (Quoc), his projects, skills, experience, contact details, or education.
2. POLITELY DECLINE UNRELATED REQUESTS: If the user asks you to write unrelated code, answer general knowledge questions (e.g., "What is the capital of France?", "How to make cookies"), tell jokes, translate unrelated text, write essays, or perform any tasks not related to Quoc or his portfolio, you MUST politely decline.
   - Example Vietnamese decline: "Xin lỗi, tôi là trợ lý ảo đại diện cho Lê Trung Anh Quốc. Tôi chỉ hỗ trợ giải đáp các câu hỏi liên quan đến kỹ năng, dự án, học vấn và thông tin liên hệ của Quốc. Bạn có câu hỏi nào về Quốc không?"
   - Example English decline: "I'm sorry, but I am an AI Assistant representing Lê Trung Anh Quốc. I only answer questions related to Quoc's projects, skills, education, and contact details. How can I help you with those topics?"
3. CLARIFY AMBIGUOUS QUERIES: If the user's request is vague or ambiguous but seems like it might be related to Quoc's domains, politely ask them to clarify what they want to know about Quoc or his portfolio.
 
CRITICAL ANSWER SYNTHESIS & FORMATTING RULES:
1. SELECTIVE SYNTHESIS: Read all the retrieved context chunks carefully. Select, synthesize, and summarize only the facts directly relevant to answering the user's question. Avoid simply copy-pasting the raw context or listing chunks one by one.
2. STRUCTURING WITH MARKDOWN: Always structure your response beautifully using standard Markdown. Use bullet points (`- `) for lists, bold text (`**`) for emphasis, inline code (`` ` ``) for technical terms/skills, and clean paragraph breaks (`\n\n`).
3. TONE & CONCISENESS: Keep your answers natural, warm, conversational, yet concise and professional.
4. START BRIEF, OFFER DEPTH: Always start with a concise 2-4 sentence summary that directly answers the question. Then offer the user to dive deeper into specific aspects. For example: "Want to know more about the architecture?", "Should I go into detail on the tech stack?", "Ask me about the challenges and solutions if you're interested."
 
ADAPT YOUR TONE AND FOCUS BASED ON USER ENGAGEMENT:
- If the visitor's Engagement Score is high (e.g. >= 30), recognize their high interest! Be proactive, warm, and professional. Proactively suggest checking out Quoc's GitHub/LinkedIn or offering to download Quoc's CV, or scheduling a meeting.
- Tailor your highlights to the "Last Category Viewed" if relevant. For example, if it is "Mobile", highlight Quoc's Flutter/Dart skills. If it is "Full-stack & Mobile", highlight Spring Boot, Java, and PostgreSQL.
- Speak in the same language as the visitor's query (English or Vietnamese).
- Never make up information not supported by the context. If you don't know, say so.
- IMPORTANT: If the visitor's query is a simple greeting (e.g. "hi", "hello", "chào bạn") or a general conversation that doesn't ask about projects or links, respond politely and briefly WITHOUT listing or introducing projects or links. Do not reference sources unless the user's question is actually about projects, contact details, or experience.
"""
 
    if openai_client:
        try:
            import time
            start_llm = time.time()
            
            # Build conversation history
            session_history = chat_history.get(request.session_id, [])
            
            # Construct messages list for LLM
            llm_messages = [{"role": "system", "content": system_instruction}]
            
            # Append last 8 turns of history to prevent token bloat
            for msg in session_history[-8:]:
                llm_messages.append(msg)
                
            # Append current user message
            llm_messages.append({"role": "user", "content": request.message})
            
            completion = await openai_client.chat.completions.create(
                model=model_name,
                messages=llm_messages,
                temperature=0.3
            )
            
            # Observe latency
            LLM_LATENCY.observe(time.time() - start_llm)
            response_text = completion.choices[0].message.content.strip()
            
            # Track token usage and cost
            usage = getattr(completion, 'usage', None)
            prompt_tokens = 0
            completion_tokens = 0
            cost_usd = 0.0
            if usage:
                prompt_tokens = getattr(usage, 'prompt_tokens', 0)
                completion_tokens = getattr(usage, 'completion_tokens', 0)
                CHATBOT_INPUT_TOKENS.labels(session_id=request.session_id, model=model_name).inc(prompt_tokens)
                CHATBOT_OUTPUT_TOKENS.labels(session_id=request.session_id, model=model_name).inc(completion_tokens)
                
                cost_cfg = COST_PER_MODEL.get(model_name, COST_PER_MODEL["gpt-4o-mini"])
                cost_usd = (prompt_tokens * cost_cfg["input"] + completion_tokens * cost_cfg["output"]) / 1_000_000
                CHATBOT_COST_USD.labels(session_id=request.session_id, model=model_name).inc(cost_usd)
            
            # Save to SQLite database for dashboard metrics
            try:
                chat_payload = {
                    "query": request.message,
                    "category": query_category,
                    "cost": cost_usd,
                    "duration": time.time() - start_llm,
                    "tokens_in": prompt_tokens,
                    "tokens_out": completion_tokens
                }
                save_event_to_sqlite_direct(request.session_id, "chat_query", chat_payload)
            except Exception as db_err:
                logger.error(f"Failed to log chat query to SQLite: {db_err}")
            
            # Save new turn to session history
            if request.session_id not in chat_history:
                chat_history[request.session_id] = []
            chat_history[request.session_id].append({"role": "user", "content": request.message})
            chat_history[request.session_id].append({"role": "assistant", "content": response_text})
        except Exception as e:
            logger.error(f"Failed to generate answer from OpenAI: {e}")
            
    if not response_text:
        response_text = generate_mock_answer(request.message, contexts, engagement_score, route.category if 'route' in locals() else last_viewed_category)
        # Log mock chat query to SQLite
        try:
            chat_payload = {
                "query": request.message,
                "category": query_category,
                "cost": 0.00005,
                "duration": 0.35,
                "tokens_in": 35,
                "tokens_out": 85
            }
            save_event_to_sqlite_direct(request.session_id, "chat_query", chat_payload)
        except Exception as db_err:
            logger.error(f"Failed to log mock chat query to SQLite: {db_err}")
        
    # Filter sources based on whether they are relevant to the generated answer or query
    filtered_sources = []
    response_lower = response_text.lower()
    query_lower = request.message.lower()
    for s in sources:
        title_lower = s["title"].lower()
        project_id = ""
        if "/project/" in s["link"]:
            project_id = s["link"].split("/project/")[-1].lower()
            
        if title_lower in response_lower or (project_id and project_id in response_lower):
            filtered_sources.append(s)
        elif (project_id and project_id in query_lower) or ("project" in query_lower and project_id):
            filtered_sources.append(s)
        elif "github" in title_lower and ("github" in response_lower or "github" in query_lower or "contact" in response_lower or "contact" in query_lower):
            filtered_sources.append(s)

    return {
        "answer": response_text,
        "sources": filtered_sources
    }

@app.get("/api/v1/telemetry/query")
async def prometheus_mock_query(query: str):
    """
    Parses a Prometheus query string and returns aggregate metrics 
    calculated directly from the SQLite tracking database.
    """
    now_sec = int(time.time())
    result = []
    
    try:
        conn = Database.get_conn()
        cursor = conn.cursor()
        
        # 1. Chatbot queries by category
        if "chatbot_queries_total" in query and ("by" in query or "sum" in query) and "category" in query:
            cursor.execute("SELECT payload, COUNT(*) FROM tracking_events WHERE event_type = 'chat_query' GROUP BY payload")
            rows = cursor.fetchall()
            category_counts = {}
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    cat = payload.get("category", "general")
                    cat_map = {
                        "RAG Retrieval": "RAG Retrieval",
                        "rag": "RAG Retrieval",
                        "RAG": "RAG Retrieval",
                        "project": "Project Detail",
                        "project_detail": "Project Detail",
                        "skills": "Skills Audit",
                        "general": "General Info",
                        "general_info": "General Info",
                        "chitchat": "Chitchat",
                        "greeting": "Chitchat"
                    }
                    display_cat = cat_map.get(cat, cat)
                    category_counts[display_cat] = category_counts.get(display_cat, 0) + row[1]
                except Exception:
                    pass
            for cat, count in category_counts.items():
                result.append({
                    "metric": {"category": cat},
                    "value": [now_sec, str(count)]
                })
                
        # 2. Total chatbot queries
        elif "chatbot_queries_total" in query:
            cursor.execute("SELECT COUNT(*) FROM tracking_events WHERE event_type = 'chat_query'")
            count = cursor.fetchone()[0]
            result.append({
                "metric": {},
                "value": [now_sec, str(count)]
            })
            
        # 3. Cost rate (last 24h)
        elif "chatbot_cost_usd_total" in query and "rate" in query:
            one_day_ago = (datetime.utcnow() - timedelta(days=1)).isoformat()
            placeholder = Database.param_placeholder()
            cursor.execute(f"SELECT payload FROM tracking_events WHERE event_type = 'chat_query' AND timestamp > {placeholder}", (one_day_ago,))
            rows = cursor.fetchall()
            total_cost = 0.0
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    total_cost += float(payload.get("cost", 0.0))
                except Exception:
                    pass
            rate = total_cost / 86400.0
            result.append({
                "metric": {},
                "value": [now_sec, f"{rate:.8f}"]
            })
            
        # 4. Total Cost
        elif "chatbot_cost_usd_total" in query:
            cursor.execute("SELECT payload FROM tracking_events WHERE event_type = 'chat_query'")
            rows = cursor.fetchall()
            total_cost = 0.0
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    total_cost += float(payload.get("cost", 0.0))
                except Exception:
                    pass
            result.append({
                "metric": {},
                "value": [now_sec, f"{total_cost:.4f}"]
            })
            
        # 5. Total unique sessions
        elif "portfolio_sessions_total" in query or "sessions" in query:
            cursor.execute("SELECT COUNT(DISTINCT session_id) FROM tracking_events")
            count = cursor.fetchone()[0]
            result.append({
                "metric": {},
                "value": [now_sec, str(count)]
            })
            
        # 6. Active sessions (heartbeat within 120s)
        elif "active_sessions" in query:
            active_count = len(active_session_heartbeats)
            result.append({
                "metric": {},
                "value": [now_sec, str(max(1, active_count))]
            })
            
        # 7. Resume downloads total
        elif "resume_download_total" in query:
            cursor.execute("SELECT COUNT(*) FROM tracking_events WHERE event_type = 'resume_download'")
            count = cursor.fetchone()[0]
            result.append({
                "metric": {},
                "value": [now_sec, str(count)]
            })
            
        # 8. Project views by project
        elif "project_view_total" in query or "project_case_study_views_total" in query:
            cursor.execute("SELECT payload, COUNT(*) FROM tracking_events WHERE event_type = 'project_click' GROUP BY payload")
            rows = cursor.fetchall()
            project_counts = {}
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    proj = payload.get("project_id", "unknown")
                    project_counts[proj] = project_counts.get(proj, 0) + row[1]
                except Exception:
                    pass
            for proj, count in project_counts.items():
                result.append({
                    "metric": {"project": proj},
                    "value": [now_sec, str(count)]
                })
                
        # 9. API request duration quantile (p50, p95, p99)
        elif "api_request_duration_seconds_bucket" in query or "histogram_quantile" in query:
            cursor.execute("SELECT payload FROM tracking_events WHERE event_type = 'http_request'")
            rows = cursor.fetchall()
            durations = []
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    durations.append(float(payload.get("duration", 0.0)))
                except Exception:
                    pass
            
            if not durations:
                durations = [0.08, 0.12, 0.15]
                
            durations.sort()
            n = len(durations)
            
            q = 0.5
            if "0.95" in query:
                q = 0.95
            elif "0.99" in query:
                q = 0.99
                
            idx = max(0, min(n - 1, int(n * q)))
            val = durations[idx]
            
            result.append({
                "metric": {},
                "value": [now_sec, f"{val:.4f}"]
            })
            
        # 10. API request counts by status
        elif "api_requests_total" in query and "status" in query:
            cursor.execute("SELECT payload, COUNT(*) FROM tracking_events WHERE event_type = 'http_request' GROUP BY payload")
            rows = cursor.fetchall()
            status_counts = {}
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    status = str(payload.get("status", 200))
                    status_counts[status] = status_counts.get(status, 0) + row[1]
                except Exception:
                    pass
            for stat, count in status_counts.items():
                result.append({
                    "metric": {"status": stat},
                    "value": [now_sec, str(count)]
                })
                
        # 11. API request counts by endpoint
        elif "api_requests_total" in query and "endpoint" in query:
            cursor.execute("SELECT payload, COUNT(*) FROM tracking_events WHERE event_type = 'http_request' GROUP BY payload")
            rows = cursor.fetchall()
            endpoint_counts = {}
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    ep = payload.get("endpoint", "/api/v1/chat")
                    endpoint_counts[ep] = endpoint_counts.get(ep, 0) + row[1]
                except Exception:
                    pass
            for ep, count in endpoint_counts.items():
                result.append({
                    "metric": {"endpoint": ep},
                    "value": [now_sec, str(count)]
                })
                
        # 12. Total API requests
        elif "api_requests_total" in query:
            cursor.execute("SELECT COUNT(*) FROM tracking_events WHERE event_type = 'http_request'")
            count = cursor.fetchone()[0]
            result.append({
                "metric": {},
                "value": [now_sec, str(count)]
            })
            
        # 13. Scroll depth by bucket
        elif "scroll_depth_reached_bucket" in query or "scroll_depth" in query:
            cursor.execute("SELECT payload, COUNT(*) FROM tracking_events WHERE event_type = 'scroll_depth' GROUP BY payload")
            rows = cursor.fetchall()
            depth_counts = {}
            for row in rows:
                try:
                    payload = json.loads(row[0])
                    pct = str(payload.get("percent", 50))
                    depth_counts[pct] = depth_counts.get(pct, 0) + row[1]
                except Exception:
                    pass
            for pct, count in depth_counts.items():
                result.append({
                    "metric": {"depth_percentile": pct, "depth": pct},
                    "value": [now_sec, str(count)]
                })
                
        # 14. Kubernetes / restarts fallback
        elif "kube_pod" in query or "restarts" in query or "restart_count" in query:
            result.append({
                "metric": {"container": "backend"},
                "value": [now_sec, "0"]
            })
            
        # 15. Container start time fallback
        elif "container_start_time_seconds" in query:
            result.append({
                "metric": {"container": "backend"},
                "value": [now_sec, "1717056000"]
            })
            
        conn.close()
    except Exception as e:
        logger.error(f"Error executing mock query in SQLite: {e}")
        
    return {
        "status": "success",
        "data": {
            "resultType": "vector",
            "result": result
        }
    }

@app.get("/api/v1/telemetry/query_range")
async def prometheus_mock_query_range(query: str, start: str, end: str, step: str = "5m"):
    """
    Parses a Prometheus query_range string and returns data points 
    simulated or queried from SQLite.
    """
    now_sec = int(time.time())
    result = []
    points = 12
    
    timestamps = [now_sec - i * 300 for i in range(points - 1, -1, -1)]
    
    if "api_requests_total" in query:
        values = []
        for ts in timestamps:
            rate = 1.5 + math.sin(ts / 1000) * 0.5 + random.random() * 0.5
            values.append([ts, f"{rate:.2f}"])
        result.append({
            "metric": {},
            "values": values
        })
    elif "api_request_duration_seconds" in query or "duration" in query:
        isP95 = "0.95" in query
        values = []
        for ts in timestamps:
            base = 0.18 if isP95 else 0.04
            val = base + random.random() * (0.05 if isP95 else 0.015)
            values.append([ts, f"{val:.4f}"])
        result.append({
            "metric": {},
            "values": values
        })
    elif "chatbot_llm_duration_seconds" in query:
        values = []
        for ts in timestamps:
            val = 1.6 + math.sin(ts / 5000) * 0.3 + random.random() * 0.4
            values.append([ts, f"{val:.2f}"])
        result.append({
            "metric": {},
            "values": values
        })
    elif "chatbot_input_tokens_total" in query or "tokens" in query:
        values = []
        for ts in timestamps:
            val = int(2400 + math.sin(ts / 10000) * 400 + random.random() * 200)
            values.append([ts, str(val)])
        result.append({
            "metric": {},
            "values": values
        })
    else:
        values = [[ts, "0"] for ts in timestamps]
        result.append({
            "metric": {},
            "values": values
        })
        
    return {
        "status": "success",
        "data": {
            "resultType": "matrix",
            "result": result
        }
    }
