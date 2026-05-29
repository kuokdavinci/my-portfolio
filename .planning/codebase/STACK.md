# Technology Stack

**Analysis Date:** 2026-05-29

## Languages

**Primary:**
- JavaScript (ES Modules) - Frontend application code in `src/`
- Python 3.11 - Backend API service in `backend/` (Dockerfile uses `python:3.11-slim`)

**Secondary:**
- Python 3.14 - Local development target (`.python-version` specifies 3.14, `pyproject.toml` requires `>=3.14`)
- HTML/CSS - Portfolio static pages in `index.html` and `src/style.css`

## Runtime

**Environment:**
- Node.js 20 - Frontend build stage (`node:20-alpine` in `Dockerfile`)
- Python 3.11 - Backend runtime (`python:3.11-slim` in `backend/Dockerfile`)

**Package Managers:**
- npm - Frontend dependency management (lockfile: `package-lock.json` present)
- uv - Python dependency management (lockfile: `uv.lock` present)
- pip - Backend dependency installation via `requirements.txt`

## Frameworks

**Core:**
- Vite 5.2.0 - Frontend build tool and dev server (`package.json`)
- FastAPI >=0.110.0 - Backend REST API framework (`backend/requirements.txt`)
- Tailwind CSS 4.0.0 - Utility-first CSS framework via `@tailwindcss/vite` plugin

**AI/ML:**
- OpenAI SDK >=1.0.0 - LLM chat completions and embeddings (`backend/requirements.txt`)
- Qdrant Client >=1.8.0 - Vector database client for RAG retrieval (`backend/requirements.txt`)
- Feast >=0.34.0 (with Redis) - Feature store for ML personalization (`backend/requirements.txt`)
- LangChain - Referenced in project descriptions and knowledge base (not a direct backend dependency)

**Data Pipeline:**
- Prefect >=3.0.0 - Workflow orchestration for batch data ingestion (`backend/requirements.txt`)
- aiokafka >=0.10.0 - Async Kafka producer for event streaming (`backend/requirements.txt`)
- pandas >=2.0.0 - Data transformation in pipeline (`backend/requirements.txt`)
- pyarrow >=15.0.0 - Parquet file support for Feast offline store (`backend/requirements.txt`)

**Testing:**
- unittest - Python standard library testing (`backend/test_chat_integration.py`, `backend/test_tdd_rag.py`)

**Build/Dev:**
- Uvicorn >=0.28.0 (standard) - ASGI server for FastAPI (`backend/requirements.txt`)
- Rollup - Bundler used internally by Vite
- esbuild - Fast JavaScript bundler used by Vite
- nginx:alpine - Production frontend web server (`Dockerfile`)

## Key Dependencies

**Critical:**
- `pydantic` >=2.6.0 - Data validation and serialization for FastAPI models (`backend/requirements.txt`)
- `prometheus-client` >=0.20.0 - Metrics export for observability (`backend/requirements.txt`)

**Infrastructure:**
- Confluent Kafka 7.6.0 - Message broker via Docker (`docker-compose.yml`)
- Confluent Zookeeper 7.6.0 - Kafka coordination via Docker (`docker-compose.yml`)
- Redis 7-alpine - Feast online store via Docker (`docker-compose.yml`)
- Qdrant latest - Vector database via Docker (`docker-compose.yml`)
- Prometheus latest - Metrics collection via Docker (`docker-compose.yml`)
- Grafana latest - Dashboard visualization via Docker (`docker-compose.yml`)

## Configuration

**Environment:**
- `.env` file at project root - Contains `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`, `OPENAI_MODEL`, `QDRANT_HOST`, `QDRANT_VECTOR_DIM`, `KAFKA_BOOTSTRAP_SERVERS` (loaded by custom `load_env()` in `backend/main.py`)
- Environment variables loaded manually from `.env` (no python-dotenv dependency)

**Build:**
- `vite.config.js` - Vite configuration with Tailwind CSS plugin, single entry point `index.html`
- `pyproject.toml` - Minimal Python project config (name: `my-portfolio`, version: `0.1.0`)
- `backend/requirements.txt` - All backend Python dependencies
- `backend/feature_store/feature_store.yaml` - Feast config (project: `portfolio_analytics`, provider: `local`, online store: Redis)

## Platform Requirements

**Development:**
- Docker and Docker Compose for full infrastructure stack
- Node.js 20+ for frontend development
- Python 3.14+ for local Python tooling (uv-managed)
- Python 3.11 compatible for backend (Docker runtime)

**Production:**
- Frontend: Static assets served via nginx (port 80)
- Backend: FastAPI served via Uvicorn (port 8000)
- Target deployment: Vercel/Netlify (frontend), Hugging Face Spaces (backend) per `ai-portfolio-copilot.md`
- Cloud services: Qdrant Cloud (free), Upstash Redis (free), Neon Postgres (free)

## Font & Asset Dependencies

**External Fonts (Google Fonts):**
- Geist (weights 100-900) - Headline font
- Inter (weights 100-900) - Body font
- JetBrains Mono (weights 100-800) - Code font
- Material Symbols Outlined - Icon font

**External Images:**
- GitHub avatar: `https://avatars.githubusercontent.com/u/163934382?v=4`

---

*Stack analysis: 2026-05-29*
