# EduRAG - Vietnamese Education Law RAG System

> Hệ thống tra cứu pháp luật giáo dục Việt Nam theo hướng RAG và hybrid retrieval.
> Dự án tập trung vào semantic routing, GraphRAG, citation, và pipeline truy xuất ổn định cho câu hỏi pháp lý.

## Overview

### Summary
EduRAG là hệ thống tra cứu văn bản pháp luật giáo dục Việt Nam giúp người dùng tìm nhanh quy định, điều khoản và ngữ cảnh áp dụng. Hệ thống kết hợp semantic routing, vector search và knowledge graph để tăng độ chính xác khi truy xuất và trả lời.

### Metadata
- `category`: `project`
- `doc_title`: `EduRAG - Vietnamese Education Law RAG System`
- `section_title`: `Overview`
- `chunk_title`: `Summary`
- `project_id`: `edurag-app`
- `chunk_type`: `overview`

## Problem & Goals

### Problem Statement
Legacy RAG gặp vấn đề recall thấp khi truy xuất văn bản pháp luật giáo dục vì dữ liệu thường phân mảnh, nhiều tầng cấu trúc Chương, Mục, Điều, Khoản và phụ thuộc mạnh vào semantic match đơn thuần. Người dùng dễ nhận kết quả thiếu ngữ cảnh hoặc bỏ sót văn bản liên quan.

### Goals
- Nâng recall so với baseline legacy RAG.
- Giảm độ trễ trung bình bằng routing hợp lý.
- Trả lời theo đúng ngữ cảnh nghiệp vụ.
- Hỗ trợ trích dẫn nguồn rõ ràng.
- Tăng độ chính xác bằng GraphRAG và reflection.

### Metadata
- `category`: `project_detail`
- `doc_title`: `EduRAG - Vietnamese Education Law RAG System`
- `section_title`: `Problem & Goals`
- `chunk_title`: `Problem Statement`
- `project_id`: `edurag-app`
- `chunk_type`: `detail`

## Architecture & Stack

### Tech Stack
- Frameworks: `LangChain`, `LangGraph`, `FastAPI`, `Next.js`
- Vector store: `Qdrant`
- Graph database: `Neo4j`
- Cache / session: `Redis`
- LLM / Embedding: `OpenAI GPT-4o`, `text-embedding-3-small`
- Observability: `Langfuse`

### System Design
Pipeline của EduRAG được thiết kế để khắc phục điểm yếu của legacy RAG theo 3 lớp:
1. Semantic routing để phân loại intent và giảm truy vấn không cần thiết.
2. GraphRAG / hybrid retrieval để kết hợp vector search với knowledge graph, tăng khả năng bắt đúng quan hệ pháp lý và cải thiện recall.
3. Agent reflection để kiểm tra lại câu trả lời khi context chưa đủ hoặc cần truy xuất bổ sung.

Semantic router cũng được dùng như một lớp tối ưu hiệu năng, giúp giảm average latency khoảng `30%` so với trước khi áp dụng.

### Metadata
- `category`: `project_detail`
- `doc_title`: `EduRAG - Vietnamese Education Law RAG System`
- `section_title`: `Architecture & Stack`
- `chunk_title`: `System Design`
- `project_id`: `edurag-app`
- `chunk_type`: `detail`

## Core Workflows

### Workflow 1
Luồng truy vấn pháp lý:
1. Người dùng đặt câu hỏi bằng tiếng Việt.
2. Semantic router phân loại intent và xác định phạm vi truy xuất.
3. Hệ thống truy xuất context từ Qdrant và Neo4j theo chiến lược GraphRAG.
4. Agent tổng hợp câu trả lời kèm trích dẫn nguồn.

### Workflow 2
Luồng tối ưu chất lượng:
1. Nếu kết quả truy xuất chưa đủ, agent tạo lại truy vấn hoặc bổ sung từ khóa.
2. Hệ thống kiểm tra logic câu trả lời.
3. Nếu cần, truy xuất lại để bổ sung ngữ cảnh.
4. Trả về câu trả lời cuối cùng đã chuẩn hóa.

### Metadata
- `category`: `project_detail`
- `doc_title`: `EduRAG - Vietnamese Education Law RAG System`
- `section_title`: `Core Workflows`
- `chunk_title`: `Workflow 1`
- `project_id`: `edurag-app`
- `chunk_type`: `detail`

## Key Details

### Important Constraints
- Semantic routing có 6 intent classes.
- Gate 2 dùng hybrid search với `Qdrant + Neo4j`.
- Dynamic `top_k` trong pipeline có thể nằm trong khoảng `10-30` tùy query.
- Câu trả lời pháp lý phải đi kèm citation rõ ràng.
- Recall baseline trước khi tối ưu là khoảng `54%`.
- Recall sau khi chọn `top-k` hợp lý và tối ưu retrieval tăng lên khoảng `80%`.
- Average latency giảm khoảng `30%` sau khi áp dụng semantic router.

### Tradeoffs
Pipeline nhiều lớp giúp tăng độ chính xác nhưng đổi lại hệ thống phức tạp hơn, khó debug hơn và phụ thuộc vào chất lượng routing, retrieval và reranking. Với câu hỏi ngoài phạm vi pháp lý, hệ thống cần lọc chặt để tránh sinh câu trả lời lệch.

### Benchmark Summary
- Legacy RAG: recall thấp hơn, khó giữ ngữ cảnh đủ sâu cho văn bản pháp luật phân mảnh.
- GraphRAG: cải thiện recall đáng kể nhờ kết hợp vector search với graph traversal.
- Semantic router: giảm average latency khoảng `30%`.
- Top-k hợp lý: nâng recall từ khoảng `54%` lên gần `80%`.

### Metadata
- `category`: `project_detail`
- `doc_title`: `EduRAG - Vietnamese Education Law RAG System`
- `section_title`: `Key Details`
- `chunk_title`: `Important Constraints`
- `project_id`: `edurag-app`
- `chunk_type`: `detail`

## Notes

### Known Issues
- Nếu routing sai, hệ thống có thể đi vào nhánh retrieval không phù hợp.
- Citation quality phụ thuộc mạnh vào context đầu vào và chuẩn hóa nguồn.

### Maintainer Notes
- Giữ thống nhất `edurag-app` làm `project_id`.
- Tách rõ chunk về routing, retrieval và citation khi cập nhật nội dung.
- Tránh nhồi quá nhiều layer kỹ thuật vào một chunk nếu không có câu hỏi thực sự cần nó.

### Metadata
- `category`: `project_detail`
- `doc_title`: `EduRAG - Vietnamese Education Law RAG System`
- `section_title`: `Notes`
- `chunk_title`: `Known Issues`
- `project_id`: `edurag-app`
- `chunk_type`: `detail`
