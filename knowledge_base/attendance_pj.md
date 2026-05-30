# Attendance Tracking App

> Ứng dụng điểm danh đa nền tảng cho môi trường giáo dục và doanh nghiệp.
> Dự án tập trung vào chống gian lận điểm danh bằng `Flutter`, `Firebase`, `Google ML Kit` và `GPS`.

## Overview

### Summary
Attendance Tracking App là ứng dụng di động giúp tự động hóa quy trình điểm danh, hỗ trợ giảng viên quản lý lớp học và giúp sinh viên điểm danh nhanh trên thiết bị cá nhân. Điểm nhấn của hệ thống là xác thực kép gồm nhận diện khuôn mặt và kiểm tra vị trí GPS để giảm gian lận.

### Metadata
- `category`: `project`
- `doc_title`: `Attendance Tracking App`
- `section_title`: `Overview`
- `chunk_title`: `Summary`
- `project_id`: `attendance-app`
- `chunk_type`: `overview`

## Problem & Goals

### Problem Statement
Các phương pháp điểm danh truyền thống như gọi tên, ký giấy hoặc dùng QR tĩnh dễ bị điểm danh hộ và khó xác minh vị trí thực tế. Bài toán cần một cơ chế nhanh hơn, minh bạch hơn và đủ tin cậy cho môi trường lớp học hoặc tổ chức.

### Goals
- Giảm gian lận điểm danh.
- Cho phép sinh viên điểm danh trực tiếp trên điện thoại.
- Hỗ trợ giảng viên theo dõi trạng thái điểm danh theo thời gian thực.
- Đồng bộ dữ liệu ổn định qua Firebase.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Attendance Tracking App`
- `section_title`: `Problem & Goals`
- `chunk_title`: `Problem Statement`
- `project_id`: `attendance-app`
- `chunk_type`: `detail`

## Architecture & Stack

### Tech Stack
- Frontend: `Flutter`, `Dart`
- Backend / BaaS: `Firebase Authentication`, `Cloud Firestore`, `Firebase Cloud Messaging`
- AI / On-device ML: `Google ML Kit Face Detection`
- Location: `Geolocator`, GPS API

### System Design
Hệ thống đi theo hướng serverless và feature-first. Dữ liệu điểm danh được lưu và đồng bộ qua Firestore, xác thực người dùng qua Firebase Authentication, và thông báo đẩy qua FCM. Phần nhận diện khuôn mặt xử lý trực tiếp trên thiết bị để giảm phụ thuộc server và tăng tính riêng tư.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Attendance Tracking App`
- `section_title`: `Architecture & Stack`
- `chunk_title`: `System Design`
- `project_id`: `attendance-app`
- `chunk_type`: `detail`

## Core Workflows

### Workflow 1
Luồng điểm danh chống gian lận:
1. Sinh viên chọn lớp đang mở điểm danh.
2. Ứng dụng chụp và kiểm tra khuôn mặt bằng ML Kit.
3. Ứng dụng lấy vị trí GPS hiện tại.
4. Nếu khuôn mặt khớp và vị trí hợp lệ, bản ghi điểm danh được đồng bộ lên Firestore.

### Workflow 2
Luồng quản trị lớp học:
1. Giảng viên tạo hoặc quản lý lớp học và danh sách sinh viên.
2. Giảng viên mở phiên điểm danh.
3. Hệ thống theo dõi trạng thái tham gia theo thời gian thực.
4. Giảng viên có thể gửi thông báo đẩy đến đúng lớp qua FCM.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Attendance Tracking App`
- `section_title`: `Core Workflows`
- `chunk_title`: `Workflow 1`
- `project_id`: `attendance-app`
- `chunk_type`: `detail`

## Key Details

### Important Constraints
- Nhận diện khuôn mặt chạy on-device để giảm độ trễ và không phải gửi ảnh về server.
- GPS được dùng để xác thực vị trí điểm danh.
- Firestore giữ vai trò đồng bộ thời gian thực.
- Kiến trúc được tổ chức theo `Data`, `Domain`, `Presentation`.

### Tradeoffs
Giải pháp này mạnh về tính minh bạch và realtime, nhưng phụ thuộc vào độ chính xác của camera, GPS và môi trường thiết bị di động. Khi tín hiệu yếu hoặc ánh sáng kém, độ tin cậy của nhận diện có thể giảm.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Attendance Tracking App`
- `section_title`: `Key Details`
- `chunk_title`: `Important Constraints`
- `project_id`: `attendance-app`
- `chunk_type`: `detail`

## Notes

### Known Issues
- Độ chính xác điểm danh phụ thuộc vào chất lượng camera và GPS.
- Dữ liệu realtime cần mạng ổn định để đồng bộ tốt.

### Maintainer Notes
- Giữ đúng tên `attendance-app` cho mọi reference.
- Không trộn chung feature quản trị với luồng sinh viên trong cùng một chunk.
- Nếu thêm tính năng mới, tách ra chunk riêng theo workflow hoặc constraint.

### Metadata
- `category`: `project_detail`
- `doc_title`: `Attendance Tracking App`
- `section_title`: `Notes`
- `chunk_title`: `Known Issues`
- `project_id`: `attendance-app`
- `chunk_type`: `detail`
