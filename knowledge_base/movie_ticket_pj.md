# Movie Ticket Booking System

> Nền tảng đặt vé xem phim full-stack cho client mobile và backend REST API.
> Dự án tập trung vào đặt ghế thời gian thực, hiệu năng cache, và quản lý phân quyền bằng `Spring Boot`, `PostgreSQL`, `Redis`, `Flutter`.

## Overview

### Summary
Movie Ticket Booking System là nền tảng đặt vé xem phim hỗ trợ người dùng chọn phim, chọn ghế, đặt vé và theo dõi lịch sử giao dịch. Hệ thống được thiết kế để xử lý cạnh tranh cao ở bước chọn ghế và tối ưu trải nghiệm mobile.

### Metadata
- `category`: `project`
- `doc_title`: `Movie Ticket Booking System`
- `section_title`: `Overview`
- `chunk_title`: `Summary`
- `project_id`: `movie-ticket`
- `chunk_type`: `overview`

## Problem & Goals

### Problem Statement
Đặt vé xem phim có rủi ro trùng ghế khi nhiều người thao tác đồng thời, đồng thời danh sách phim và suất chiếu thường được truy vấn rất nhiều nên cần cơ chế giảm độ trễ và giữ trải nghiệm ổn định.

### Goals
- Ngăn double-booking.
- Giảm latency cho dữ liệu truy cập nhiều.
- Hỗ trợ phân quyền user/admin rõ ràng.
- Tối ưu trải nghiệm đặt vé trên mobile.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Movie Ticket Booking System`
- `section_title`: `Problem & Goals`
- `chunk_title`: `Problem Statement`
- `project_id`: `movie-ticket`
- `chunk_type`: `detail`

## Architecture & Stack

### Tech Stack
- Backend: `Java`, `Spring Boot`, `Spring Data JPA`, `Spring Security`
- Database: `PostgreSQL`
- Cache: `Redis`
- Auth: `JWT`
- Client: `Flutter`

### System Design
Backend xử lý logic nghiệp vụ và bảo mật, PostgreSQL lưu dữ liệu chính, Redis cache các tài nguyên truy cập cao như danh sách phim và suất chiếu. Client Flutter giao tiếp qua REST API để chọn ghế, đặt vé và quản lý tài khoản.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Movie Ticket Booking System`
- `section_title`: `Architecture & Stack`
- `chunk_title`: `System Design`
- `project_id`: `movie-ticket`
- `chunk_type`: `detail`

## Core Workflows

### Workflow 1
Luồng đặt vé thời gian thực:
1. Người dùng chọn phim, rạp và suất chiếu.
2. UI hiển thị sơ đồ ghế.
3. Hệ thống kiểm tra và giữ ghế tạm thời.
4. Sau thanh toán thành công, vé được tạo và ghế chuyển sang trạng thái đã đặt.

### Workflow 2
Luồng quản trị:
1. Admin cập nhật phim, trailer, mô tả và thời lượng.
2. Admin lên lịch chiếu theo phòng.
3. Hệ thống kiểm tra xung đột thời gian.
4. Admin theo dõi tỷ lệ lấp đầy ghế để tối ưu suất chiếu.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Movie Ticket Booking System`
- `section_title`: `Core Workflows`
- `chunk_title`: `Workflow 1`
- `project_id`: `movie-ticket`
- `chunk_type`: `detail`

## Key Details

### Important Constraints
- `@Lock(LockModeType.PESSIMISTIC_WRITE)` được dùng để giảm nguy cơ đặt trùng ghế.
- Redis giúp giảm tới `15%` độ trễ cho các API truy vấn phim và suất chiếu.
- Pagination giới hạn dữ liệu trả về theo trang, thường khoảng `10-20` bản ghi mỗi trang.
- JWT dùng cho xác thực không trạng thái.

### Tradeoffs
Pessimistic locking giúp an toàn hơn khi tải cao nhưng có thể làm tăng thời gian chờ trong các phiên đặt vé cạnh tranh. Redis cải thiện tốc độ nhưng cần chiến lược cache hợp lý để tránh dữ liệu cũ.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Movie Ticket Booking System`
- `section_title`: `Key Details`
- `chunk_title`: `Important Constraints`
- `project_id`: `movie-ticket`
- `chunk_type`: `detail`

## Notes

### Known Issues
- Tải cao ở cùng một suất chiếu có thể gây tranh chấp lock.
- Dữ liệu cache cần TTL hoặc invalidate hợp lý để tránh stale data.

### Maintainer Notes
- Giữ thống nhất `movie-ticket` làm `project_id`.
- Nếu thêm tính năng thanh toán thật, tách riêng một chunk cho payment flow.
- Không trộn các chi tiết JPA lock với phần auth trong cùng một chunk nếu muốn retrieval sắc hơn.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Movie Ticket Booking System`
- `section_title`: `Notes`
- `chunk_title`: `Known Issues`
- `project_id`: `movie-ticket`
- `chunk_type`: `detail`
