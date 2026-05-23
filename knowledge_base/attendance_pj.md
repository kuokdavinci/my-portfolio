# Tài liệu Hệ thống: Ứng dụng Điểm danh Thông minh (attendance_app)
## Tài liệu Tri thức Nâng cao dành cho RAG Chatbot

Tài liệu này mô tả chi tiết kiến trúc, phân quyền, luồng nghiệp vụ và cấu trúc mã nguồn của dự án **attendance_app** do tác giả **kuokdavinci** phát triển. Dữ liệu được tổ chức theo các phân đoạn logic nhằm tối ưu hóa khả năng truy xuất (retrieval) cho chatbot khi trả lời các câu hỏi về dự án, giải pháp kỹ thuật và tư duy kiến trúc của tác giả.

---

### 1. Tổng quan Dự án & Bài toán Giải quyết (Project Overview)
* **Tên dự án:** `attendance_app`
* **Tác giả:** kuokdavinci
* **Mục tiêu:** Ứng dụng di động đa nền tảng hỗ trợ quản lý khóa học, phân quyền giảng viên/sinh viên và thực hiện điểm danh thông minh.
* **Bài toán cốt lõi & Giải pháp:** 
  * *Hạn chế của hệ thống cũ:* Tình trạng điểm danh hộ, thiếu minh bạch và không xác thực được sự hiện diện thực tế của sinh viên.
  * *Giải pháp cải tiến:* Tích hợp công nghệ nhận diện khuôn mặt ngoại tuyến (**Google ML Kit**) kết hợp đối chiếu tọa độ địa lý (**GPS Verification**) tại thời điểm điểm danh để đảm bảo tính minh bạch tuyệt đối.

### 2. Kiến trúc Hệ thống & Tech Stack
* **Mô hình:** Serverless Architecture.
* **Frontend:** Flutter & Dart.
* **Kiến trúc mã nguồn (Architecture Pattern):** **CVMM (Clean Architecture + MVVM / Feature-First)**. Chia hệ thống thành các lớp độc lập: Data (Nguồn dữ liệu, Model, Repository triển khai) -> Domain (Entity, Nghiệp vụ thuần túy, UseCases) -> Presentation (Giao diện và ViewModel/State Management).
* **Backend-as-a-Service:** **Firebase Suite** toàn diện:
  * *Firebase Cloud Firestore:* Cơ sở dữ liệu NoSQL lưu trữ thời gian thực (Real-time DB).
  * *Firebase Authentication:* Quản lý định danh và phân quyền người dùng.
  * *Firebase Cloud Messaging (FCM):* Hệ thống gửi và nhận thông báo đẩy (Push Notifications).
* **AI & Hardware Integration:** **Google ML Kit Face Detection** (Xử lý nhận diện khuôn mặt ngay trên thiết bị) và **Geolocator API** (Thu thập vị trí GPS).

### 3. Hệ thống Phân quyền & Tính năng Chính (Role-Based Access Control)

#### A. Quyền Admin (Giảng viên / Giáo viên)
* **Quản lý Khóa học (Course Management):** Thực hiện đầy đủ các thao tác CRUD (Tạo mới, Xem, Cập nhật, Xóa) thông tin các khóa học, lớp học do mình phụ trách.
* **Gửi Thông báo (Broadcast Notifications):** Tạo và gửi thông báo đẩy qua FCM đến toàn bộ sinh viên trong lớp học/khóa học được chỉ định.
* **Giám sát Điểm danh (Attendance Monitoring):** Kiểm tra, kết xuất và quản lý danh sách dữ liệu điểm danh của sinh viên theo thời gian thực.

#### B. Quyền User (Sinh viên)
* **Quản lý Hồ sơ (Profile Management):** Kiểm tra và tự cập nhật thông tin cá nhân (Thông tin liên hệ, ảnh đại diện, dữ liệu khuôn mặt gốc).
* **Tra cứu Lớp học:** Xem danh sách các lớp học kèm theo trạng thái trực quan (Lớp đang Đóng hoặc Mở).
* **Kiểm tra Trạng thái Điểm danh:** Xem lịch sử và trạng thái điểm danh của bản thân tại từng buổi học (Đã điểm danh / Vắng mặt).
* **Nhận Thông báo:** Tiếp nhận các thông báo nhắc nhở lịch học hoặc thông báo khẩn từ giảng viên qua hệ thống Notification trực tuyến.

### 4. Luồng Nghiệp vụ Điểm danh Minh bạch (Anti-Fraud Attendance Workflow)
Hệ thống giải quyết triệt để bài toán gian lận thông qua luồng xử lý nghiêm ngặt sau:
1. **Kích hoạt:** Sinh viên nhấn điểm danh tại một lớp học đang ở trạng thái "Mở".
2. **Quét khuôn mặt (Face Detection):** Ứng dụng bật camera, sử dụng gói **Google ML Kit** để nhận diện và trích xuất các điểm đặc trưng trên khuôn mặt (Face Features), đối chiếu trực tiếp với dữ liệu khuôn mặt gốc đã đăng ký để xác nhận chính chủ.
3. **Xác thực Vị trí (GPS Verification):** Đồng thời, ứng dụng truy cập phần cứng GPS của thiết bị để lấy tọa độ (Kinh độ/Vĩ độ) hiện tại. Hệ thống đối chiếu khoảng cách giữa sinh viên và tọa độ của phòng học được thiết lập bởi Giảng viên.
4. **Đồng bộ hóa Real-time:** Nếu cả 2 điều kiện (Khuôn mặt hợp lệ + Vị trí nằm trong bán kính cho phép) đều thỏa mãn, một bản ghi (Document) chứa `timestamp`, `face_status: verified` và `location` sẽ được ghi thẳng vào Firebase Firestore. Giảng viên ngay lập tức nhìn thấy trạng thái "Đã điểm danh" trên màn hình quản lý nhờ cơ chế lắng nghe Real-time.

### 5. Cấu trúc Thư mục chuẩn Kiến trúc CVMM (Project Directory Structure)
Mã nguồn thư mục `lib/` được tổ chức chặt chẽ giúp Chatbot dễ dàng điều hướng cấu trúc dự án:
```text
lib/
├── app/                        # Cấu hình toàn cục (App Routes, Global Themes, DI/Service Locator)
├── core/                       # Các hàm tiện ích dùng chung (GPS Helpers, ML Kit Wrapper, Firebase Clients)
├── features/                   # Phát triển theo từng Tính năng (Feature-First)
│   ├── auth/                   # Tính năng Xác thực & Phân quyền
│   ├── course_management/      # Tính năng CRUD Khóa học (Dành cho Admin)
│   ├── notification/           # Tính năng Gửi/Nhận thông báo qua FCM
│   └── attendance/             # Tính năng Điểm danh (ML Kit + GPS)
│       ├── data/               # Tầng Data: Gồm Models (Data Mapping) & DataSources (Firestore Remote, GPS Service)
│       │   ├── datasources/attendance_remote_datasource.dart
│       │   └── models/attendance_log_model.dart
│       ├── domain/             # Tầng Domain: Bản thể nghiệp vụ (Entities) & Luồng xử lý (UseCases)
│       │   ├── entities/attendance_entity.dart
│       │   └── usecases/submit_attendance_usecase.dart
│       └── presentation/       # Tầng Presentation: MVVM / Controllers & UI Widgets
│           ├── viewmodels/attendance_viewmodel.dart
│           └── views/attendance_scan_view.dart
└── main.dart                   # Điểm khởi chạy hệ thống