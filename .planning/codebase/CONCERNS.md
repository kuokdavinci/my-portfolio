# Codebase Concerns

**Analysis Date:** 2026-05-29

## Security Concerns

### CORS Wildcard Configuration
- **Risk:** `backend/main.py` (line 179) uses `allow_origins=["*"]` with `allow_credentials=True`, allowing any origin to make authenticated requests.
- **Files:** `backend/main.py`
- **Current mitigation:** None — this is a development setting left in production code.
- **Recommendation:** Replace `["*"]` with an explicit list of allowed origins (e.g., `["https://yourdomain.com"]`) before deployment.

### Hardcoded API URLs in Frontend
- **Risk:** `src/main.js` (lines 331-332) and `src/modules/chatbot/chatbot-ui.js` (line 3) hardcode `http://localhost:8000/api/v1/...` URLs. These will break in any non-local environment and expose the backend address.
- **Files:** `src/main.js`, `src/modules/chatbot/chatbot-ui.js`
- **Recommendation:** Extract API base URLs to environment variables or a configuration file that can be swapped per environment.

### Custom `.env` Parser Instead of Standard Library
- **Risk:** `backend/main.py` (lines 23-34) implements a custom `load_env()` function that manually parses `.env` files. This is error-prone and may not handle edge cases (quoted values with `=`, comments inline, etc.) correctly.
- **Files:** `backend/main.py`
- **Recommendation:** Use `python-dotenv` or `pydantic-settings` for robust environment variable loading.

### Hardcoded Personal Information in Mock Answers
- **Risk:** `backend/main.py` (line 261) contains a hardcoded phone number `0768040802` and email in the `generate_mock_answer()` function. This data is embedded in source code rather than configuration.
- **Files:** `backend/main.py`
- **Recommendation:** Move personal contact information to environment variables or a configuration file.

### Session ID Generation Uses Weak Randomness
- **Risk:** `src/main.js` (line 340) and `src/modules/chatbot/chatbot-ui.js` (line 84) generate session IDs using `Math.random().toString(36)`, which is not cryptographically secure. Session IDs could potentially be predicted or collided.
- **Files:** `src/main.js`, `src/modules/chatbot/chatbot-ui.js`
- **Recommendation:** Use `crypto.randomUUID()` (available in modern browsers) for session ID generation.

### User Query Sent to Tracking Events
- **Risk:** `src/modules/chatbot/chatbot-ui.js` (line 236) sends the full user query text via `safeTrackEvent('chat_query', { query: trimmedQuestion })`. If users type sensitive information (passwords, personal data), it gets stored in the tracking database.
- **Files:** `src/modules/chatbot/chatbot-ui.js`
- **Recommendation:** Sanitize or truncate query content before tracking, or avoid storing raw query text.

## Code Smells and Anti-Patterns

### Massive Single-File Frontend (`main.js`)
- **Issue:** `src/main.js` is 655 lines containing theme management, mobile menu, scroll reveal, typing effects, contact form, toast notifications, counter animations, project filters, HTML escaping, tracking SDK, hash router, and initialization — all in one file.
- **Files:** `src/main.js`
- **Impact:** Difficult to test, modify, or onboard new developers. Any change risks breaking unrelated functionality.
- **Fix approach:** Split into separate modules: `src/modules/theme/`, `src/modules/router/`, `src/modules/tracking/`, `src/modules/animations/`.

### Duplicate Code: `escapeHtml` Function
- **Issue:** `escapeHtml()` is defined in both `src/main.js` (line 322) and `src/modules/chatbot/chatbot-ui.js` (line 6). These are identical implementations.
- **Files:** `src/main.js`, `src/modules/chatbot/chatbot-ui.js`
- **Fix approach:** Move to a shared utility module `src/utils/escape-html.js` and import from both locations.

### Duplicate Code: `getSessionId` Function
- **Issue:** `getSessionId()` is defined in both `src/main.js` (line 336) and `src/modules/chatbot/chatbot-ui.js` (line 81) with identical logic.
- **Files:** `src/main.js`, `src/modules/chatbot/chatbot-ui.js`
- **Fix approach:** Move to a shared utility module `src/utils/session.js`.

### Bare `except` Clauses
- **Issue:** `backend/pipeline/ingestion_flow.py` (lines 58-59, 79-80) uses bare `except: pass` when parsing JSON payloads. This silently swallows all exceptions including `KeyboardInterrupt` and `SystemExit`.
- **Files:** `backend/pipeline/ingestion_flow.py`
- **Fix approach:** Replace with `except (json.JSONDecodeError, TypeError): pass` to catch only expected errors.

### Global State in Backend
- **Issue:** `backend/main.py` uses global variables for `kafka_producer`, `kafka_available`, `openai_client`, `qdrant_client`, and `chat_history` (lines 47-102). The `chat_history` dict grows unbounded per session with no eviction policy.
- **Files:** `backend/main.py`
- **Impact:** Memory leak potential — `chat_history` accumulates indefinitely. No TTL or size limit on stored conversation history.
- **Fix approach:** Implement a TTL-based cache (e.g., `cachetools.TTLCache`) or LRU cache for `chat_history` with a maximum size and expiration.

### `datetime.utcnow()` Deprecation
- **Issue:** `backend/main.py` (lines 188, 239) uses `datetime.utcnow()` which is deprecated in Python 3.12+ and will be removed in future versions.
- **Files:** `backend/main.py`
- **Fix approach:** Replace with `datetime.now(timezone.utc)`.

### Unused Global Variable Reference
- **Issue:** `backend/main.py` (line 287) references `global embedding_model` but `embedding_model` is never declared at module level — it is only assigned inside the try block (line 336). This creates a runtime variable that may not exist.
- **Files:** `backend/main.py`
- **Fix approach:** Declare `embedding_model` at module scope or remove the `global` statement.

### `locals()` Check for Variable Existence
- **Issue:** `backend/main.py` (line 485) uses `'route' in locals()` to check if a variable exists. This is a code smell indicating unclear control flow.
- **Files:** `backend/main.py`
- **Fix approach:** Initialize `route` with a default value before the try block, or restructure the control flow.

## Performance Bottlenecks

### Character-by-Character Streaming with `setTimeout`
- **Issue:** `src/modules/chatbot/chatbot-ui.js` (lines 136-141) streams bot responses one character at a time with a 15ms `setTimeout` per character. For a 500-character response, this creates 500 individual timer callbacks, blocking the main thread and causing jank.
- **Files:** `src/modules/chatbot/chatbot-ui.js`
- **Improvement path:** Use `requestAnimationFrame` for smoother rendering, or stream in chunks (e.g., words or sentences) rather than individual characters.

### Synchronous Scroll Event Handler
- **Issue:** `src/main.js` (lines 627-641) attaches a scroll event listener that calculates scroll percentage on every scroll event without throttling or debouncing.
- **Files:** `src/main.js`
- **Improvement path:** Use `passive: true` option and throttle the handler to fire at most every 100ms.

### Unbounded `chat_history` Dictionary
- **Issue:** `backend/main.py` (lines 477-480) appends to `chat_history[session_id]` without any size limit. Long-running servers will accumulate memory for every unique visitor session.
- **Files:** `backend/main.py`
- **Improvement path:** Use `cachetools.TTLCache(maxsize=1000, ttl=3600)` or similar to auto-evict stale sessions.

### In-Memory Qdrant Client Reconnection
- **Issue:** `backend/main.py` (lines 104-113) initializes `QdrantClient` once at startup. If the connection drops, there is no reconnection logic — all subsequent queries will fail until restart.
- **Files:** `backend/main.py`
- **Improvement path:** Add connection health checks and lazy reconnection on failure.

## Maintainability Issues

### No TypeScript
- **Issue:** The frontend uses plain JavaScript (`src/main.js`, `src/modules/chatbot/chatbot-ui.js`, `src/modules/chatbot/chatbot-rag.js`, `src/data/portfolio-config.js`) with no type checking. Given the complex data structures (portfolio config, chat messages, tracking events), type errors will only surface at runtime.
- **Impact:** Refactoring is risky; IDE autocomplete is limited; no compile-time validation of data shapes.
- **Fix approach:** Migrate to TypeScript or at minimum add JSDoc type annotations.

### No Frontend Testing
- **Issue:** There are zero frontend test files. No unit tests, no integration tests, no E2E tests for the JavaScript code.
- **Files:** All files under `src/`
- **Risk:** Any change to `main.js` or chatbot modules could break functionality without detection.
- **Priority:** High — add at least basic unit tests for `chatbot-rag.js` (the pure functions are easily testable).

### Minimal `.gitignore`
- **Issue:** `.gitignore` has only 5 entries (`.env`, `*.pyc`, `__pycache__/`, `*.db`, `*.log`). It does not exclude `node_modules/`, `dist/`, `.venv/`, `.ruff_cache/`, `uv.lock`, or OS-specific files.
- **Files:** `.gitignore`
- **Recommendation:** Expand `.gitignore` to include standard entries for Node.js and Python projects.

### No Linting or Formatting Configuration
- **Issue:** No ESLint, Prettier, Biome, or similar configuration exists for the JavaScript frontend. No Ruff configuration for Python (only `.ruff_cache/` directory exists).
- **Impact:** Inconsistent code style across files; no automated code quality checks.
- **Recommendation:** Add ESLint + Prettier for JS, and `ruff.toml` for Python.

### No CI/CD Pipeline
- **Issue:** No GitHub Actions, GitLab CI, or other CI configuration exists. No automated testing, linting, or build verification on push/PR.
- **Impact:** Broken code can be merged without detection.
- **Recommendation:** Add a basic CI workflow that runs `npm run build` and Python tests.

### Backend Dockerfile Uses `python:3.11-slim` but `pyproject.toml` Requires `>=3.14`
- **Issue:** `backend/Dockerfile` (line 1) uses `python:3.11-slim`, but `pyproject.toml` (line 6) declares `requires-python = ">=3.14"`. Python 3.14 does not exist as a stable release yet. This is a configuration mismatch.
- **Files:** `backend/Dockerfile`, `pyproject.toml`
- **Recommendation:** Align Python version requirements. Use `python:3.12-slim` or `python:3.13-slim` and update `pyproject.toml` accordingly.

### Empty `pyproject.toml` Dependencies
- **Issue:** `pyproject.toml` declares `dependencies = []` but the backend uses FastAPI, pydantic, aiokafka, qdrant-client, openai, prometheus-client, and more. Dependencies are listed in `backend/requirements.txt` but not in the project manifest.
- **Files:** `pyproject.toml`, `backend/requirements.txt`
- **Recommendation:** Consolidate dependency management into `pyproject.toml` and remove `requirements.txt`, or use `uv` consistently.

## Architecture Concerns

### Monolithic Backend with No Separation of Concerns
- **Issue:** `backend/main.py` (507 lines) handles tracking endpoints, chat endpoints, health checks, metrics, Kafka integration, SQLite fallback, AI component initialization, CORS, Prometheus middleware, Pydantic models, mock answer generation, and LLM calls — all in a single file.
- **Files:** `backend/main.py`
- **Impact:** Difficult to test individual components; changes to one feature risk breaking others; no clear module boundaries.
- **Fix approach:** Split into modules: `backend/api/` (routes), `backend/services/` (business logic), `backend/infrastructure/` (Kafka, SQLite, Qdrant, OpenAI clients).

### Feast Feature Store Initialization Inside Request Handler
- **Issue:** `backend/main.py` (lines 298-321) imports and initializes `FeatureStore` on every chat request. This is expensive — Feast loads the entire feature repository on each call.
- **Files:** `backend/main.py`
- **Impact:** Added latency on every chat request (hundreds of ms). Should be initialized once at startup.
- **Fix approach:** Initialize `FeatureStore` in the `lifespan` startup hook and reuse the instance.

### Tight Coupling Between Frontend Config and Chatbot RAG
- **Issue:** `src/modules/chatbot/chatbot-rag.js` imports `portfolioConfig` directly from `src/data/portfolio-config.js`. The knowledge base is built from the same config that drives the UI, creating a tight coupling.
- **Files:** `src/modules/chatbot/chatbot-rag.js`, `src/data/portfolio-config.js`
- **Impact:** Changes to the config structure affect both the UI rendering and the chatbot's knowledge base simultaneously.
- **Fix approach:** Create a separate knowledge base data source or define a clear interface between config and RAG module.

### No API Versioning Strategy
- **Issue:** API endpoints use `/api/v1/` prefix but there is no versioning strategy or deprecation plan. The frontend hardcodes `v1` URLs.
- **Files:** `src/main.js`, `src/modules/chatbot/chatbot-ui.js`, `backend/main.py`
- **Recommendation:** Document the API versioning strategy and ensure backward compatibility when moving to v2.

## Hardcoded Values

### Hardcoded Project ID Mappings
- **Issue:** `backend/main.py` (lines 374-376) contains hardcoded project ID aliases: `if proj_id in ("legal-edu-app", "legal-edu", "edurag-app"): proj_id = "edurag"`. This mapping will need manual updates for every new project.
- **Files:** `backend/main.py`
- **Recommendation:** Move to a configuration file or derive from `portfolio-config.js`.

### Hardcoded Default Values in Routing
- **Issue:** `backend/retrieval_boost.py` (lines 242-317) contains extensive hardcoded keyword lists for routing queries. Adding a new project requires modifying this file and adding new `BoostRule` entries.
- **Files:** `backend/retrieval_boost.py`
- **Recommendation:** Consider a data-driven approach where routing rules are derived from project metadata.

### Hardcoded Engagement Score Weights
- **Issue:** `backend/pipeline/ingestion_flow.py` (lines 62-69) uses hardcoded weights: `page_view=1`, `scroll_depth=2/5`, `project_click=10`, `chat_query=15`. These are magic numbers with no documentation.
- **Files:** `backend/pipeline/ingestion_flow.py`
- **Recommendation:** Extract to a configuration dictionary with comments explaining the rationale.

### Hardcoded Formspree Endpoint
- **Issue:** `src/data/portfolio-config.js` (line 410) contains a hardcoded Formspree endpoint URL `https://formspree.io/f/xvonzndk`. If the endpoint changes, the config must be updated and the app rebuilt.
- **Files:** `src/data/portfolio-config.js`
- **Recommendation:** Move to an environment variable or build-time configuration.

### Hardcoded Email Address Mismatch
- **Issue:** `index.html` (line 78) uses `leanhquoc128@gmail.com` while `src/data/portfolio-config.js` (line 409) uses `kuokdavinci@gmail.com`. Two different email addresses are exposed on the same page.
- **Files:** `index.html`, `src/data/portfolio-config.js`
- **Recommendation:** Use a single source of truth for contact information.

## Configuration Issues

### Docker Compose Uses `latest` Tags
- **Issue:** `docker-compose.yml` uses `qdrant/qdrant:latest`, `prom/prometheus:latest`, and `grafana/grafana:latest`. Using `latest` tags means deployments are non-reproducible and can break unexpectedly.
- **Files:** `docker-compose.yml`
- **Recommendation:** Pin specific versions (e.g., `qdrant/qdrant:v1.9.0`, `prom/prometheus:v2.51.0`).

### No Nginx Configuration for Frontend Docker
- **Issue:** The frontend `Dockerfile` uses `nginx:alpine` with default configuration. There is no custom `nginx.conf` to handle SPA routing (hash-based routing needs proper fallback) or security headers.
- **Files:** `Dockerfile`
- **Recommendation:** Add a custom `nginx.conf` with `try_files $uri $uri/ /index.html;` for SPA support and security headers.

### Backend Dockerfile Copies Entire Context
- **Issue:** `backend/Dockerfile` (line 16) uses `COPY . .` which copies all files including test files, pipeline scripts, and potentially sensitive data into the Docker image.
- **Files:** `backend/Dockerfile`
- **Recommendation:** Use a `.dockerignore` file and selectively copy only required files.

### Missing `.dockerignore`
- **Issue:** No `.dockerignore` file exists. Docker builds will include `node_modules/`, `.venv/`, `__pycache__/`, `.git/`, and other unnecessary files, increasing image size and build time.
- **Recommendation:** Create `.dockerignore` with standard exclusions.

## Test Coverage Gaps

### Backend Tests Are Minimal
- **Issue:** Only two test files exist: `backend/test_chat_integration.py` (79 lines, 2 tests) and `backend/test_tdd_rag.py` (63 lines, routing tests only). No tests for tracking endpoint, Prometheus middleware, Kafka fallback, SQLite operations, or the ingestion pipeline.
- **Files:** `backend/test_chat_integration.py`, `backend/test_tdd_rag.py`
- **Risk:** Critical paths (event tracking, data pipeline, feature store sync) have zero test coverage.
- **Priority:** High — add tests for `/api/v1/track` endpoint and `ingestion_flow.py`.

### No Frontend Tests at All
- **What's not tested:** All JavaScript modules — chatbot UI, RAG engine, router, tracking SDK, theme management, animations.
- **Files:** All files under `src/`
- **Risk:** Regressions in chatbot behavior, routing, or tracking will go undetected.
- **Priority:** High — start with unit tests for `chatbot-rag.js` (pure functions: `normalizeText`, `tokenize`, `retrieveKnowledge`, `generateChatbotAnswer`).

### No Integration or E2E Tests
- **What's not tested:** End-to-end flows like user visiting portfolio → clicking project → asking chatbot → receiving answer with sources.
- **Risk:** Integration points between frontend, backend, and AI services are untested.
- **Priority:** Medium — add at least one smoke test for the chat endpoint.

## Dependency Risks

### Unpinned Frontend Dependencies
- **Issue:** `package.json` uses caret ranges (`^4.0.0`, `^5.2.0`) for all dependencies. A minor version bump could introduce breaking changes.
- **Files:** `package.json`
- **Recommendation:** Use exact versions or a lockfile-based deployment strategy.

### `aiokafka` Dependency Without Kafka in Production
- **Issue:** `backend/requirements.txt` includes `aiokafka>=0.10.0` but the architecture document (`ai-portfolio-copilot.md`) states that Kafka is only for local development and Neon Postgres is used in production. The dependency adds unnecessary image size and startup overhead.
- **Files:** `backend/requirements.txt`
- **Recommendation:** Make Kafka an optional dependency or remove it if not used in production.

### `prefect>=3.0.0` Heavy Dependency
- **Issue:** `backend/requirements.txt` includes `prefect>=3.0.0`, which is a large orchestration framework with many transitive dependencies. It is only used for the batch ingestion pipeline, not the API server.
- **Files:** `backend/requirements.txt`
- **Recommendation:** Separate the pipeline dependencies from the API server dependencies using multi-stage Docker builds or separate requirements files.

### No Dependency Vulnerability Scanning
- **Issue:** No automated security scanning of dependencies (e.g., `npm audit`, `pip-audit`, Dependabot, Snyk).
- **Recommendation:** Enable Dependabot or add `npm audit` / `pip-audit` to CI pipeline.

## Scalability Limitations

### SQLite as Primary Tracking Store
- **Issue:** `backend/main.py` uses SQLite (`tracking_events.db`) as the primary tracking data store. SQLite does not support concurrent writes well and will become a bottleneck under load.
- **Files:** `backend/main.py`
- **Limit:** SQLite handles ~100K writes/day comfortably but degrades with concurrent access.
- **Scaling path:** Migrate to PostgreSQL (as documented in the architecture plan) for production use.

### No Rate Limiting
- **Issue:** Neither the tracking endpoint (`/api/v1/track`) nor the chat endpoint (`/api/v1/chat`) has rate limiting. A malicious actor could flood the API with requests, exhausting LLM API quotas or filling the SQLite database.
- **Files:** `backend/main.py`
- **Recommendation:** Add rate limiting middleware (e.g., `slowapi` for FastAPI) with per-session or per-IP limits.

### No Request Validation on Tracking Payload
- **Issue:** The `TrackingEvent` Pydantic model accepts `payload: Dict[str, Any]` with no schema validation. Arbitrary data can be stored, including very large payloads.
- **Files:** `backend/main.py`
- **Recommendation:** Define a schema for expected payload fields or add size limits.

### Chat History Grows Without Bound
- **Issue:** `chat_history` dict in `backend/main.py` stores all conversation turns for all sessions with no eviction. Under sustained traffic, this will consume increasing memory.
- **Files:** `backend/main.py`
- **Scaling path:** Use Redis or an in-memory cache with TTL for session history.

---

*Concerns audit: 2026-05-29*
