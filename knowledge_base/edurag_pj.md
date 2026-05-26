# Project: EduRAG - Tra cứu văn bản pháp luật giáo dục Việt Nam

> Hệ thống tra cứu văn bản pháp luật giáo dục Việt Nam thông minh, giúp giảng viên, cán bộ quản lý và người làm công tác giáo dục tra cứu nhanh các quy định, điều khoản áp dụng trong bối cảnh nghiệp vụ cụ thể. Hệ thống sử dụng LangChain Agent kết hợp với mô hình tìm kiếm lai Hybrid Search (Vector + Graph) trên cơ sở dữ liệu Qdrant và Neo4j.

---

## Kiến Trúc Hệ Thống (Architecture)

### Triple-Gated Cascading Flow
Quy trình xử lý truy vấn của người dùng qua 3 cổng bảo vệ và tối ưu:
- **Gate 1 — Semantic Routing:** Tự động phân loại intent của người dùng thành 6 loại (`LEGAL_EDU`, `AMBIGUOUS`, `NON_LEGAL`, `CLARIFY`, `CHITCHAT`, `OUT_OF_SCOPE`) bằng `RouteHandler` kết hợp `SemanticRouter` 4 tầng (pattern match → OOS filter → FAQ shortcut → semantic centroid similarity).
- **Gate 2 — PipelineConfigBuilder & GraphRAG:** Cấu hình động tham số truy vấn tùy theo độ phức tạp của câu hỏi (bật/tắt Neo4j, số lượng `top_k` động từ 10-30, trọng số). Thực hiện tìm kiếm song song Hybrid Search trên Qdrant vector DB và Neo4j Graph DB, gộp kết quả qua FusionEngine (RRF k=20) rồi sắp xếp lại bằng Neural Reranker (Cohere, Jina, DashScope) và giải thuật MMR để đa dạng hóa câu trả lời.
- **Gate 3 — Agent Reflection:** LangChain Agent tự động đánh giá kết quả tìm kiếm được, tự động sinh từ khóa mới để tìm kiếm lại (retry) nếu kết quả truy xuất rỗng hoặc không đủ thông tin, giới hạn tối đa 10 lượt hội thoại (turns).

---

## Tính Năng & Công Nghệ (Features & Tech Stack)

### Công Nghệ Sử Dụng (Tech Stack)
- **Frameworks & Agents:** LangChain, LangGraph, FastAPI, Next.js
- **Databases:** PostgreSQL (Auth & User), Qdrant (Vector Store), Neo4j (Knowledge Graph), Redis (Caching)
- **AI Models:** OpenAI GPT-4o, DashScope Qwen, Cohere Reranker, Jina Reranker
- **Observability:** Langfuse (@observe, span_context, cost & latency scoring)
- **Deployment:** Docker, Docker Compose, GPU acceleration (optional)

### Trích Dẫn & Đối Chiếu Nguồn (Citations)
Mọi câu trả lời liên quan đến pháp lý bắt buộc phải đi kèm trích dẫn nguồn rõ ràng (Chương, Điều, Khoản, tên văn bản pháp luật). Hệ thống sử dụng output guardrail để kiểm tra và định dạng chuẩn hóa trích dẫn nguồn trước khi trả về cho người dùng.
