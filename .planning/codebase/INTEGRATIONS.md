# External Integrations

**Analysis Date:** 2026-05-29

## APIs & External Services

**LLM Provider:**
- OpenAI API - Chat completions and text embeddings
  - SDK: `openai` >=1.0.0 (`backend/requirements.txt`)
  - Models: `gpt-4o-mini` (default, configurable via `OPENAI_MODEL` env var), `text-embedding-3-small` (default embedding model, configurable via `OPENAI_EMBEDDING_MODEL`)
  - Auth: `OPENAI_API_KEY` environment variable
  - Client: `AsyncOpenAI` (async client used in `backend/main.py`)
  - Usage: RAG chat endpoint (`/api/v1/chat`) generates embeddings for Qdrant queries and calls LLM for responses

**Contact Form:**
- Formspree - Contact form submission endpoint
  - Endpoint: `https://formspree.io/f/xvonzndk` (configured in `src/data/portfolio-config.js`)
  - Auth: Formspree-managed (no API key in frontend code)

## Data Storage

**Vector Database:**
- Qdrant - Vector similarity search for RAG knowledge base
  - Connection: `QDRANT_HOST` env var (default: `localhost`), port 6333
  - Client: `qdrant-client` >=1.8.0
  - Collection: `portfolio_knowledge` (1536 dimensions, cosine distance)
  - Setup script: `scripts/setup_qdrant.py`
  - Docker: `qdrant/qdrant:latest` (ports 6333, 6334)
  - Data: Populated from `knowledge_base/*.md` files with parent-child chunking strategy

**Feature Store:**
- Feast - ML feature store for visitor personalization
  - Online store: Redis (`backend/feature_store/feature_store.yaml`)
  - Offline store: Parquet files (`backend/data/processed/user_features.parquet`)
  - Registry: SQLite (`backend/feature_store/data/registry.db`)
  - Features: `engagement_score`, `last_viewed_category`, `chat_count` (entity: `session_id`)
  - Materialization: `backend/pipeline/materialize_feast.py`

**Relational Database:**
- SQLite - Fallback event tracking storage
  - Path: `backend/data/tracking_events.db`
  - Schema: `tracking_events` table (id, session_id, timestamp, event_type, payload)
  - Used when Kafka is unavailable (graceful degradation)

**Message Broker:**
- Apache Kafka - Event streaming for real-time activity tracking
  - Bootstrap servers: `KAFKA_BOOTSTRAP_SERVERS` env var (default: `localhost:9092`)
  - Topic: `user.activity.raw`
  - Client: `aiokafka` >=0.10.0 (async producer)
  - Docker: `confluentinc/cp-kafka:7.6.0` + `confluentinc/cp-zookeeper:7.6.0`
  - Fallback: SQLite when Kafka is unreachable

**Cache / Online Store:**
- Redis 7 - Feast online feature store
  - Connection: `${REDIS_HOST}:6379` (from `feature_store.yaml`)
  - Docker: `redis:7-alpine` (port 6379)

## Authentication & Identity

**Auth Provider:**
- None (portfolio is public, no user authentication)
- Session tracking: UUID-like session IDs stored in `sessionStorage` (generated client-side in `src/main.js`)
- API keys: `OPENAI_API_KEY` for LLM access (server-side only)

## Monitoring & Observability

**Metrics Collection:**
- Prometheus - Metrics scraping and storage
  - Docker: `prom/prometheus:latest` (port 9090)
  - Config: `prometheus/prometheus.yml`
  - Scrape targets: `localhost:9090` (self), `host.docker.internal:8000` (API gateway)
  - Scrape interval: 15s

**Dashboard:**
- Grafana - Visualization dashboard
  - Docker: `grafana/grafana:latest` (port 3000)
  - Datasource: Prometheus (provisioned via `grafana/provisioning/datasources/datasource.yml`)
  - Dashboard provisioning: `grafana/provisioning/dashboards/dashboards.yml`
  - Dashboard name: "Visitor Analytics"

**API Metrics (exported by FastAPI):**
- `api_requests_total` - HTTP request count (labels: method, endpoint, status)
- `api_request_duration_seconds` - Request latency histogram (labels: method, endpoint)
- `chatbot_queries_total` - Chat query count (labels: session_id)
- `chatbot_llm_duration_seconds` - LLM call latency histogram
- Endpoint: `GET /metrics` (Prometheus format)

**Logging:**
- Python `logging` module - Backend logging (`backend/main.py`)
- Logger: `api-gateway` at INFO level
- Console output via `uvicorn.log` file

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel or Netlify (planned per `ai-portfolio-copilot.md`)
- Backend: Hugging Face Spaces (planned, free CPU tier)
- Local: Docker Compose full stack

**CI Pipeline:**
- None configured (no `.github/workflows/` or CI config detected)

**Containerization:**
- Docker Compose: 8 services (qdrant, redis, zookeeper, kafka, prometheus, grafana, backend, frontend)
- Frontend Dockerfile: Multi-stage build (node:20-alpine → nginx:alpine)
- Backend Dockerfile: python:3.11-slim with uvicorn

## Environment Configuration

**Required env vars:**
- `OPENAI_API_KEY` - OpenAI API authentication
- `OPENAI_MODEL` - LLM model name (default: `gpt-4o-mini`)
- `OPENAI_EMBEDDING_MODEL` - Embedding model (default: `text-embedding-3-small`)
- `QDRANT_HOST` - Qdrant server hostname (default: `localhost`)
- `QDRANT_VECTOR_DIM` - Vector dimension (default: `1536`)
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka broker address (default: `localhost:9092`)
- `REDIS_HOST` - Redis hostname for Feast (from `feature_store.yaml`)

**Secrets location:**
- `.env` file at project root (gitignored)
- Never committed to repository

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- Formspree form submission: `POST https://formspree.io/f/xvonzndk` (contact form in `index.html`)
- OpenAI API: Chat completions and embeddings (server-side)

## Service Ports (Local Development)

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (nginx) | 80 | Static asset serving |
| Backend (FastAPI) | 8000 | API gateway |
| Qdrant | 6333, 6334 | Vector database (HTTP + gRPC) |
| Redis | 6379 | Feast online store |
| Kafka | 9092 | Event streaming |
| Zookeeper | 2181 | Kafka coordination |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3000 | Dashboard visualization |

## External Links Referenced

- GitHub: `https://github.com/kuokdavinci`
- LinkedIn: `https://linkedin.com/in/kuokdavinci`
- EduRAG project: `https://github.com/kuokdavinci/EduRAG`
- Movie Ticket project: `https://github.com/kuokdavinci/movie-ticket-app-backend`
- Attendance App project: `https://github.com/kuokdavinci/attendance_app`

---

*Integration audit: 2026-05-29*
