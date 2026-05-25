# Project: Legal Education RAG System

> Hệ thống tra cứu văn bản pháp luật giáo dục Việt Nam thông minh, giúp giảng viên, cán bộ quản lý và người làm công tác giáo dục tra cứu nhanh các quy định, điều khoản áp dụng trong bối cảnh nghiệp vụ cụ thể.

---

## Project Overview & Objectives

### Vấn Đề Giải Quyết
- **Quá tải thông tin:** Hàng nghìn văn bản pháp luật (thông tư, nghị định, quyết định) chồng chéo, khó lần theo cấu trúc Chương > Mục > Điều > Khoản.
- **Rào cản ngôn ngữ:** Thuật ngữ pháp lý khó đọc, khó hiểu, dễ suy diễn sai.
- **Trễ thông tin:** 40% người dùng không nắm được cập nhật mới, không biết văn bản nào còn hiệu lực.
- **Mất thời gian:** 30-60 phút để tìm một quy định đơn lẻ.

### Mục Tiêu Dự Án
Xây dựng LegalRAG domain giáo dục với Triple-Gated Cascading Flow:
1. **Gate 1 — Semantic Routing:** 4 tầng routing, 6 intent classes, FAQ shortcut
2. **Gate 2 — GraphRAG Pipeline:** Hybrid parallel search (Qdrant + Neo4j), RRF fusion, temporal fusion, neural reranking, MMR diversity
3. **Gate 3 — Agent Reflection:** Tự kiểm tra retrieval, retry nếu rỗng

---

## Architecture & Tech Stack

### Công Nghệ Sử Dụng (Tech Stack)
- **LLM:** OpenAI GPT-4o, DashScope Qwen
- **Embedding:** 4 providers — OpenAI (text-embedding-3-small), Google Gemini, Cohere, HuggingFace
- **Reranker:** 5 backends — Cohere (retry+backoff), Jina, DashScope, OpenAI, VBPL local
- **Vector DB:** Qdrant (legal_docs_openai collection)
- **Graph DB:** Neo4j (knowledge graph — văn bản, điều khoản, quan hệ thay thế/bổ sung)
- **Auth DB:** PostgreSQL (user management, API keys)
- **Cache:** Redis (session, FAQ cache)
- **Frontend:** Next.js chat UI + Static dashboard
- **Observability:** Langfuse (tracing toàn pipeline, @observe + span_context + scoring)

### Triple-Gated Cascading Flow
```
User Query → RouteHandler [Gate 1] → Agent Loop [Gate 2] → GraphRAG → Agent Reflection [Gate 3] → Output
```

### Gate 1 — Semantic Routing
- **RouteHandler + SemanticRouter:** 4 tầng routing
  1. Pattern match (regex, keyword)
  2. OOS detection (out-of-scope filter)
  3. FAQ shortcut (faq_kb_openai cho câu hỏi phổ biến)
  4. Semantic centroid (vector similarity to intent centroids)
- **6 Intent Classes:** LEGAL_EDU, AMBIGUOUS, NON_LEGAL, CLARIFY, CHITCHAT, OUT_OF_SCOPE

### Gate 2 — GraphRAG Pipeline
- **PipelineConfigBuilder:** Cấu hình động theo query — bật/tắt graph, dynamic top_k (10–30), dynamic weights, skip reranker cho non-legal
- **GraphRAGRetriever:** Hybrid parallel search
  - Qdrant vector search + Neo4j graph traversal
  - FusionEngine (RRF k=20) → Dedup → Temporal fusion → Neural reranking → MMR diversity

### Gate 3 — Agent Reflection
- Tự kiểm tra kết quả retrieval
- Retry với từ khóa khác nếu kết quả rỗng
- Max 10 turns per conversation

---

## Core Features & Workflows

### Tra Cứu Luật Giáo Dục Qua RAG (User)
- Đặt câu hỏi bằng tiếng Việt tự nhiên
- Hệ thống truy xuất văn bản pháp luật liên quan
- Sinh câu trả lời kèm trích dẫn nguồn (Điều, Khoản, văn bản)
- Citation bắt buộc: mọi câu trả lời pháp lý đều kèm nguồn rõ ràng, có thể truy vết

### Chat Đồng Bộ & Streaming
- API đồng bộ cho response nhanh
- SSE streaming real-time cho trải nghiệm chat mượt mà
- LangChain/LangGraph agent với tool calling, max 10 turns

### Lịch Sử Hội Thoại
- Tự động lưu session và message theo user
- Tra cứu lại lịch sử khi cần

---

## Admin & Security

### Quản Trị Viên (Admin)
- **Quản lý người dùng:** Xem, tạo, vô hiệu hóa tài khoản
- **Quản lý API key:** Cấp phát, thu hồi API key cho tích hợp bên thứ ba
- **Audit log:** Theo dõi toàn bộ hoạt động hệ thống theo request
- **Giám sát hệ thống:** Health check, metrics, tracing qua Langfuse

### Guardrails
- **Input guardrail:** Toxicity detection, injection prevention, OOS filter
- **Output guardrail:** Citation check, refusal detection, source normalization
