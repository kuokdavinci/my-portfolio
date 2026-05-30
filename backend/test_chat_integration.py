import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import main


class FakeEmbeddingResponse:
    def __init__(self, vector):
        self.data = [SimpleNamespace(embedding=vector)]


class FakeChatResponse:
    def __init__(self, content):
        self.choices = [SimpleNamespace(message=SimpleNamespace(content=content))]


class FakeOpenAIClient:
    def __init__(self):
        self.embeddings = SimpleNamespace(create=self._create_embedding)
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create_chat_completion))

    async def _create_embedding(self, input, model):
        return FakeEmbeddingResponse([0.1, 0.2, 0.3])

    async def _create_chat_completion(self, model, messages, temperature):
        return FakeChatResponse("This is a contact answer from portfolio assistant with GitHub details.")


class FakeHit:
    def __init__(self, point_id, payload, score=0.99):
        self.id = point_id
        self.payload = payload
        self.score = score


class FakeQdrantClient:
    def query_points(self, collection_name, query, limit, query_filter=None):
        payload = {
            "category": "contact",
            "chunk_level": "parent",
            "text": "Contact Lê Trung Anh Quốc via email at kuokdavinci@gmail.com.",
            "metadata": {"github": "kuokdavinci", "email": "kuokdavinci@gmail.com"},
        }
        return SimpleNamespace(points=[FakeHit("contact-1", payload)])


class TestChatEndpoint(unittest.TestCase):
    def setUp(self):
        self.patcher_openai = patch.object(main, "openai_client", FakeOpenAIClient())
        self.patcher_qdrant = patch.object(main, "qdrant_client", FakeQdrantClient())
        self.patcher_openai.start()
        self.patcher_qdrant.start()

    def tearDown(self):
        self.patcher_openai.stop()
        self.patcher_qdrant.stop()

    def test_chat_contact_route_returns_contact_source(self):
        request = SimpleNamespace(session_id="test-session", message="Email của Quốc là gì?")
        response = asyncio.run(main.chat(request))

        self.assertIn("answer", response)
        self.assertIn("sources", response)
        self.assertGreaterEqual(len(response["sources"]), 1)
        self.assertTrue(any(source["link"].startswith("#/profile/contact") or "github.com" in source["link"] for source in response["sources"]))

    def test_chat_contact_route_with_contact_keyword_keeps_sources(self):
        request = SimpleNamespace(session_id="test-session-2", message="Quốc liên hệ qua đâu?")
        response = asyncio.run(main.chat(request))

        self.assertEqual(response["answer"], "This is a contact answer from portfolio assistant with GitHub details.")
        self.assertGreaterEqual(len(response["sources"]), 1)
        self.assertTrue(any("github.com" in source["link"] or source["link"].startswith("#/profile/contact") for source in response["sources"]))


if __name__ == "__main__":
    unittest.main()
