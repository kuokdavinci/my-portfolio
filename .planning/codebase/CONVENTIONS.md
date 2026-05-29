# Coding Conventions

**Analysis Date:** 2026-05-29

## Naming Patterns

**Files:**
- Frontend: kebab-case for CSS (`chatbot.css`, `style.css`), kebab-case for JS modules (`chatbot-ui.js`, `chatbot-rag.js`, `portfolio-config.js`)
- Backend: snake_case for Python (`main.py`, `retrieval_boost.py`, `test_chat_integration.py`, `test_tdd_rag.py`)
- Config files: standard naming (`vite.config.js`, `pyproject.toml`, `docker-compose.yml`)

**Functions:**
- Frontend JS: camelCase for setup/feature functions (`setupThemeToggle()`, `setupMobileMenu()`, `setupScrollReveal()`, `setupTypingEffect()`, `setupContactForm()`, `setupProjectFilters()`, `setupRouter()`, `setupTracking()`)
- Frontend JS: camelCase for utility functions (`escapeHtml()`, `getSessionId()`, `trackEvent()`, `handleRoute()`, `showToast()`, `animateCounters()`)
- Frontend JS: camelCase for chatbot module exports (`addChatMessage()`, `streamBotResponse()`, `setupPortfolioChatbot()`, `buildKnowledgeBase()`, `generateChatbotAnswer()`, `retrieveKnowledge()`, `normalizeText()`, `tokenize()`)
- Backend Python: snake_case for all functions (`init_sqlite_db()`, `init_kafka_producer()`, `save_event_to_sqlite()`, `push_event_to_kafka()`, `track_event()`, `health_check()`, `generate_mock_answer()`, `chat()`, `detect_boost()`, `route_query()`, `merge_parent_child()`, `get_dynamic_top_k()`)

**Variables:**
- Frontend JS: camelCase (`portfolioConfig`, `mobileDrawer`, `typingElements`, `scrolled50`, `TRACKING_API_URL`)
- Backend Python: snake_case (`kafka_producer`, `kafka_available`, `openai_client`, `qdrant_client`, `chat_history`, `engagement_score`)
- Constants: UPPER_SNAKE_CASE in JS (`TRACKING_API_URL`, `CHAT_API_URL`, `MIN_THINKING_TIME`), UPPER_SNAKE_CASE in Python (`DB_DIR`, `DB_PATH`, `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_TOPIC`, `BOOST_RULES`)

**Types/Classes:**
- Backend Python: PascalCase for dataclasses and Pydantic models (`TrackingEvent`, `ChatRequest`, `BoostRule`, `RetrievalBoost`, `RouteDecision`)
- Backend Python: PascalCase for fake test classes (`FakeEmbeddingResponse`, `FakeChatResponse`, `FakeOpenAIClient`, `FakeHit`, `FakeQdrantClient`)
- CSS: BEM-like naming with `rag-chat-*` prefix (`.rag-chatbot`, `.rag-chat-toggle`, `.rag-chat-panel`, `.rag-chat-header`, `.rag-chat-messages`, `.rag-chat-bubble`, `.rag-chat-form`)

## Code Style

**Formatting:**
- No linting tool detected (no `.eslintrc*`, `.prettierrc*`, or `eslint.config.*` found)
- No Python linter detected (no `.ruff.toml` or `pyproject.toml` lint config beyond basic project metadata)
- JavaScript uses 2-space indentation consistently
- Python uses 4-space indentation (standard)

**JavaScript Style (observed in `src/main.js`, `src/modules/chatbot/*.js`):**
- ES modules with `import`/`export` syntax
- `'use strict'` not used; `"type": "module"` in `package.json` enables strict mode
- Arrow functions preferred for callbacks and async operations
- Template literals used for string interpolation and multi-line HTML generation
- `async/await` pattern for all async operations
- Destructuring used in function parameters and object access

**Python Style (observed in `backend/main.py`, `backend/retrieval_boost.py`):**
- Type hints on function signatures (`Optional[AIOKafkaProducer]`, `Dict[str, List[Dict[str, str]]]`)
- Docstrings on public functions (triple-quoted)
- Global variables declared at module level with type annotations
- `async`/`await` pattern for all I/O operations

## Import Organization

**Frontend JavaScript:**
1. CSS imports first: `import './style.css';`
2. Module imports: `import { portfolioConfig } from './data/portfolio-config.js';`
3. Named exports from modules: `import { setupPortfolioChatbot } from './modules/chatbot/chatbot-ui.js';`

**Backend Python:**
1. Standard library: `import os`, `import json`, `import logging`, `import asyncio`, `from datetime import datetime`, `from typing import Dict, Any, Optional, List`
2. Third-party: `from fastapi import FastAPI`, `from pydantic import BaseModel, Field`, `from aiokafka import AIOKafkaProducer`, `from qdrant_client import QdrantClient`, `from openai import AsyncOpenAI`
3. Local modules: `from retrieval_boost import detect_boost, build_qdrant_filter, merge_parent_child`

**Path Aliases:**
- No path aliases configured; all imports use relative paths
- Frontend uses `.js` extension in import paths (required for ES modules)

## Error Handling

**Frontend JavaScript:**
- `try/catch` blocks around `fetch` calls with fallback behavior
- Silent failure for tracking events: `console.warn('Failed to send tracking event:', response.statusText)`
- Chatbot API failure falls back to local RAG generation:
  ```javascript
  catch (error) {
    console.warn('Backend chatbot API failed, falling back to local generation:', error);
    const localResponse = generateChatbotAnswer(trimmedQuestion, knowledgeBase);
    await streamBotResponse(messages, localResponse.answer, localResponse.sources);
  }
  ```
- Null checks with early returns: `if (!form) return;`, `if (!mobileDrawer) return;`
- DOM element existence checks before operations: `if (toggle) { ... }`

**Backend Python:**
- `try/except` blocks around external service calls (Kafka, OpenAI, Qdrant, Feast)
- Graceful degradation: Kafka fallback to SQLite, LLM fallback to `generate_mock_answer()`
- Logging at appropriate levels: `logger.warning()`, `logger.error()`, `logger.info()`
- Background task errors caught and logged, not propagated:
  ```python
  except Exception as e:
      logger.error(f"Error saving tracking event to SQLite: {e}")
  ```

## State Management

**Frontend JavaScript:**
- No framework-based state management; uses vanilla DOM manipulation
- Theme state stored in `localStorage` (`localStorage.getItem('theme')`)
- Session ID stored in `sessionStorage` (`sessionStorage.getItem('portfolio_session_id')`)
- Module-level mutable state for tracking flags: `let scrolled50 = false; let scrolled90 = false;`
- Chat history stored in module-level dict in backend: `chat_history: Dict[str, List[Dict[str, str]]] = {}`
- Config object exported as singleton: `export const portfolioConfig = { ... }`

**Backend Python:**
- Global mutable state for AI clients and chat history
- Kafka connection state tracked via module-level booleans: `kafka_available = False`
- Pydantic models for request/response validation (`TrackingEvent`, `ChatRequest`)

## Component Patterns

**Frontend HTML/CSS:**
- Sections use semantic `<section>` tags with ID-based navigation (`#home`, `#journey`, `#projects`, `#skills`, `#contact`)
- Reveal animations via CSS class toggling: `.reveal` + `.visible` (triggered by `IntersectionObserver`)
- Staggered children animations: `.stagger-children.visible > *:nth-child(N)` with incremental delays
- Card hover effects via `.card-hover` class with CSS transitions
- Project detail view rendered dynamically via hash routing (`#/project/{id}`)
- Chatbot UI built as a dynamically injected `<section class="rag-chatbot">` with shadow DOM-like encapsulation via CSS prefix

**Backend Python:**
- FastAPI app with lifespan context manager for startup/shutdown
- Pydantic models for request validation
- Background tasks via `BackgroundTasks` for non-blocking operations
- Middleware for CORS and Prometheus metrics

## Code Organization Principles

**Frontend:**
- Single entry point: `src/main.js` orchestrates all setup functions
- Feature modules in `src/modules/` (currently only `chatbot/`)
- Data/configuration separated in `src/data/portfolio-config.js`
- CSS organized in `@layer` directives (`base`, `components`, `utilities`)
- Chatbot module split into three files: `chatbot-ui.js` (UI/rendering), `chatbot-rag.js` (knowledge/retrieval), `chatbot.css` (styles)

**Backend:**
- Single-file FastAPI app: `backend/main.py` (507 lines) contains all routes, models, and business logic
- Retrieval logic extracted to `backend/retrieval_boost.py` (394 lines) with dataclasses and rule-based routing
- Pipeline scripts in `backend/pipeline/` for data ingestion and feature materialization
- Feature store configuration in `backend/feature_store/`
- Test files co-located in `backend/` directory

## Security Patterns

**Frontend:**
- HTML escaping via `escapeHtml()` function using `textContent` assignment
- External links use `rel="noopener"` and `target="_blank"`
- Session IDs generated client-side (not cryptographically secure)

**Backend:**
- CORS configured with `allow_origins=["*"]` (development only)
- Environment variables loaded from `.env` file via custom `load_env()` function
- API keys passed via environment variables (`OPENAI_API_KEY`)

---

*Convention analysis: 2026-05-29*
