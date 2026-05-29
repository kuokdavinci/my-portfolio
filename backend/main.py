import os
import json
import logging
import asyncio
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, BackgroundTasks, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from aiokafka import AIOKafkaProducer

from qdrant_client import QdrantClient
from openai import AsyncOpenAI
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

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

# Global Kafka variables
kafka_producer: Optional[AIOKafkaProducer] = None
kafka_available = False

def init_sqlite_db():
    """Initializes the SQLite fallback database and creates the events table."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
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
    logger.info(f"SQLite fallback database initialized at: {DB_PATH}")

async def init_kafka_producer():
    """Attempts to initialize AIOKafkaProducer with a strict timeout to prevent blocking startup."""
    global kafka_producer, kafka_available
    try:
        kafka_producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            request_timeout_ms=500,
            api_version="auto"
        )
        # Attempt connect with a 500ms timeout
        await asyncio.wait_for(kafka_producer.start(), timeout=0.5)
        kafka_available = True
        logger.info(f"Connected to Kafka broker at {KAFKA_BOOTSTRAP_SERVERS}")
    except Exception as e:
        kafka_available = False
        kafka_producer = None
        logger.warning(f"Kafka broker offline or timeout at {KAFKA_BOOTSTRAP_SERVERS}. Falling back to SQLite only. Details: {e}")

async def close_kafka_producer():
    """Gracefully closes the Kafka producer on shutdown."""
    global kafka_producer, kafka_available
    if kafka_producer:
        try:
            await kafka_producer.stop()
            logger.info("Kafka producer stopped successfully.")
        except Exception as e:
            logger.error(f"Error stopping Kafka producer: {e}")
        finally:
            kafka_producer = None
            kafka_available = False

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
        qdrant_client = QdrantClient(host=os.getenv("QDRANT_HOST", "localhost"), port=6333)
        logger.info("AsyncOpenAI client and QdrantClient initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing AI components: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    init_sqlite_db()
    await init_kafka_producer()
    await init_ai_components()
    yield
    # Shutdown actions
    await close_kafka_producer()

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

# DB insertion background task
def save_event_to_sqlite(event: TrackingEvent):
    """Saves event data into SQLite fallback database in a background thread."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tracking_events (session_id, timestamp, event_type, payload) VALUES (?, ?, ?, ?)",
            (event.session_id, event.timestamp.isoformat(), event.event_type, json.dumps(event.payload))
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error saving tracking event to SQLite: {e}")

async def push_event_to_kafka(event: TrackingEvent):
    """Sends event data to Kafka topic raw activity channel asynchronously."""
    global kafka_producer, kafka_available
    if not kafka_available or kafka_producer is None:
        return
    
    try:
        event_json = event.model_dump_json()
        await kafka_producer.send_and_wait(KAFKA_TOPIC, event_json.encode("utf-8"))
    except Exception as e:
        logger.error(f"Error sending tracking event to Kafka: {e}")

@app.post("/api/v1/track", status_code=status.HTTP_202_ACCEPTED)
async def track_event(event: TrackingEvent, background_tasks: BackgroundTasks):
    """
    Receives and processes tracking events asynchronously.
    Saves immediately to SQLite in the background, and forwards to Kafka if available.
    """
    # 1. Add background job to save event to local SQLite database (non-blocking)
    background_tasks.add_task(save_event_to_sqlite, event)
    
    # 2. Add background job to push to Kafka asynchronously if Kafka is connected
    if kafka_available:
        background_tasks.add_task(push_event_to_kafka, event)
        
    return {"status": "accepted", "message": "Event is being processed"}

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
    
    # Increment chatbot query metric
    CHATBOT_QUERIES.labels(session_id=request.session_id).inc()
    
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
            
            # Save new turn to session history
            if request.session_id not in chat_history:
                chat_history[request.session_id] = []
            chat_history[request.session_id].append({"role": "user", "content": request.message})
            chat_history[request.session_id].append({"role": "assistant", "content": response_text})
        except Exception as e:
            logger.error(f"Failed to generate answer from OpenAI: {e}")
            
    if not response_text:
            response_text = generate_mock_answer(request.message, contexts, engagement_score, route.category if 'route' in locals() else last_viewed_category)
        
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
