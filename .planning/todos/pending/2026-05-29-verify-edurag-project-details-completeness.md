---
created: "2026-05-29T03:57:32.562Z"
title: "Verify EduRAG project details completeness"
area: "ui"
files:
  - "src/data/portfolio-config.js:22-101"
  - "knowledge_base/edurag_pj.md"
---

## Problem

EduRAG project trong `portfolio-config.js` đã có `architecture` dạng object và `keyModules` dạng object array (tốt), nhưng thiếu `notes` section so với 2 project kia (movie-ticket và attendance-app đã được cập nhật có notes). Cần verify toàn bộ EduRAG entry so với KB để đảm bảo:
- `notes` section với known issues và maintainer notes
- `systemSpecs` đầy đủ (hiện tại có 4 keys, KB mentions thêm Cohere Reranker, LangGraph)
- Consistency với format của 2 project còn lại

## Solution

1. Đọc `knowledge_base/edurag_pj.md` để extract notes, constraints, tradeoffs
2. Thêm `notes` array vào `details` của edurag project
3. Review `systemSpecs` xem có thiếu component nào không (Cohere, LangGraph)
4. Verify JS syntax sau khi edit
