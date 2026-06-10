# Hướng Dẫn Deploy Dự Án Lên Vercel & Neon (Miễn Phí 100%, Không Cần Thẻ Tín Dụng)

Để thuận tiện nhất và không yêu cầu thẻ tín dụng (như Render), mình đã cấu hình lại dự án để **chạy cả Frontend và Backend chung trên Vercel** (miễn phí, tốc độ cực nhanh, server không bị ngủ).

Sơ đồ hoạt động:
* **Database (PostgreSQL)**: Chạy trên **Neon.tech** (Miễn phí vĩnh viễn).
* **Ứng dụng Web (React Frontend + Express Backend)**: Chạy trên **Vercel** dưới dạng Serverless Functions (Miễn phí, không cần add thẻ).

---

## BƯỚC 1: Khởi Tạo Database trên Neon.tech

Neon.tech cung cấp database PostgreSQL chạy trên đám mây miễn phí và rất mạnh mẽ.

1. Truy cập [Neon.tech](https://neon.tech/) và đăng ký tài khoản (chọn đăng nhập bằng GitHub).
2. Tạo dự án mới, ví dụ: `aika-japanese`. Hệ thống sẽ tạo sẵn database `neondb`.
3. Lấy **Connection String**: Tại Dashboard, sao chép chuỗi kết nối (dạng: `postgres://alex:password@ep-cool-flower-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`).
4. **Nạp dữ liệu học mẫu**:
   * Chọn mục **SQL Editor** ở thanh menu trái trên Neon.
   * Mở file [database/schema.sql](file:///d:/dtan2/n2-japanese-learning/database/schema.sql) ở máy local.
   * **Copy từ dòng 6 trở đi** (bỏ qua 5 dòng đầu) và paste vào ô nhập lệnh trên Neon. Bấm **Run** để tạo bảng và nạp dữ liệu mẫu.
   * *(Tùy chọn)* Tiếp tục copy và chạy nội dung file [database/seed_grammar.sql](file:///d:/dtan2/n2-japanese-learning/database/seed_grammar.sql) để nạp thêm nhiều ngữ pháp phong phú.

---

## BƯỚC 2: Deploy Cả Dự Án Lên Vercel

Dự án đã được tích hợp file `vercel.json` để Vercel tự động build frontend và chuyển API backend thành các serverless function chạy miễn phí.

1. Cam kết (commit) và đẩy (push) toàn bộ code mới của bạn lên **GitHub** (Private hoặc Public).
2. Truy cập [Vercel.com](https://vercel.com/) và đăng nhập bằng GitHub.
3. Bấm **Add New** -> Chọn **Project**.
4. Chọn repository chứa dự án này của bạn -> Bấm **Import**.
5. Cấu hình các thông số:
   * **Framework Preset**: Chọn **Vite** hoặc để Vercel tự động nhận diện từ `vercel.json`.
   * **Root Directory**: **Để trống** (không chọn thư mục `frontend` vì Vercel cần đọc file `vercel.json` ở gốc dự án để chạy đồng thời cả backend).
6. Mở mục **Environment Variables** (Biến môi trường) và thêm các biến sau:
   * `DATABASE_URL` = `<Điền Connection String từ Neon.tech ở Bước 1>`
   * `JWT_SECRET` = `<Điền một chuỗi chữ viết liền ngẫu nhiên để bảo mật token>`
   * `NODE_ENV` = `production`
7. Bấm **Deploy**.
   * Vercel sẽ tự động cài đặt các thư viện, build frontend tĩnh vào thư mục `dist` và cấu hình API backend chạy dưới đường dẫn `/api`.
   * Sau khi hoàn thành (khoảng 1-2 phút), bạn sẽ nhận được một địa chỉ URL trang web (ví dụ: `https://your-project.vercel.app`).

---

## BƯỚC 3: Sử Dụng và Cập Nhật

* Bạn truy cập vào link Vercel nhận được để bắt đầu học và đăng ký tài khoản.
* Mọi thao tác ôn tập thẻ, lưu tiến trình sẽ được lưu trực tiếp vào cơ sở dữ liệu Neon của bạn.
* Mỗi khi bạn sửa code ở local, chỉ cần `git push` lên GitHub, Vercel sẽ tự động phát hiện và cập nhật phiên bản mới lên internet sau vài giây!
