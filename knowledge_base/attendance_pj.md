# Project: Attendance Tracking App

> Attendance Tracking App là một ứng dụng di động đa nền tảng thông minh hỗ trợ tự động hóa và minh bạch hóa quy trình điểm danh trong các tổ chức giáo dục và doanh nghiệp.
> Ứng dụng được phát triển trên nền tảng Flutter và Dart theo mô hình Serverless sử dụng hệ sinh thái Firebase, tích hợp trí tuệ nhân tạo (Google ML Kit Face Detection) và hệ thống định vị GPS để chống gian lận điểm danh.
> Tài liệu này mô tả chi tiết kiến trúc, cấu trúc mã nguồn, cơ chế phân quyền, và giải pháp kỹ thuật của dự án.

---

## Project Overview & Objectives

### Mục Tiêu Dự Án Và Đối Tượng Sử Dụng
Mục tiêu chính của `attendance_app` là tối ưu hóa việc quản lý các khóa học, lớp học và tự động hóa hoạt động điểm danh hàng ngày. 
Đối tượng sử dụng chính của hệ thống bao gồm:
- **Giảng viên (Admin):** Cần một công cụ nhanh chóng, trực quan để mở các buổi điểm danh, giám sát trạng thái điểm danh theo thời gian thực và quản lý lớp học.
- **Sinh viên (User):** Cần một phương thức điểm danh nhanh chóng, tự phục vụ ngay trên thiết bị di động cá nhân nhưng vẫn đảm bảo tính chính xác và bảo mật.

### Bài Toán Gian Lận & Giải Pháp Điểm Danh Minh Bạch
Các hệ thống điểm danh truyền thống (gọi tên, ký giấy, quét mã QR tĩnh) gặp lỗ hổng lớn về tình trạng điểm danh hộ và gian lận vị trí địa lý.
Để giải quyết triệt để bài toán này, `attendance_app` tích hợp giải pháp xác thực kép:
1. **Nhận diện khuôn mặt ngoại tuyến (Offline Face Detection):** Sử dụng Google ML Kit chạy trực tiếp trên thiết bị để đối khớp khuôn mặt sinh viên với dữ liệu đăng ký gốc.
2. **Xác thực vị trí GPS (GPS Verification):** Sử dụng API phần cứng di động để xác minh sinh viên đang thực sự có mặt trong bán kính lớp học được cấu hình bởi giảng viên.

---

## Architecture & Tech Stack

### Kiến Trúc Serverless Với Firebase Suite
Hệ thống sử dụng mô hình Serverless để tối ưu chi phí vận hành và tốc độ triển khai:
- **Firebase Cloud Firestore:** Cơ sở dữ liệu NoSQL lưu trữ phi tập trung, hỗ trợ đồng bộ dữ liệu thời gian thực (Real-time synchronization) giữa thiết bị của sinh viên và giảng viên.
- **Firebase Authentication:** Quản lý quy trình đăng nhập, đăng ký và bảo mật phiên truy cập của người dùng.
- **Firebase Cloud Messaging (FCM):** Kênh truyền tin cậy hỗ trợ giảng viên gửi thông báo đẩy (Push Notifications) tức thời đến sinh viên.

### Mô Hình Thiết Kế CVMM (Clean Architecture + MVVM)
Mã nguồn Flutter được thiết kế theo cấu trúc Feature-First kết hợp mẫu thiết kế CVMM, chia nhỏ dự án thành các lớp độc lập:
- **Tầng Data:** Chứa các Models (ánh xạ dữ liệu JSON/Firestore) và các Data Sources (giao tiếp trực tiếp với Firestore API, thiết bị GPS).
- **Tầng Domain:** Chứa các thực thể cốt lõi (Entities) và các nghiệp vụ thuần túy (Use Cases), hoàn toàn độc lập với các thư viện bên ngoài.
- **Tầng Presentation:** Chứa các ViewModels quản lý trạng thái giao diện và các Views (Widget UI) hiển thị cho người dùng.

### Tích Hợp Phần Cứng Và Trí Tuệ Nhân Tạo
Ứng dụng tương tác trực tiếp với các API phần cứng thông qua các gói thư viện di động:
- **Google ML Kit Face Detection:** Thư viện chạy trực tiếp trên thiết bị (on-device Machine Learning) để phát hiện khuôn mặt và trích xuất đặc trưng sinh trắc học mà không cần gửi ảnh về server.
- **Geolocator API:** Lấy tọa độ kinh độ và vĩ độ chính xác của thiết bị di động tại thời điểm điểm danh để phục vụ tính năng geofencing.

---

## Role-Based Access Control (RBAC)

### Chức Năng Của Giảng Viên (Admin Role)
Người dùng có vai trò giảng viên được phân quyền thực hiện các nghiệp vụ quản trị:
- **Quản lý khóa học (Course Management):** Thực hiện đầy đủ các thao tác CRUD (Thêm, Xem, Sửa, Xóa) thông tin khóa học, lớp học và danh sách sinh viên trực thuộc lớp học đó.
- **Gửi thông báo khẩn (Broadcast Notifications):** Tạo nội dung và kích hoạt gửi thông báo đẩy qua FCM đến toàn bộ thiết bị của sinh viên trong lớp học chỉ định.
- **Giám sát điểm danh thời gian thực (Attendance Monitoring):** Theo dõi danh sách sinh viên đã điểm danh thành công dưới dạng live feed cập nhật tự động từ Firestore.

### Chức Năng Của Sinh Viên (User Role)
Người dùng có vai trò sinh viên được phân quyền thực hiện các nghiệp vụ tự phục vụ:
- **Quản lý hồ sơ (Profile Management):** Tự cập nhật thông tin cá nhân và chụp ảnh đăng ký khuôn mặt gốc phục vụ việc đối sánh sau này.
- **Tra cứu trạng thái lớp học:** Xem danh sách các lớp học mình tham gia và xem lớp nào đang mở phiên điểm danh.
- **Lịch sử điểm danh cá nhân:** Xem thống kê chi tiết số buổi học đã tham gia (Verified) hoặc vắng mặt (Absent) trong kỳ học.

---

## Core Workflows & Project Structure

### Luồng Nghiệp Vụ Điểm Danh Chống Gian Lận (Anti-Fraud Workflow)
Quy trình điểm danh được kiểm soát nghiêm ngặt qua 4 bước:
1. **Bắt đầu:** Sinh viên chọn lớp đang "Mở điểm danh" trên ứng dụng.
2. **Nhận diện khuôn mặt:** Camera trước kích hoạt, **Google ML Kit** quét và trích xuất đặc trưng khuôn mặt của sinh viên tại chỗ, đối chiếu trực tiếp với đặc trưng khuôn mặt gốc đã lưu trong máy/Firestore.
3. **Xác thực vị trí:** Ứng dụng lấy vị trí GPS hiện tại của sinh viên và tính toán khoảng cách (distance) tới tọa độ rạp/phòng học của giảng viên.
4. **Cập nhật dữ liệu:** Nếu khuôn mặt khớp và vị trí hợp lệ (nằm trong bán kính cho phép), bản ghi điểm danh chứa tọa độ GPS và thời gian điểm danh được đồng bộ trực tiếp lên Firebase Firestore để giảng viên phê duyệt.

### Cấu Trúc Thư Mục Chuẩn Hóa Của Dự Án (lib/)
Cấu trúc mã nguồn của ứng dụng được tổ chức chặt chẽ theo từng tính năng độc lập (Feature-First):
```text
lib/
├── app/                        # Cấu hình toàn cục (App Routes, Global Themes, DI/Service Locator)
├── core/                       # Các hàm tiện ích dùng chung (GPS Helpers, ML Kit Wrapper, Firebase Clients)
├── features/                   # Phát triển theo từng Tính năng (Feature-First)
│   ├── auth/                   # Tính năng Xác thực & Phân quyền
│   ├── course_management/      # Tính năng CRUD Khóa học (Dành cho Admin)
│   ├── notification/           # Tính năng Gửi/Nhận thông báo qua FCM
│   └── attendance/             # Tính năng Điểm danh (ML Kit + GPS)
│       ├── data/               # Tầng Data: Gồm Models & DataSources
│       │   ├── datasources/attendance_remote_datasource.dart
│       │   └── models/attendance_log_model.dart
│       ├── domain/             # Tầng Domain: Entities & UseCases
│       │   ├── entities/attendance_entity.dart
│       │   └── usecases/submit_attendance_usecase.dart
│       └── presentation/       # Tầng Presentation: ViewModels & Views
│           ├── viewmodels/attendance_viewmodel.dart
│           └── views/attendance_scan_view.dart
└── main.dart                   # Điểm khởi chạy hệ thống
```