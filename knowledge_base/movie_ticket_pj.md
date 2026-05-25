# Project: Movie Ticket Booking System

> Movie Ticket Booking System là một nền tảng đặt vé xem phim toàn diện (Full-stack) được xây dựng trên kiến trúc Client-Server. 
> Hệ thống sử dụng Spring Boot REST API làm backend xử lý các logic nghiệp vụ phức tạp, kết hợp với cơ sở dữ liệu PostgreSQL và cache Redis để đảm bảo hiệu năng tối đa. 
> Phía client được phát triển bằng Flutter, mang lại trải nghiệm ứng dụng di động mượt mà, hỗ trợ đặt vé, chọn ghế ngồi thời gian thực và quản lý tài khoản bảo mật.

---

## Optimizations & Concurrency Control

### Pessimistic Locking với `@Lock` trong Spring Data JPA
Để giải quyết triệt để bài toán đặt trùng ghế (double-booking) khi có hàng ngàn người dùng truy cập đồng thời vào cùng một suất chiếu, hệ thống áp dụng cơ chế **Khóa bi quan (Pessimistic Locking)** ở mức cơ sở dữ liệu.
Trong lớp Repository của Spring Data JPA, phương thức đặt chỗ được bổ sung annotation `@Lock(LockModeType.PESSIMISTIC_WRITE)`. 
Cơ chế này sẽ khóa dòng dữ liệu của ghế/suất chiếu tương ứng ngay khi giao dịch bắt đầu, ngăn chặn các luồng dữ liệu khác đọc hoặc ghi đè cho đến khi giao dịch hiện tại hoàn tất (commit hoặc rollback), đảm bảo tính toàn vẹn dữ liệu tuyệt đối.

### Tối Ưu Hóa Hiệu Năng Bằng Redis Cache
Hệ thống sử dụng **Redis** làm lớp đệm bộ nhớ đệm (caching layer) cho các tài nguyên ít thay đổi nhưng có tần suất truy cập cực kỳ cao như danh sách phim đang chiếu, thông tin chi tiết phim, và lịch chiếu của các rạp.
Bằng cách lưu trữ dữ liệu đã được xử lý dưới dạng Key-Value trong bộ nhớ RAM của Redis thay vì truy vấn trực tiếp vào PostgreSQL, hệ thống đã giảm thiểu đáng kể số lượng truy vấn I/O. 
Kết quả thực tế cho thấy cơ chế này giúp tối ưu hóa và giảm tới **15% độ trễ (latency)** của các API lấy danh sách phim và suất chiếu.

### Cơ Chế Phân Trang (Pagination) Cho API
Đối với các tài nguyên có dung lượng lớn như danh mục lịch sử đặt vé của người dùng hoặc danh sách phim cũ, hệ thống áp dụng cơ chế **phân trang (pagination)** ở cấp độ API thông qua `Pageable` và `Page` của Spring Data.
Thay vì trả về toàn bộ hàng ngàn bản ghi trong một request duy nhất (gây quá tải đường truyền mạng và bộ nhớ client), hệ thống giới hạn lượng dữ liệu trả về theo từng trang (ví dụ: 10-20 bản ghi mỗi trang).
Giải pháp này giúp giảm tải đáng kể cho hệ thống backend, tăng tốc độ phản hồi và tiết kiệm dung lượng mạng cho thiết bị di động của người dùng.

---

## Architecture & Security

### Stateless Authentication với JWT
Hệ thống áp dụng phương pháp xác thực không trạng thái (stateless authentication) sử dụng **JSON Web Token (JWT)** để tăng tính mở rộng (scalability) của backend.
Khi người dùng đăng nhập thành công, Server sẽ tạo ra một token ký số chứa các thông tin định danh và quyền hạn của họ. 
Phía ứng dụng di động Flutter nhận JWT và lưu trữ an toàn trong bộ nhớ cục bộ (Local Storage). 
Mỗi khi gửi yêu cầu tới các API cần bảo mật, client sẽ đính kèm token này trong Header của HTTP Request (`Authorization: Bearer <Token>`) để Server giải mã và xác thực.

### Phân Quyền Vai Trò ADMIN và USER
Hệ thống phân quyền truy cập nghiêm ngặt dựa trên vai trò (Role-based Access Control) bằng cách sử dụng Spring Security:
- **Role USER:** Dành cho khách hàng phổ thông, có quyền xem danh sách phim, tìm kiếm suất chiếu, thực hiện đặt vé và xem lại lịch sử giao dịch cá nhân.
- **Role ADMIN:** Dành cho người quản trị hệ thống, có toàn quyền truy cập các API quản lý như thêm/sửa/xóa phim, tạo mới các phòng chiếu, điều chỉnh lịch chiếu, và theo dõi doanh thu toàn hệ thống.

---

## Core Features & Workflows

### Luồng Chọn Ghế Và Đặt Vé Thời Gian Thực
Luồng đặt vé được thiết kế tối ưu trải nghiệm người dùng:
1. Người dùng chọn phim, rạp chiếu, và suất chiếu mong muốn.
2. Ứng dụng hiển thị sơ đồ ghế ngồi dưới dạng lưới (Grid View) tương ứng với cấu trúc phòng chiếu.
3. Khi người dùng click chọn ghế, hệ thống sẽ gửi một request kiểm tra và tạo trạng thái giữ ghế tạm thời.
4. Quá trình thanh toán giả lập được thực hiện, sau khi thành công, trạng thái ghế sẽ chính thức chuyển sang "đã đặt" và hóa đơn vé (Ticket) được tạo trong cơ sở dữ liệu.

### Quản Lý Danh Mục Phim Và Suất Chiếu Cho Admin
Trang quản trị (Admin Dashboard) hỗ trợ các chức năng quản lý quan trọng:
- Quản trị viên có giao diện thuận tiện để cập nhật thông tin phim (poster, trailer, mô tả, thời lượng).
- Hệ thống hỗ trợ lên lịch chiếu linh hoạt bằng cách kiểm tra xung đột thời gian chiếu giữa các phim trong cùng một phòng chiếu.
- Giao diện Admin hiển thị trực quan các báo cáo về tỷ lệ lấp đầy ghế ngồi của từng suất chiếu để Admin có kế hoạch phân bổ suất chiếu tối ưu.
