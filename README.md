# AIKA — Hệ Thống Hỗ Trợ Học Tiếng Nhật N2 Tích Hợp Chatbot AI & Lặp Lại Ngắt Quãng (SRS)

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue?logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_API-Supported-orange?logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![Groq LPU](https://img.shields.io/badge/Groq_LPU-Llama--3.1--8b-orange)](https://groq.com/)

**AIKA** là một nền tảng ứng dụng Web thông minh hỗ trợ tự học tiếng Nhật trình độ N2 (đặc biệt định hướng CNTT như kỹ sư cầu nối BrSE, IT Comtor). Hệ thống kết hợp giữa quản lý bài học trực quan sinh động theo phong cách trò chơi hóa (Gamification), thuật toán ghi nhớ dài hạn tối ưu (SuperMemo-2) và trợ lý AI hội thoại siêu tốc (KaiwaHub) có khả năng sửa lỗi ngữ pháp thời gian thực.

---

## 🌟 Các Tính Năng Cốt Lõi

### 1. 🗺️ Lộ Trình Học Tập Trò Chơi Hóa (Gamification)
* Thiết kế bài học theo dạng sơ đồ lộ trình (Duolingo-style) với giao diện trực quan, vui nhộn.
* Hệ thống **trái tim (lives)** và thanh tiến trình kích thích động lực học tập liên tục.
* Bài tập đa dạng: trắc nghiệm từ vựng/ngữ pháp, ghép thẻ từ, điền vào chỗ trống với phản hồi đúng/sai tức thì kèm âm thanh sinh động.

### 2. 🧪 Phòng Thí Nghiệm Tri Thức (VocabLab & GrammarLab)
* **VocabLab**: Kho từ vựng N2 phong phú được phân loại theo chủ đề (Business, IT, Office, General). Hiển thị Kanji, Hiragana, âm Hán Việt, định nghĩa chi tiết và câu ví dụ thực tế.
* **GrammarLab**: Danh mục cấu trúc ngữ pháp N2 chi tiết với cấu trúc kết hợp, ý nghĩa, giải thích ngữ cảnh sử dụng và tuyển tập câu ví dụ mẫu.

### 3. 🃏 Hệ Thống Thẻ Ghi Nhớ Thông Minh (Smart Flashcards)
* Ôn tập từ vựng và ngữ pháp thông qua bộ thẻ ghi nhớ tương tác lật hai mặt động.
* Tích hợp **Thuật toán lặp lại ngắt quãng SuperMemo-2 (SM-2)**:
  * Học viên đánh giá mức độ ghi nhớ (Again, Hard, Good, Easy - tương ứng thang điểm 0-5).
  * Thuật toán tự động tính toán tần suất và khoảng thời gian (Interval), hệ số độ dễ (Ease Factor) tối ưu để nhắc nhở học tập trước khi kiến thức rơi vào "đường cong lãng quên".

### 4. 🗣️ Trợ Lý Hội Thoại AI Siêu Tốc (KaiwaHub)
* Đàm thoại phản xạ thời gian thực thông qua 3 chế độ:
  1. **Học tập giải thích (Study Mode)**: AI tích hợp tri thức chuẩn hỗ trợ giải thích sâu kiến thức.
  2. **Kaiwa đời thường (Everyday Chat)**: Giao tiếp tự nhiên theo ngữ cảnh cuộc sống hàng ngày.
  3. **Kaiwa N2 công sở (Business Keigo)**: Thực hành hội thoại kính ngữ chuyên nghiệp trong doanh nghiệp Nhật Bản.
* **Phát hiện và sửa lỗi thời gian thực (Grammar Correction)**: Tự động phân tích tin nhắn của người dùng, chỉ ra các lỗi sai trợ từ, cấu trúc ngữ pháp, kính ngữ và đề xuất câu sửa chuẩn kèm giải thích tiếng Việt.

### 5. 📊 Bảng Tiến Trình Cá Nhân (Progress Dashboard)
* Thống kê trực quan số từ vựng, ngữ pháp đã tích lũy và số lượt hội thoại AI đã thực hiện.
* Biểu đồ hoạt động và **lịch Streak** giúp theo dõi tần suất học tập hàng ngày để duy trì thói quen.

### 6. 🛠️ Bảng Quản Trị Hệ Thống (Admin Panel)
* Phân quyền quản trị viên (Admin) và học viên (Student) nghiêm ngặt.
* Cơ chế **Bulk Insert** hiệu năng cao: Cho phép Admin import hàng loạt hàng trăm từ vựng, ngữ pháp và câu hỏi trắc nghiệm từ file Excel/CSV chỉ dưới 150ms mà không gây timeout máy chủ.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

AIKA vận hành theo mô hình **Hybrid Cloud AI** phân tách rõ ràng giữa máy chủ dữ liệu chính và máy chủ AI suy luận:

```mermaid
graph TD
    User([Học viên / Admin]) <-->|HTTPS| Frontend[Frontend: React 19 + TypeScript + Tailwind CSS]
    Frontend <-->|RESTful APIs / JWT| Backend[Backend Core: Express.js / Node.js]
    Backend <-->|SQL Queries| DB[(Database: PostgreSQL - Neon Serverless)]
    
    subgraph AI_Inference_Layer [Phân hệ Trí tuệ Nhân tạo - AI Layer]
        Backend <-->|REST API / JSON| Flask[Flask AI Service - Python]
        Flask <-->|Local Embeddings| Trans[Transformers - Xenova / local GGUF]
        Flask -->|RAG Pipeline| Pandas[(Pandas CSV Reference matching)]
        Flask <-->|Groq Cloud API| Groq[Groq LPU: Llama-3.1-8b-instant]
        Backend <-->|Cloud API| Gemini[Google Gemini API]
    end
```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
aika/
├── backend/                  # Mã nguồn Máy chủ Core (Node.js/Express)
│   ├── routes/               # Bộ định tuyến API (users, vocabulary, grammar, flashcards, decks, kaiwa, progress, tests, admin)
│   ├── services/             # Logic nghiệp vụ chính (mail.js, ragService.js)
│   ├── auth.js               # Middleware xác thực JWT & bảo mật
│   ├── db.js                 # Cấu hình kết nối PostgreSQL (pg pool)
│   ├── migrations.js         # Script tạo bảng tự động khi khởi chạy
│   └── server.js             # Điểm chạy máy chủ Express chính
├── database/                 # Lược đồ database và các tệp dữ liệu mẫu
│   ├── schema.sql            # Định nghĩa toàn bộ các bảng & quan hệ cơ sở dữ liệu
│   ├── importN2Dataset.js    # Script import dữ liệu N2 ban đầu vào database
│   └── *.sql                 # Các tệp migration và seed dữ liệu mẫu
├── frontend/                 # Giao diện người dùng Máy khách (Vite + React)
│   ├── src/
│   │   ├── components/       # Các component dùng chung (Layout, AdminLayout, v.v.)
│   │   ├── context/          # Quản lý trạng thái AuthContext, ToastContext
│   │   ├── pages/            # Các trang giao diện chính (Dashboard, Flashcards, KaiwaHub, v.v.)
│   │   ├── App.tsx           # Quản lý định tuyến phía Client (React Router v7)
│   │   └── index.css         # Thiết lập hệ thống Design Tokens (Duolingo Style)
│   └── tsconfig.json         # Cấu hình dự án TypeScript
├── scripts/                  # Các script công cụ và build chỉ mục RAG
└── package.json              # Cấu hình dependency chung của toàn bộ dự án
```

---

## 📊 Lược Đồ Cơ Sở Dữ Liệu (Database Schema)

Hệ thống sử dụng cơ sở dữ liệu quan hệ **PostgreSQL** với các bảng cốt lõi sau:
1. `users`: Thông tin tài khoản người dùng, mật khẩu mã hóa (`bcryptjs`) và vai trò (`role: admin / student`).
2. `vocabulary`: Ngân hàng từ vựng N2 (từ Kanji, Hiragana, nghĩa tiếng Việt, câu ví dụ).
3. `grammar`: Ngân hàng cấu trúc ngữ pháp N2 (tên cấu trúc, cách kết hợp, ý nghĩa, câu ví dụ).
4. `flashcards`: Thẻ ghi nhớ cá nhân của học viên, lưu trữ các tham số SM-2 (`interval`, `repetitions`, `ease_factor`, `next_review_date`).
5. `conversation_history`: Nhật ký chat giữa học sinh và AI Chatbot, lưu trữ tin nhắn, câu trả lời của AI và danh sách mảng lỗi ngữ pháp đã sửa dưới dạng `JSONB`.
6. `user_progress`: Tổng hợp tiến trình học tập thời gian thực của học viên (tổng từ vựng, ngữ pháp đã thuộc, số lần ôn tập, số cuộc gọi Kaiwa).
7. `units` & `lessons`: Lộ trình bài học và cấp độ học tập trò chơi hóa.

---

## 🛠️ Hướng Dẫn Cài Đặt & Vận Hành (Installation Guide)

### 1. Yêu Cầu Hệ Thống Tối Thiểu
* **Node.js**: Phiên bản LTS >= 18.0.0.
* **PostgreSQL**: Phiên bản >= 14.0 (Chạy local hoặc dịch vụ đám mây Neon PostgreSQL).
* **Python**: Phiên bản >= 3.9 (Nếu muốn vận hành song song Flask AI Service).

### 2. Các Bước Cài Đặt Ban Đầu

**Bước 1: Tải mã nguồn về máy**
```bash
git clone https://github.com/HongTrang834/AIKA.git
cd AIKA
```

**Bước 2: Cài đặt các thư viện phụ thuộc (Dependencies)**
Cài đặt toàn bộ thư viện dùng chung cho cả Frontend và Backend bằng npm tại thư mục gốc:
```bash
npm install
```

**Bước 3: Khởi tạo Cơ sở dữ liệu**
1. Tạo một cơ sở dữ liệu PostgreSQL cục bộ tên là `aika_db`.
2. Đăng nhập và thực thi tệp tin `database/schema.sql` để thiết lập cấu trúc bảng:
   ```bash
   psql -U postgres -d aika_db -f database/schema.sql
   ```
3. Chạy lệnh cài đặt các bộ thẻ mặc định ban đầu:
   ```bash
   node backend/setup-decks.js
   ```
4. Thực thi script import tập dữ liệu N2 mẫu (Từ vựng, Ngữ pháp, Bài học):
   ```bash
   node database/importN2Dataset.js
   ```

**Bước 4: Cấu hình biến môi trường**
Tạo tệp `.env` tại thư mục gốc dựa trên tệp mẫu `.env.example`:
```bash
cp .env.example .env
```
Mở tệp `.env` vừa tạo và cập nhật các thông tin kết nối của bạn:
```ini
# Cấu hình kết nối PostgreSQL
DATABASE_URL=postgresql://postgres:mat_khau_cua_ban@localhost:5432/aika_db

# Khóa bảo mật JWT để mã hóa token đăng nhập
JWT_SECRET=chuoi_ky_tu_bao_mat_ngau_nhien_cua_ban

# Khóa API Google Gemini (Dành cho chế độ chạy AI mặc định)
GEMINI_API_KEY=khoa_api_gemini_cua_ban

# Cấu hình Máy chủ
PORT=3000
NODE_ENV=development
```

---

### 3. Vận Hành Dự Án Ở Chế Độ Phát Triển (Development)

Để khởi chạy đồng thời cả máy chủ Backend Express và giao diện Frontend Client:

1. **Khởi động Máy chủ Backend (kèm theo Vite Middleware tích hợp)**:
   ```bash
   npm run dev
   ```
   *Máy chủ sẽ chạy tại địa chỉ:* [http://localhost:3000](http://localhost:3000)

2. *(Tùy chọn)* Nếu muốn khởi chạy riêng biệt giao diện Frontend độc lập trên cổng phát triển của Vite:
   ```bash
   npm run dev:frontend
   ```
   *Giao diện người dùng độc lập sẽ chạy tại:* [http://localhost:5173](http://localhost:5173)

---

### 4. Cấu Hình & Chạy Dịch Vụ AI (Flask AI Service)

Dịch vụ AI Chatbot hoạt động theo mô hình Hybrid Cloud AI với máy chủ phụ trợ Python Flask giúp tối ưu hóa đàm thoại và phân tích lỗi ngữ pháp:

1. Chạy mã nguồn Python Flask trên máy chủ hỗ trợ GPU/CPU (thường được thiết lập trên **Google Colab** để tận dụng tài nguyên miễn phí).
2. Tải mô hình `Llama-3.1-8b-instant` thông qua nhà cung cấp dịch vụ **Groq Cloud**.
3. Kích hoạt ngrok tunnel để công khai API Flask an toàn, tạo ra một đường dẫn công khai có định dạng: `https://xxxx.ngrok-free.dev`.
4. Cập nhật đường link ngrok này vào biến môi trường hệ thống hoặc trong cấu hình tệp kết nối `backend/services/ragService.js` để làm cổng trung chuyển đàm thoại giữa Backend Node.js và AI Python Flask.

---

## 📦 Biên Dịch & Triển Khai Thực Tế (Production)

Để build ứng dụng thành gói phân phối tối ưu chạy trên môi trường production:

1. **Dọn dẹp và Biên dịch giao diện Frontend**:
   ```bash
   npm run clean
   ```
   *Lệnh này sẽ xóa thư mục `dist` cũ.*

2. **Tiến hành Build mã nguồn**:
   ```bash
   npm run build
   ```
   *Vite sẽ biên dịch toàn bộ mã nguồn Frontend (React + TypeScript) thành các tệp tĩnh (HTML/CSS/JS) tối ưu nằm trong thư mục `dist`.*

3. **Khởi chạy máy chủ production**:
   ```bash
   npm start
   ```
   *Express server chạy ở chế độ Production sẽ tự động phục vụ trực tiếp các file tĩnh trong thư mục `dist` trên cổng cấu hình.*

---

## 🤝 Thành Viên Đóng Góp (Contributors)

* **Trần Hồng Trang** (Mã nguồn chính & Đề tài Đồ án tốt nghiệp)
* Cùng sự hỗ trợ đóng góp từ các thành viên trong nhóm nghiên cứu học thuật.

---

## 📄 Giấy Phép (License)

Dự án này thuộc bản quyền của nhóm phát triển và được phát hành dưới Giấy phép **MIT**. Mọi hành vi sao chép hay sử dụng cho mục đích thương mại cần có sự đồng ý của tác giả đề tài.