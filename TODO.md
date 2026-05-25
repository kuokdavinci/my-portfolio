# Project TODO List

- [x] Chuyển chiều (vector dimension) của Qdrant (ví dụ: điều chỉnh kích thước vector hoặc cấu hình chiều trong Qdrant khi thay đổi hoặc tối ưu hóa embedding model).
- [x] Thiết kế Heading-based Chunking (phân mảnh theo tiêu đề Markdown `#`, `##`, `###`).
- [x] Tạo tệp `template.md` làm tài liệu chuẩn hóa dữ liệu đầu vào.
- [x] Định dạng lại tệp tài liệu `attendance_pj.md` và `movie_ticket_pj.md` theo chuẩn cấu trúc tiêu đề.
- [x] Cập nhật logic parse và ingest trong `setup_qdrant.py` để sử dụng Contextual Hierarchical Chunking (bổ sung ngữ cảnh Parent Document và Section vào text).
- [x] Chạy bộ test case và đạt kết quả kiểm thử chính xác 100% (6/6).
