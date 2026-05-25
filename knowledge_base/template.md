# [Tên Dự Án hoặc Tên Chủ Đề Chính]

> Đây là phần tóm tắt (Summary / Introduction) của tài liệu này. 
> Toàn bộ khối văn bản giới thiệu/trích dẫn này (nằm dưới tiêu đề `#` và trước tiêu đề `###` đầu tiên) 
> sẽ được hệ thống parser tự động tách thành một chunk độc lập mang tính tổng quát.
> - **Metadata được gán:** 
>   - `category`: `summary` hoặc `project_detail`
>   - `doc_title`: "[Tên Dự Án hoặc Tên Chủ Đề Chính]"
>   - `section_title`: "summary"
>   - `chunk_title`: "Overview & Summary"

## [Tên Phần Lớn 1 - Ví dụ: Tính Năng Cốt Lõi]

### [Tên Chunk 1.1 - Ví dụ: Quản Lý Người Dùng]
Viết nội dung chi tiết cho tính năng quản lý người dùng ở đây.
Mỗi nội dung nằm dưới tiêu đề cấp 3 `###` sẽ được coi là một chunk văn bản riêng biệt được lưu vào Vector Database.
- **Metadata tự động trích xuất:**
  - `doc_title`: Lấy từ `#` đầu file.
  - `section_title`: "[Tên Phần Lớn 1 - Ví dụ: Tính Năng Cốt Lõi]" (Lấy từ `##` gần nhất phía trên).
  - `chunk_title`: "[Tên Chunk 1.1 - Ví dụ: Quản Lý Người Dùng]" (Lấy từ `###` hiện tại).

### [Tên Chunk 1.2 - Ví dụ: Quét Mã QR Xác Thực]
Nội dung chi tiết cho tính năng quét mã QR...

---

## [Tên Phần Lớn 2 - Ví dụ: Kiến Trúc Kỹ Thuật]

### [Tên Chunk 2.1 - Ví dụ: Thiết Kế Cơ Sở Dữ Liệu]
Viết chi tiết về cơ sở dữ liệu (PostgreSQL, Redis, Qdrant...) dùng trong dự án.
- **Metadata tự động trích xuất:**
  - `doc_title`: Lấy từ `#` đầu file.
  - `section_title`: "[Tên Phần Lớn 2 - Ví dụ: Kiến Trúc Kỹ Thuật]"
  - `chunk_title`: "[Tên Chunk 2.1 - Ví dụ: Thiết Kế Cơ Sở Dữ Liệu]"

### [Tên Chunk 2.2 - Ví dụ: Cơ Chế Đồng Bộ Offline-first]
Nội dung chi tiết về cơ chế đồng bộ...

---

## 💡 Hướng Dẫn Viết Tài Liệu Nhất Quán
1. **Tiêu đề `#` (Cấp 1):** Chỉ xuất hiện duy nhất **1 lần** ở đầu tệp để định danh tên dự án hoặc chủ đề lớn.
2. **Tiêu đề `##` (Cấp 2):** Sử dụng để phân nhóm các chủ đề lớn (như Tổng quan, Kỹ thuật, Tính năng, Thách thức).
3. **Tiêu đề `###` (Cấp 3):** Sử dụng để phân chia các khối thông tin nhỏ, tập trung (khoảng 100 - 400 từ). Đây là ranh giới phân tách các chunk để lưu vào Vector DB.
4. **Tránh bỏ trống:** Không để các tiêu đề `##` hoặc `###` mà không có nội dung văn bản đi kèm.
