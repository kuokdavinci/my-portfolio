# Testing Patterns

**Analysis Date:** 2026-05-29

## Test Framework

**Python Backend:**
- Runner: `unittest` (Python standard library)
- No third-party test framework detected (no `pytest`, no `pytest.ini`, no `conftest.py`)
- Assertion library: `unittest.TestCase` built-in assertions (`self.assertEqual()`, `self.assertIn()`, `self.assertGreaterEqual()`, `self.assertIsNone()`, `self.assertTrue()`)
- Mocking: `unittest.mock.patch` from standard library

**Frontend JavaScript:**
- No test framework detected (no Jest, Vitest, Mocha, or similar)
- No test files found (`*.test.*`, `*.spec.*` patterns return no results)
- No testing configuration in `vite.config.js` or `package.json`

**Run Commands:**
```bash
# Backend Python tests (run from backend/ directory)
python test_tdd_rag.py              # Run routing tests
python test_chat_integration.py     # Run chat integration tests
python -m unittest discover          # Discover and run all tests
```

## Test File Organization

**Location:**
- Tests are co-located in `backend/` directory alongside source files
- Naming pattern: `test_*.py` prefix (e.g., `test_tdd_rag.py`, `test_chat_integration.py`)

**Structure:**
```
backend/
├── main.py                    # FastAPI application
├── retrieval_boost.py         # Routing and retrieval logic
├── test_tdd_rag.py            # Unit tests for routing
├── test_chat_integration.py   # Integration tests for chat endpoint
├── pipeline/
│   └── test_feast_retrieval.py  # Feast feature retrieval test
└── feature_store/
    └── features.py              # Feast feature definitions
```

## Test Types

**Unit Tests:**
- `test_tdd_rag.py`: Tests for `route_query()`, `detect_boost()`, `get_dynamic_top_k()` functions
- Uses parameterized test cases via `self.subTest()` within a single test method
- Tests routing decisions for 24+ query patterns covering greetings, contact, education, experience, skills, competencies, projects, and project details

**Integration Tests:**
- `test_chat_integration.py`: Tests the `/api/v1/chat` endpoint with mocked external dependencies
- Uses `asyncio.run()` to execute async endpoint handlers synchronously
- Tests source filtering and response structure

**E2E Tests:**
- Not used. No end-to-end test framework or scripts detected.

## Test Structure

**Suite Organization (from `test_tdd_rag.py`):**
```python
class TestPortfolioRouter(unittest.TestCase):
    def assertRoute(self, query, category, project_id=None, intent=None, top_k=None):
        route = route_query(query)
        self.assertEqual(route.category, category, f"Query '{query}' should route to category '{category}'")
        self.assertEqual(route.project_id, project_id, f"Query '{query}' should route to project_id '{project_id}'")
        if intent is not None:
            self.assertEqual(route.intent, intent, f"Query '{query}' should route to intent '{intent}'")
        if top_k is not None:
            boost = detect_boost(query)
            self.assertEqual(get_dynamic_top_k(query, boost), top_k, f"Query '{query}' should return top_k = {top_k}")

    def test_routing_cases(self):
        cases = [
            ("hi", "greeting", None, "greeting", 0),
            ("Email của Quốc là gì?", "contact", None, "category:contact", 1),
            # ... more cases
        ]
        for query, category, project_id, intent, top_k in cases:
            with self.subTest(query=query):
                self.assertRoute(query, category, project_id, intent, top_k)
```

**Patterns:**
- Setup: `setUp()` method with `patch.object()` for mocking
- Teardown: `tearDown()` method with `patcher.stop()`
- Assertion: Direct method calls with descriptive error messages in assertion calls
- Parameterization: List of tuples iterated with `self.subTest()` for named sub-tests

## Mocking

**Framework:** `unittest.mock.patch` (standard library)

**Patterns (from `test_chat_integration.py`):**
```python
class TestChatEndpoint(unittest.TestCase):
    def setUp(self):
        self.patcher_openai = patch.object(main, "openai_client", FakeOpenAIClient())
        self.patcher_qdrant = patch.object(main, "qdrant_client", FakeQdrantClient())
        self.patcher_openai.start()
        self.patcher_qdrant.start()

    def tearDown(self):
        self.patcher_openai.stop()
        self.patcher_qdrant.stop()
```

**Fake Object Pattern:**
- Custom fake classes replace real clients (`FakeOpenAIClient`, `FakeQdrantClient`)
- Fakes implement the same interface as real clients with simplified return values
- `SimpleNamespace` used for nested attribute access: `SimpleNamespace(embedding=vector)`
- Fake responses mimic real API response structures:
  ```python
  class FakeEmbeddingResponse:
      def __init__(self, vector):
          self.data = [SimpleNamespace(embedding=vector)]

  class FakeChatResponse:
      def __init__(self, content):
          self.choices = [SimpleNamespace(message=SimpleNamespace(content=content))]
  ```

**What to Mock:**
- External API clients (OpenAI, Qdrant)
- Global module-level variables (`main.openai_client`, `main.qdrant_client`)
- Database connections (implicitly via global state)

**What NOT to Mock:**
- Routing logic (`route_query`, `detect_boost`) - tested directly
- Response processing and source filtering - tested with real logic

## Fixtures and Factories

**Test Data:**
- No separate fixture files detected
- Test data embedded directly in test methods as tuples/lists
- Routing test cases defined inline in `test_routing_cases()` method

**Location:**
- All test data lives within test files themselves
- No `fixtures/`, `conftest.py`, or factory patterns

## Coverage

**Requirements:** None enforced. No coverage tool configured (no `coverage.py`, no `pytest-cov`, no coverage config).

**View Coverage:**
```bash
# Would require installing coverage tool
pip install coverage
coverage run -m unittest discover
coverage report -m
```

**Current Coverage Gaps:**
- Frontend JavaScript: **0% tested** - no test framework or test files exist
- Backend routing logic: Partially covered by `test_tdd_rag.py` (24+ routing cases)
- Backend chat endpoint: Partially covered by `test_chat_integration.py` (2 test cases, contact-only)
- Backend tracking endpoint (`/api/v1/track`): **Not tested**
- Backend health endpoint (`/api/v1/health`): **Not tested**
- Backend metrics endpoint (`/metrics`): **Not tested**
- Backend retrieval merge logic (`merge_parent_child`): **Not tested**
- Backend Qdrant filter building (`build_qdrant_filter`): **Not tested**
- Frontend chatbot RAG logic (`chatbot-rag.js`): **Not tested**
- Frontend chatbot UI logic (`chatbot-ui.js`): **Not tested**
- Frontend main.js setup functions: **Not tested**

## Common Patterns

**Async Testing (from `test_chat_integration.py`):**
```python
def test_chat_contact_route_returns_contact_source(self):
    request = SimpleNamespace(session_id="test-session", message="Email của Quốc là gì?")
    response = asyncio.run(main.chat(request))
    
    self.assertIn("answer", response)
    self.assertIn("sources", response)
    self.assertGreaterEqual(len(response["sources"]), 1)
```

**Error Testing:**
- No explicit error/failure path testing detected
- Tests only verify happy-path responses
- No tests for API failure scenarios, invalid inputs, or edge cases

**SubTest Pattern (from `test_tdd_rag.py`):**
```python
def test_routing_cases(self):
    cases = [
        ("hi", "greeting", None, "greeting", 0),
        ("hello", "greeting", None, "greeting", 0),
        # ... 24+ cases
    ]
    for query, category, project_id, intent, top_k in cases:
        with self.subTest(query=query):
            self.assertRoute(query, category, project_id, intent, top_k)
```

## Test Execution

**Current test files:**
| File | Tests | Coverage Area |
|------|-------|---------------|
| `backend/test_tdd_rag.py` | 3 test methods (24+ sub-tests) | Query routing, boost detection, dynamic top-k |
| `backend/test_chat_integration.py` | 2 test methods | Chat endpoint response structure, source filtering |
| `backend/pipeline/test_feast_retrieval.py` | Unknown (not read) | Feast feature retrieval |

**Test runner entry point:**
```bash
# Run all backend tests
cd backend && python -m unittest discover -v

# Run specific test file
cd backend && python test_tdd_rag.py -v
cd backend && python test_chat_integration.py -v
```

---

*Testing analysis: 2026-05-29*
