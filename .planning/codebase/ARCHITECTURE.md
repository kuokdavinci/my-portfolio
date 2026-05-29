# Architecture

**Analysis Date:** 2026-05-29

## Pattern Overview

**Overall:** Client-server architecture with a static SPA frontend (Vite + vanilla JS) and a FastAPI backend API gateway. The backend acts as an orchestrator for AI/ML services (Qdrant vector DB, OpenAI LLM, Feast feature store) and event streaming (Kafka).

**Key Characteristics:**
- **Static SPA frontend** — built with Vite, served via Nginx in production, no framework (vanilla JS ES modules)
- **API Gateway backend** — FastAPI service that routes tracking events and chat queries to downstream services
- **Event-driven analytics pipeline** — tracking events flow from frontend → backend → Kafka (primary) / SQLite (fallback) → Prefect ETL → Feast feature store → personalized RAG responses
- **RAG chatbot** — retrieval-augmented generation using Qdrant vector search + OpenAI embeddings + OpenAI/Gemini LLM with rule-based query routing and parent-child chunk merging
- **Observability stack** — Prometheus metrics scraped from backend, visualized in Grafana dashboards

## Layers

### Frontend Layer (Presentation)
- **Purpose:** Portfolio display, user interaction, event tracking, chatbot UI
- **Location:** `src/` and `index.html`
- **Contains:** Single-page application with hash-based routing, theme toggle, scroll animations, project filtering, contact form, RAG chatbot widget
- **Depends on:** Backend API at `http://localhost:8000` for tracking and chat
- **Used by:** End users (recruiters, visitors)

### API Gateway Layer (Backend)
- **Purpose:** Receives tracking events, processes chat queries, orchestrates AI services
- **Location:** `backend/main.py`
- **Contains:** FastAPI app with `/api/v1/track` and `/api/v1/chat` endpoints, Prometheus middleware, CORS configuration, lifespan management
- **Depends on:** Qdrant, OpenAI API, Feast/Redis, Kafka, SQLite
- **Used by:** Frontend SPA

### AI/ML Service Layer
- **Purpose:** Vector search, embedding generation, LLM inference, feature retrieval
- **Location:** `backend/main.py` (orchestration), `backend/retrieval_boost.py` (routing logic), `scripts/setup_qdrant.py` (knowledge ingestion)
- **Contains:**
  - Qdrant vector search with parent-child chunk merging (`backend/retrieval_boost.py`)
  - OpenAI embedding generation and chat completions
  - Feast feature store retrieval for session personalization
  - Rule-based query routing with boost detection
- **Depends on:** OpenAI API, Qdrant container, Redis (Feast online store)
- **Used by:** API Gateway `/api/v1/chat` endpoint

### Data Pipeline Layer
- **Purpose:** Transform raw tracking events into session features for personalization
- **Location:** `backend/pipeline/`
- **Contains:**
  - Prefect ETL flow: SQLite → Parquet (`backend/pipeline/ingestion_flow.py`)
  - Feast materialization: Parquet → Redis (`backend/pipeline/materialize_feast.py`)
  - Feature definitions: Entity, FeatureView, FileSource (`backend/feature_store/features.py`)
- **Depends on:** SQLite tracking DB, Parquet files, Redis, Feast
- **Used by:** Chat endpoint for session feature retrieval

### Infrastructure Layer
- **Purpose:** Containerized services for data storage, streaming, and observability
- **Location:** `docker-compose.yml`, `Dockerfile`, `backend/Dockerfile`
- **Contains:** Qdrant, Redis, Zookeeper, Kafka, Prometheus, Grafana, Backend (FastAPI), Frontend (Nginx)
- **Used by:** All application layers

## Data Flow

### Tracking Event Flow

1. User interacts with portfolio frontend (`src/main.js`)
2. `trackEvent()` sends POST to `http://localhost:8000/api/v1/track` with session ID, event type, and payload
3. Backend receives event, immediately returns 202 Accepted
4. Background task saves event to SQLite (`backend/data/tracking_events.db`)
5. If Kafka is available, background task also pushes event to `user.activity.raw` topic
6. Prefect ETL flow (`backend/pipeline/ingestion_flow.py`) runs periodically:
   - **Extract:** Reads raw events from SQLite
   - **Transform:** Computes engagement scores, last viewed category, chat count per session
   - **Load:** Writes features to Parquet file (`backend/data/processed/user_features.parquet`)
7. Feast materialization (`backend/pipeline/materialize_feast.py`) pushes features from Parquet to Redis online store
8. Grafana dashboard visualizes metrics from Prometheus

### Chatbot RAG Flow

1. User types question in chatbot widget (`src/modules/chatbot/chatbot-ui.js`)
2. Frontend sends POST to `http://localhost:8000/api/v1/chat` with session ID and message
3. Backend increments Prometheus `chatbot_queries_total` metric
4. **Feature retrieval:** Fetches session engagement score, last viewed category, chat count from Feast/Redis
5. **Query routing:** `route_query()` in `backend/retrieval_boost.py` classifies intent (project, contact, education, skills, etc.)
6. **Boost detection:** `detect_boost()` matches keywords to Qdrant filter rules
7. **Embedding:** Generates query embedding via OpenAI `text-embedding-3-small`
8. **Vector search:** Queries Qdrant `portfolio_knowledge` collection with both general and filtered searches
9. **Parent-child merge:** `merge_parent_child()` combines results ensuring parent context is included
10. **LLM generation:** Sends system prompt (with retrieved context + session features) to OpenAI `gpt-4o-mini`
11. **Response:** Returns answer + filtered source links to frontend
12. **Fallback:** If LLM unavailable, uses `generate_mock_answer()` with rule-based responses
13. **Frontend fallback:** If backend API fails entirely, uses local RAG (`src/modules/chatbot/chatbot-rag.js`) with token-based scoring

### Knowledge Ingestion Flow

1. Markdown documents in `knowledge_base/` are parsed by `scripts/setup_qdrant.py`
2. `personal.md` → parent chunks (one per section: personal_info, education, experience, contact, competencies, skills)
3. `*_pj.md` files → child chunks (one per `###` subsection, linked to parent by project_id)
4. Each chunk is embedded via OpenAI and upserted to Qdrant `portfolio_knowledge` collection
5. Payload includes: category, chunk_level (parent/child), text, metadata (project_id, section, parent_id)

## Key Abstractions

### Session Management
- **Purpose:** Track individual visitor sessions for analytics and personalization
- **Implementation:** UUID-like session ID stored in `sessionStorage` (`src/main.js` line 337-343)
- **Lifecycle:** Created on first page load, persists until tab close
- **Used by:** Tracking SDK, chat endpoint, Feast feature retrieval

### Retrieval Boost Rules
- **Purpose:** Map natural language queries to Qdrant filter conditions for targeted retrieval
- **Location:** `backend/retrieval_boost.py` lines 43-179
- **Pattern:** `BoostRule` dataclass with name, keywords, filter_condition, boost_factor
- **Categories:** 3 project rules (attendance, movie_ticket, edurag), 7 category rules (contact, education, experience, skills, project, personal_info, competencies)

### Parent-Child Chunking
- **Purpose:** Improve RAG recall by maintaining document hierarchy in vector search
- **Location:** `backend/retrieval_boost.py` lines 320-364, `scripts/setup_qdrant.py` lines 153-278
- **Strategy:** Parent chunks answer broad queries, child chunks answer specific queries; merge ensures parent context is included when child is matched

### Portfolio Configuration
- **Purpose:** Single source of truth for all portfolio content
- **Location:** `src/data/portfolio-config.js`
- **Structure:** Exports `portfolioConfig` object with personalInfo, projects, experience, competencies, techStack, languages, contact
- **Used by:** Frontend rendering, local chatbot knowledge base builder

## Entry Points

### Frontend Entry Point
- **Location:** `index.html` → `/src/main.js`
- **Triggers:** Browser page load
- **Responsibilities:** Initialize theme, mobile menu, scroll reveal, typing effects, counters, project filters, chatbot, hash router, tracking SDK

### Backend Entry Point
- **Location:** `backend/main.py` → FastAPI app
- **Triggers:** HTTP requests on port 8000
- **Responsibilities:** Accept tracking events, process chat queries, expose Prometheus metrics, health checks

### Knowledge Ingestion Entry Point
- **Location:** `scripts/setup_qdrant.py`
- **Triggers:** Manual execution (development/setup)
- **Responsibilities:** Parse markdown, generate embeddings, populate Qdrant collection

### ETL Pipeline Entry Point
- **Location:** `backend/pipeline/ingestion_flow.py` → `run_ingestion_flow()`
- **Triggers:** Manual or scheduled execution
- **Responsibilities:** Extract raw events, transform to features, load to Parquet

## Error Handling

**Strategy:** Graceful degradation with multiple fallback levels

**Patterns:**
- **Kafka fallback:** If Kafka broker is unavailable, events are saved to SQLite only (no streaming). Backend starts normally with warning log. (`backend/main.py` lines 68-84)
- **LLM fallback:** If OpenAI API fails, `generate_mock_answer()` provides rule-based responses based on query category (`backend/main.py` lines 253-277)
- **Backend API fallback:** If backend is unreachable, frontend chatbot uses local RAG with token-based scoring (`src/modules/chatbot/chatbot-ui.js` lines 285-294)
- **Feast fallback:** If feature store retrieval fails, engagement defaults to 0, category to "General" (`backend/main.py` lines 321-322)
- **Qdrant fallback:** If vector search fails, contexts remain empty and mock answer is used (`backend/main.py` lines 407-412)

## Cross-Cutting Concerns

**Logging:** Python `logging` module with INFO level in backend (`backend/main.py` line 37). Frontend uses `console.warn`/`console.error` for non-critical issues.

**Validation:** Pydantic models for API request/response schemas (`TrackingEvent`, `ChatRequest` in `backend/main.py` lines 186-251).

**Authentication:** None for portfolio viewing. OpenAI API key required via `OPENAI_API_KEY` environment variable for chat functionality.

**CORS:** Backend allows all origins (`allow_origins=["*"]`) for local development (`backend/main.py` lines 177-183).

**Session tracking:** UUID-like session IDs generated client-side, stored in `sessionStorage`, sent with every tracking event and chat query.

**Prometheus metrics:** Middleware tracks request count, latency, and chatbot queries. Exposed at `/metrics` endpoint for Prometheus scraping.

---

*Architecture analysis: 2026-05-29*
