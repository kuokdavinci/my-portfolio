# Codebase Structure

**Analysis Date:** 2026-05-29

## Directory Layout

```
my-portfolio/
├── index.html                  # Single-page application entry point
├── src/                        # Frontend source code
│   ├── main.js                 # Application entry point (655 lines)
│   ├── style.css               # Tailwind CSS + custom theme (880 lines)
│   ├── data/
│   │   └── portfolio-config.js # Portfolio content configuration (412 lines)
│   ├── modules/
│   │   └── chatbot/
│   │       ├── chatbot-ui.js   # Chatbot UI component (332 lines)
│   │       ├── chatbot-rag.js  # Local RAG fallback engine (174 lines)
│   │       └── chatbot.css     # Chatbot component styles (361 lines)
│   └── assets/
│       └── portfolio/          # Background images (light/dark mode)
├── backend/                    # FastAPI backend service
│   ├── main.py                 # API gateway + chat + tracking (507 lines)
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Backend container build
│   ├── retrieval_boost.py      # Query routing & RAG boost rules (394 lines)
│   ├── test_chat_integration.py
│   ├── test_tdd_rag.py
│   ├── data/                   # Runtime data (SQLite DB, Parquet)
│   ├── feature_store/
│   │   ├── feature_store.yaml  # Feast configuration
│   │   ├── features.py         # Entity + FeatureView definitions
│   │   └── data/               # Feast registry + offline store
│   └── pipeline/
│       ├── ingestion_flow.py   # Prefect ETL: SQLite → Parquet (141 lines)
│       ├── materialize_feast.py # Feast: Parquet → Redis (26 lines)
│       └── test_feast_retrieval.py
├── scripts/                    # Setup and utility scripts
│   ├── setup_qdrant.py         # Knowledge ingestion to Qdrant (318 lines)
│   └── test_retrieval.py
├── knowledge_base/             # Markdown source for RAG knowledge
│   ├── personal.md             # Profile, education, experience, skills
│   ├── edurag_pj.md            # EduRAG project documentation
│   ├── movie_ticket_pj.md      # Movie ticket project documentation
│   ├── attendance_pj.md        # Attendance app project documentation
│   └── template.md             # Template for new project docs
├── prometheus/                 # Prometheus configuration
│   └── prometheus.yml          # Scrape configs (api-gateway job)
├── grafana/                    # Grafana provisioning
│   └── provisioning/
│       ├── datasources/
│       │   └── datasource.yml  # Prometheus datasource
│       └── dashboards/
│           ├── dashboards.yml  # Dashboard provider config
│           └── visitor_analytics.json
├── docker-compose.yml          # All service orchestration (8 services)
├── Dockerfile                  # Frontend multi-stage build (Node → Nginx)
├── package.json                # Frontend dependencies (Vite + Tailwind)
├── vite.config.js              # Vite build configuration
├── pyproject.toml              # Python project manifest (minimal)
├── .env                        # Environment variables (secrets)
├── dist/                       # Build output (generated)
└── node_modules/               # Frontend dependencies (generated)
```

## Directory Purposes

### `src/` — Frontend Application
- **Purpose:** Single-page portfolio website with embedded AI chatbot
- **Contains:** ES module JavaScript, CSS with Tailwind, static HTML
- **Key files:**
  - `src/main.js` — Application orchestrator: theme, routing, tracking, animations, chatbot setup
  - `src/style.css` — Complete design system: Tokyo Night dark theme, Material Design 3 color tokens, component classes
  - `src/data/portfolio-config.js` — Single source of truth for all portfolio content

### `src/modules/chatbot/` — Chatbot Feature Module
- **Purpose:** AI RAG chatbot widget (self-contained feature)
- **Contains:** UI component, local RAG engine, component styles
- **Pattern:** Co-located JS + CSS for a single feature module
- **Key files:**
  - `chatbot-ui.js` — DOM-based chat UI, API communication, streaming responses
  - `chatbot-rag.js` — Local fallback: token-based knowledge retrieval (no backend needed)
  - `chatbot.css` — Component-scoped styles under `@layer components`

### `src/data/` — Configuration Data
- **Purpose:** Centralized portfolio content
- **Contains:** Single `portfolio-config.js` exporting all portfolio data
- **Pattern:** JavaScript module with named export, consumed by both UI rendering and local RAG

### `src/assets/` — Static Assets
- **Purpose:** Background images for light/dark themes
- **Contains:** `portfolio/` subdirectory with theme-specific images

### `backend/` — FastAPI API Gateway
- **Purpose:** Backend service for tracking events and AI chatbot
- **Contains:** API routes, AI service orchestration, retrieval logic, data pipeline
- **Key files:**
  - `main.py` — FastAPI app with `/api/v1/track`, `/api/v1/chat`, `/metrics`, `/api/v1/health`
  - `retrieval_boost.py` — Query routing, boost rules, parent-child chunk merging

### `backend/feature_store/` — Feast Feature Store
- **Purpose:** Session feature definitions and configuration for personalization
- **Contains:** Feast YAML config, Python feature definitions
- **Key files:**
  - `feature_store.yaml` — Project config, Redis online store connection
  - `features.py` — Entity (`session_id`), FeatureView (`session_features`)

### `backend/pipeline/` — Data Pipeline
- **Purpose:** ETL flow transforming raw events to session features
- **Contains:** Prefect flows, Feast materialization
- **Key files:**
  - `ingestion_flow.py` — Extract (SQLite) → Transform (engagement scoring) → Load (Parquet)
  - `materialize_feast.py` — Push features from Parquet to Redis online store

### `backend/data/` — Runtime Data Storage
- **Purpose:** Local data files created at runtime
- **Contains:** SQLite tracking database, Parquet feature files, Feast registry
- **Note:** Generated directory, not committed to git

### `scripts/` — Setup and Utility Scripts
- **Purpose:** One-time setup and testing scripts
- **Contains:** Qdrant knowledge ingestion, retrieval testing
- **Key files:**
  - `setup_qdrant.py` — Parses markdown, generates embeddings, populates Qdrant

### `knowledge_base/` — RAG Knowledge Source
- **Purpose:** Markdown documents that form the chatbot's knowledge base
- **Contains:** Personal profile + project documentation
- **Pattern:** `personal.md` for profile data, `*_pj.md` for project docs, `template.md` for new projects

### `prometheus/` and `grafana/` — Observability
- **Purpose:** Monitoring configuration
- **Contains:** Prometheus scrape config, Grafana datasource and dashboard provisioning

## Key File Locations

### Entry Points
- `index.html`: HTML entry point, loads `src/main.js` as ES module
- `src/main.js`: JavaScript entry point, initializes all application features
- `backend/main.py`: FastAPI application entry, served on port 8000
- `scripts/setup_qdrant.py`: Knowledge base ingestion script

### Configuration
- `package.json`: Frontend dependencies and npm scripts
- `vite.config.js`: Vite build config with Tailwind plugin
- `pyproject.toml`: Python project manifest (minimal, dependencies in `backend/requirements.txt`)
- `docker-compose.yml`: All 8 service definitions
- `Dockerfile`: Frontend multi-stage build (Node 20 Alpine → Nginx Alpine)
- `backend/Dockerfile`: Backend build (Python 3.11 Slim)
- `.env`: Environment variables (API keys, service hosts)

### Core Logic
- `src/main.js`: Frontend application orchestrator (theme, routing, tracking, animations)
- `src/data/portfolio-config.js`: Portfolio content configuration
- `backend/main.py`: API gateway, tracking, chat RAG pipeline
- `backend/retrieval_boost.py`: Query routing and retrieval optimization
- `src/modules/chatbot/chatbot-ui.js`: Chatbot UI and API communication
- `src/modules/chatbot/chatbot-rag.js`: Local RAG fallback engine

### Testing
- `backend/test_chat_integration.py`: Chat integration tests
- `backend/test_tdd_rag.py`: RAG TDD tests
- `backend/pipeline/test_feast_retrieval.py`: Feast retrieval tests
- `scripts/test_retrieval.py`: Retrieval testing

## Naming Conventions

**Files:**
- JavaScript: kebab-case (`chatbot-ui.js`, `portfolio-config.js`)
- Python: snake_case (`retrieval_boost.py`, `ingestion_flow.py`, `setup_qdrant.py`)
- Markdown: snake_case with `_pj` suffix for projects (`edurag_pj.md`, `movie_ticket_pj.md`)
- CSS: kebab-case class names (`.rag-chatbot`, `.rag-chat-panel`)
- Config: standard names (`docker-compose.yml`, `vite.config.js`, `feature_store.yaml`)

**Directories:**
- snake_case for Python-related (`feature_store`, `knowledge_base`)
- kebab-case for frontend (`chatbot`)

**Functions:**
- JavaScript: camelCase (`setupPortfolioChatbot`, `trackEvent`, `handleRoute`)
- Python: snake_case (`detect_boost`, `merge_parent_child`, `run_ingestion_flow`)

**CSS Classes:**
- BEM-like with feature prefix: `.rag-chat-*` for chatbot components
- Utility-first: Tailwind classes for layout and spacing
- Custom components: `.btn-primary`, `.card-hover`, `.section-title`, `.ios-toggle`

## Where to Add New Code

### New Frontend Feature (section/page)
- **HTML structure:** Add section to `index.html` within `<main>`
- **JavaScript logic:** Add setup function to `src/main.js`, call from `DOMContentLoaded` handler
- **Styles:** Add to `src/style.css` under appropriate `@layer` (base/components/utilities)
- **Data:** If content-driven, add to `src/data/portfolio-config.js`

### New Chatbot Feature
- **UI changes:** Modify `src/modules/chatbot/chatbot-ui.js`
- **Local RAG logic:** Modify `src/modules/chatbot/chatbot-rag.js`
- **Styles:** Add to `src/modules/chatbot/chatbot.css`

### New Backend API Endpoint
- **Route:** Add to `backend/main.py` with Pydantic schema
- **Metrics:** Add Prometheus Counter/Histogram if needed
- **Tests:** Add to `backend/test_*.py`

### New RAG Knowledge
- **Project docs:** Create `knowledge_base/<project_name>_pj.md` following `template.md`
- **Personal info:** Update `knowledge_base/personal.md`
- **Re-ingest:** Run `python scripts/setup_qdrant.py` to update Qdrant

### New Boost Rule (query routing)
- **Location:** `backend/retrieval_boost.py` — add to `BOOST_RULES` list (line 43+)
- **Also update:** `route_query()` function if new category needed (line 218+)

### New Feast Feature
- **Definition:** Add to `backend/feature_store/features.py` — extend FeatureView schema
- **ETL:** Update `backend/pipeline/ingestion_flow.py` — transform function
- **Chat usage:** Update `backend/main.py` — feature retrieval in chat endpoint

### New Pipeline Step
- **Prefect task:** Add `@task` decorated function to `backend/pipeline/ingestion_flow.py`
- **Flow:** Add task call to `run_ingestion_flow()` function

### New Monitoring Dashboard
- **Dashboard JSON:** Add to `grafana/provisioning/dashboards/`
- **Datasource:** Modify `grafana/provisioning/datasources/datasource.yml` if needed

## Special Directories

### `dist/` — Build Output
- **Purpose:** Vite production build output
- **Generated:** Yes, by `npm run build`
- **Committed:** No (in `.gitignore`)
- **Contents:** Bundled JS, CSS, HTML, assets

### `node_modules/` — Frontend Dependencies
- **Purpose:** npm packages
- **Generated:** Yes, by `npm install`
- **Committed:** No (in `.gitignore`)

### `backend/data/` — Runtime Data
- **Purpose:** SQLite tracking database, Parquet feature files, Feast registry
- **Generated:** Yes, at runtime by backend and pipeline
- **Committed:** No

### `.planning/` — GSD Planning Artifacts
- **Purpose:** AI-assisted planning documents
- **Contains:** STATE.md, ROADMAP.md, phase plans, codebase analysis docs
- **Committed:** Yes

### `.agent/` — Agent Configuration
- **Purpose:** AI agent skills, workflows, and role definitions
- **Contains:** Agent role files, workflow definitions, API pattern guides
- **Committed:** Yes

---

*Structure analysis: 2026-05-29*
