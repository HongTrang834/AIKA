PHỤ LỤC A: THÔNG TIN MÃ NGUỒN VÀ HƯỚNG DẪN CÀI ĐẶT

A.1. Đường dẫn lưu trữ (Link + QR Code)

1. Đường dẫn lưu trữ mã nguồn (Repository Link)
Toàn bộ mã nguồn phát triển của đề tài "Hệ thống hỗ trợ học tiếng Nhật N2 tích hợp chatbot AI và thuật toán lặp lại ngắt quãng" được lưu trữ trực tuyến tại kho chứa GitHub:
- Địa chỉ repository: https://github.com/HongTrang834/AIKA.git
- Tác giả: HongTrang834 (AIKA)
- Nhánh phát triển chính (Default Branch): main
- Môi trường Deploy chạy thử nghiệm (Deployment Branch): render-deploy

Kho lưu trữ bao gồm:
1. Mã nguồn giao diện ứng dụng phía Client (ReactJS SPA, TypeScript, Tailwind CSS).
2. Mã nguồn dịch vụ xử lý nghiệp vụ phía Server API (Node.js, Express framework).
3. Cơ sở dữ liệu và các kịch bản SQL (PostgreSQL schema và data seeds).
4. Mã nguồn xử lý nghiệp vụ AI Service (Python Flask, RAG logic và Integration).
5. Các bộ tài liệu và dữ liệu tri thức tĩnh (JLPT N2 Vocabulary và Grammar datasets).

2. Mã phản hồi nhanh (QR Code)
Để thuận tiện cho hội đồng đánh giá và người đọc truy cập nhanh vào mã nguồn trên các thiết bị di động, dưới đây là hướng dẫn mã QR Code liên kết trực tiếp tới repository GitHub:

(Hình ảnh QR Code trỏ đến link: https://github.com/HongTrang834/AIKA.git)

Lưu ý: Người đọc có thể quét mã QR Code trên bằng camera điện thoại hoặc các ứng dụng quét mã QR thông dụng để được chuyển hướng ngay lập tức đến kho lưu trữ mã nguồn của hệ thống.

---

A.2. Cấu trúc thư mục hệ thống và Hướng dẫn cài đặt

1. Cấu trúc thư mục hệ thống (Project Folder Structure)
Hệ thống được thiết kế theo kiến trúc Monorepo để dễ dàng đồng bộ và phát triển đồng thời cả Client (Frontend) và Server (Backend). Cấu trúc các thư mục và tệp tin cốt lõi được mô tả chi tiết dưới đây:

n2-japanese-learning/                  # Thư mục gốc của dự án (Root)
│
├── frontend/                          # Phân hệ Giao diện Người dùng (ReactJS / TypeScript / Vite)
│   ├── public/                        # Chứa các tài nguyên tĩnh như hình ảnh, biểu tượng (icons)
│   ├── src/                           # Mã nguồn chính của client
│   │   ├── main.tsx                   # Điểm khởi chạy chính của React, cấu hình DOM ảo
│   │   ├── App.tsx                    # Định nghĩa các tuyến đường (routes) và bọc các Providers
│   │   ├── index.css                  # Tệp style chính chứa Tailwind CSS và custom styles
│   │   ├── components/                # Các component dùng chung (Button, Cards, Navbar, Toast...)
│   │   ├── context/                   # Quản lý trạng thái toàn cục (AuthContext, ToastContext)
│   │   ├── lib/                       # Các thư viện bổ trợ tiện ích cấu hình Client
│   │   └── pages/                     # Màn hình chức năng của hệ thống
│   │       ├── Dashboard.tsx          # Trang bảng điều khiển học tập cá nhân của học viên
│   │       ├── VocabLab.tsx           # Phòng thực hành và ôn tập từ vựng N2
│   │       ├── VocabularyDetail.tsx   # Trang tra cứu chi tiết và học phát âm, ví dụ từ vựng
│   │       ├── GrammarLab.tsx         # Phòng thực hành ngữ pháp N2
│   │       ├── GrammarDetail.tsx      # Trang tra cứu và giải thích ngữ pháp kèm ví dụ
│   │       ├── Flashcards.tsx         # Phân hệ ôn tập bằng thẻ ghi nhớ (Thuật toán SM-2)
│   │       ├── Lesson.tsx             # Trang học các bài học từ vựng và ngữ pháp theo lộ trình
│   │       ├── KaiwaHub.tsx           # Giao diện tương tác chatbot AI (các chế độ Kaiwa và Study)
│   │       ├── Progress.tsx           # Trang thống kê biểu đồ tiến độ và chỉ số tích lũy
│   │       ├── Profile.tsx            # Trang quản lý thông tin cá nhân của học viên
│   │       ├── Login.tsx              # Trang đăng nhập và đăng ký tài khoản
│   │       ├── AdminVocabulary.tsx    # Giao diện quản trị, import hàng loạt từ vựng của Admin
│   │       ├── AdminGrammar.tsx       # Giao diện quản trị, import hàng loạt ngữ pháp của Admin
│   │       ├── AdminTests.tsx         # Giao diện tạo lập và quản lý đề kiểm tra trắc nghiệm
│   │       └── AdminDecks.tsx         # Giao diện quản lý các bộ thẻ Flashcard hệ thống
│   ├── tsconfig.json                  # Cấu hình biên dịch TypeScript cho Frontend
│   └── vite.config.ts                 # Cấu hình đóng gói và chạy nóng với Vite
│
├── backend/                           # Phân hệ Máy chủ API và Xử lý nghiệp vụ (Node.js / Express)
│   ├── server.js                      # Điểm khởi chạy của Backend Server
│   ├── db.js                          # Khởi tạo Connection Pool kết nối đến PostgreSQL
│   ├── auth.js                        # Middleware xác thực danh tính người dùng qua JWT
│   ├── migrate.js                     # Script hỗ trợ đồng bộ cơ sở dữ liệu
│   ├── migrations.js                  # Định nghĩa chi tiết các bước cập nhật DB schema
│   ├── setup-decks.js                 # Script khởi tạo các bộ thẻ Flashcard mặc định hệ thống
│   ├── services/                      # Các dịch vụ backend dùng chung
│   │   ├── ragService.js              # Xử lý tìm kiếm ngữ cảnh bổ trợ và xây dựng prompt RAG
│   │   └── mail.js                    # Dịch vụ gửi email xác minh và liên hệ
│   └── routes/                        # Định nghĩa các REST API Endpoints
│       ├── users.js                   # Đăng ký, đăng nhập, thông tin profile người dùng
│       ├── vocabulary.js              # Truy vấn danh sách từ vựng N2
│       ├── grammar.js                 # Truy vấn danh sách ngữ pháp N2
│       ├── admin.js                   # Xử lý import dữ liệu lớn (Bulk Insert) và quản trị
│       ├── decks.js                   # CRUD các bộ thẻ ghi nhớ (Flashcard Decks)
│       ├── flashcards.js              # Ôn tập flashcard, cập nhật trạng thái theo thuật toán SM-2
│       ├── tests.js                   # Danh sách đề thi, nộp bài trắc nghiệm và chấm điểm tự động
│       ├── progress.js                # Truy vấn tiến trình học tập, thống kê biểu đồ học viên
│       └── conversation.js            # Lưu trữ và truy xuất lịch sử đàm thoại của chatbot AI
│
├── database/                          # Chứa kịch bản SQL và cấu trúc lược đồ cơ sở dữ liệu
│   ├── schema.sql                     # Khởi tạo cấu trúc 10+ bảng dữ liệu quan hệ PostgreSQL
│   ├── seed_grammar.sql               # Nạp dữ liệu ngữ pháp mẫu ban đầu
│   ├── importN2Dataset.js             # Script tự động import tập dữ liệu N2 từ file CSV
│   └── migration_*.sql                # Các tệp cập nhật và bảo trì cơ sở dữ liệu định kỳ
│
├── grammar_db/                        # Dữ liệu nguồn và tri thức phục vụ cho AI RAG
│   ├── JLPT_N2_Grammar_v2.csv         # Tập dữ liệu chuẩn gồm 174 cấu trúc ngữ pháp N2
│   ├── Mimikara_Grammar.csv           # Tập dữ liệu đối sánh ngữ pháp Mimikara Oboeru N2
│   └── embeddings.json                # Vector nhúng ngữ nghĩa của tài liệu hỗ trợ tìm kiếm ngữ nghĩa
│
├── scripts/                           # Các tập lệnh bổ trợ hệ thống
│   ├── buildRagIndex.js               # Tập lệnh xây dựng và chuẩn bị chỉ mục RAG cho dịch vụ AI
│   └── generate-map.ts                # Công cụ sinh bản đồ cấu trúc mã nguồn tự động
│
├── DESIGN.md                          # Hướng dẫn thiết kế giao diện (Design System Tokens)
├── package.json                       # Khai báo dependencies và scripts vận hành toàn hệ thống
├── .env.example                       # Biến môi trường mẫu cấu hình hệ thống
└── README.md                          # Tài liệu giới thiệu dự án (Tệp trống ở Root)


2. Hướng dẫn cài đặt và vận hành hệ thống (Installation & Operation Guide)

2.1. Yêu cầu hệ thống tối thiểu (Prerequisites)
- Hệ điều hành: Windows 10/11, macOS, hoặc Linux.
- Node.js: Phiên bản LTS mới nhất (Khuyến nghị >= 18.0.0).
- PostgreSQL: Phiên bản >= 14.0 (chạy cục bộ hoặc sử dụng dịch vụ đám mây Neon PostgreSQL).
- Python: Phiên bản >= 3.9 (phục vụ chạy Flask AI Service).
- Khóa API: Khóa API từ dịch vụ Google Gemini hoặc tài khoản Groq (để gọi mô hình Llama-3.1-8b-instant).

2.2. Các bước cài đặt cơ bản (Installation Steps)

Bước 1: Tải mã nguồn về máy
Sử dụng git để sao chép mã nguồn từ repository:
git clone https://github.com/HongTrang834/AIKA.git
cd AIKA

Bước 2: Cài đặt các thư viện phụ thuộc (Dependencies)
Cài đặt toàn bộ thư viện dùng chung cho cả Frontend và Backend bằng trình quản lý gói npm tại thư mục gốc:
npm install

Bước 3: Khởi tạo và thiết lập Cơ sở dữ liệu (Database Setup)
1. Tạo một cơ sở dữ liệu PostgreSQL cục bộ tên là aika_db.
2. Đăng nhập vào PostgreSQL và thực thi tệp tin database/schema.sql để khởi tạo cấu trúc bảng:
   psql -U postgres -d aika_db -f database/schema.sql
3. Chạy lệnh cài đặt dữ liệu bộ thẻ flashcard mặc định:
   node backend/setup-decks.js
4. Thực hiện chạy script import tập dữ liệu mẫu:
   node database/importN2Dataset.js

Bước 4: Cấu hình biến môi trường (Environment Variables)
Tạo tệp tin .env tại thư mục gốc dựa trên tệp mẫu .env.example:
cp .env.example .env
Mở tệp .env vừa tạo và cập nhật các thông số phù hợp:
DATABASE_URL=postgresql://postgres:mat_khau_cua_ban@localhost:5432/aika_db
JWT_SECRET=chuoi_ky_tu_bao_mat_cua_ban
GEMINI_API_KEY=khoa_api_gemini_cua_ban
PORT=3000
NODE_ENV=development

Bước 5: Chạy dự án ở chế độ Phát triển (Development Mode)
Để vận hành song song cả máy chủ Backend và Frontend trên môi trường phát triển:
1. Chạy Backend Server API (sử dụng tsx watch để tự động tải lại khi code thay đổi):
   npm run dev
   (Máy chủ chạy tại: http://localhost:3000)

2. Trong một cửa sổ Terminal mới, khởi chạy ứng dụng Frontend Client:
   npm run dev:frontend
   (Giao diện người dùng chạy tại: http://localhost:5173)

2.3. Cấu hình và chạy Dịch vụ AI (Flask AI Service)
Dịch vụ Chatbot AI hoạt động theo mô hình Hybrid Cloud AI có cấu trúc riêng độc lập để tối ưu hiệu năng:
1. Chạy mã nguồn Python Flask trên máy chủ có hỗ trợ GPU/CPU (thường được thiết lập trên Google Colab để tận dụng tài nguyên miễn phí).
2. Tải mô hình Llama-3.1-8b-instant thông qua nhà cung cấp dịch vụ Groq Cloud.
3. Kích hoạt ngrok tunnel để công khai API Flask an toàn, sinh ra đường link có định dạng https://xxxx.ngrok-free.dev.
4. Cấu hình đường link ngrok này vào biến môi trường hoặc trong tệp tin kết nối backend/services/ragService.js để làm cổng trung chuyển đàm thoại giữa Backend Node.js và AI Python Flask.

---

PHỤ LỤC B: ĐẶC TẢ TẬP DỮ LIỆU (DATASET)

B.1. Tổng quan và nguồn gốc dữ liệu

1. Nguồn gốc dữ liệu (Data Source)
Tập dữ liệu sử dụng trong hệ thống bao gồm hai nguồn tài nguyên học thuật chính trình độ N2 của Kỳ thi Đánh giá Năng lực Nhật ngữ (JLPT N2):
1. Ngân hàng từ vựng N2: Được chọn lọc từ các giáo trình luyện thi nổi tiếng như Shin Nihongo 500 Mon N2 và Mimikara Oboeru N2 Vocabulary. Tập dữ liệu từ vựng đã được biên dịch nghĩa tiếng Việt cẩn thận, chuẩn hóa dạng chữ Kanji kèm Hiragana, đồng thời bổ sung các từ vựng chuyên ngành công nghệ thông tin (IT Comtor/BrSE) để nâng cao tính ứng dụng thực tiễn của đề tài.
2. Ngân hàng cấu trúc ngữ pháp N2: Được trích xuất chủ yếu từ giáo trình chuẩn Mimikara Oboeru N2 Grammar và tệp tri thức chuẩn JLPT_N2_Grammar_v2.csv lưu trữ trực tiếp trong hệ thống AI. Dữ liệu này bao gồm 174 mẫu ngữ pháp N2 cốt lõi, bao phủ toàn bộ khung kiến trúc ngữ pháp N2 được Bộ Giáo dục Nhật Bản quy định.

2. Phương pháp tiền xử lý và lưu trữ dữ liệu
- Chuẩn hóa dữ liệu: Loại bỏ các ký tự thừa, đồng bộ cách trình bày các ký tự Kanji, Furigana và dấu câu đặc trưng trong tiếng Nhật.
- Nạp dữ liệu hiệu năng cao: Admin sử dụng chức năng Import để đẩy dữ liệu từ các file Excel/CSV vào database. Hệ thống áp dụng thuật toán tối ưu Bulk Insert, xử lý xác thực dữ liệu ngay trên RAM và thực hiện chèn dữ liệu hàng loạt bằng một câu truy vấn duy nhất. Phương pháp này giảm thời gian nạp dữ liệu từ 12.5 giây xuống chỉ còn 80ms - 150ms, giải quyết triệt để tình trạng timeout 10 giây trên các hạ tầng serverless.
- Hỗ trợ công nghệ RAG: Tệp dữ liệu CSV được máy chủ AI Python Flask tải trực tiếp lên bộ nhớ RAM khi khởi chạy nhằm tạo thành Kho tri thức nền tảng (Knowledge Base). Hệ thống AI sẽ áp dụng thuật toán so khớp chuỗi (String Matching) để truy xuất tức thời ngữ cảnh ngữ pháp liên quan trước khi gửi câu thoại tới LLM.

---

B.2. Cấu trúc và định dạng các trường dữ liệu

1. Đặc tả tệp dữ liệu tri thức ngữ pháp (JLPT_N2_Grammar_v2.csv)
Tệp CSV này lưu trữ tri thức tĩnh phục vụ quá trình truy xuất ngữ cảnh bổ trợ (RAG) của Trợ lý AI. Cấu trúc chi tiết gồm 7 trường dữ liệu chính:
- Trường "pattern" (Kiểu TEXT, NOT NULL): Cấu trúc mẫu ngữ pháp tiếng Nhật (ví dụ: ～として).
- Trường "meaning" (Kiểu TEXT, NOT NULL): Nghĩa tương đương trong tiếng Việt và ghi chú sắc thái nghĩa.
- Trường "title" (Kiểu TEXT, NOT NULL): Tên định danh của bài ngữ pháp (mặc định là N2 Grammar).
- Trường "explanation" (Kiểu TEXT, NOT NULL): Công thức liên kết ngữ pháp chi tiết (danh từ, động từ...).
- Trường "category" (Kiểu TEXT, NULL): Nhãn phân loại chuyên mục ngữ pháp phục vụ lọc dữ liệu (jlpt_grammar).
- Trường "example_sentence" (Kiểu TEXT, NULL): Câu ví dụ minh họa mẫu bằng tiếng Nhật (kết hợp Kanji và Hiragana).
- Trường "example_translation" (Kiểu TEXT, NULL): Bản dịch nghĩa tiếng Việt tương ứng của câu ví dụ.

2. Đặc tả Bảng dữ liệu Ngân hàng Từ vựng (vocabulary) trong Database
Bảng này lưu trữ toàn bộ ngân hàng từ vựng N2 phục vụ việc học tập, thi trắc nghiệm và ôn tập Flashcard của học viên:
- Trường "id" (Kiểu SERIAL, PRIMARY KEY): Khóa chính, tự động tăng.
- Trường "word" (Kiểu TEXT, NOT NULL): Chữ Kanji hoặc cách viết thông dụng nhất của từ vựng.
- Trường "reading" (Kiểu TEXT, NOT NULL): Cách phiên âm đọc bằng Hiragana hoặc Katakana.
- Trường "meaning" (Kiểu TEXT, NOT NULL): Nghĩa giải thích bằng tiếng Việt.
- Trường "category" (Kiểu TEXT, NULL): Phân nhóm chủ đề từ vựng (ví dụ: Business, IT, General...).
- Trường "level" (Kiểu INTEGER, DEFAULT 2): Cấp độ JLPT tương ứng (2 tương đương với N2).
- Trường "example_sentence" (Kiểu TEXT, NULL): Câu ví dụ mẫu tiếng Nhật áp dụng từ vựng này.
- Trường "example_translation" (Kiểu TEXT, NULL): Bản dịch tiếng Việt tương ứng của câu ví dụ.
- Trường "examples" (Kiểu TEXT, NULL): Dữ liệu mở rộng chứa danh sách các câu ví dụ phụ dưới định dạng JSON.

3. Đặc tả Bảng dữ liệu Thẻ ghi nhớ cá nhân (flashcards)
Bảng này lưu trữ trạng thái ôn tập của từng từ vựng hoặc ngữ pháp đối với mỗi học viên cụ thể, phục vụ vận hành thuật toán lặp lại ngắt quãng SM-2:
- Trường "id" (Kiểu SERIAL, PRIMARY KEY): Khóa chính, tự động tăng.
- Trường "user_id" (Kiểu INTEGER, FOREIGN KEY): Liên kết tới bảng users(id), xác định chủ sở hữu thẻ.
- Trường "vocab_id" (Kiểu INTEGER, FOREIGN KEY): Liên kết tới bảng vocabulary(id) (cho phép NULL nếu là thẻ ngữ pháp).
- Trường "grammar_id" (Kiểu INTEGER, FOREIGN KEY): Liên kết tới bảng grammar(id) (cho phép NULL nếu là thẻ từ vựng).
- Trường "deck_id" (Kiểu INTEGER, FOREIGN KEY): Liên kết tới bảng flashcard_decks(id), xác định bộ thẻ của flashcard.
- Trường "interval" (Kiểu INTEGER, DEFAULT 1): Số ngày chờ đến lượt ôn tập tiếp theo (tính bằng ngày).
- Trường "repetitions" (Kiểu INTEGER, DEFAULT 0): Số lần học viên chọn đáp án đúng liên tiếp đối với thẻ này.
- Trường "ease_factor" (Kiểu DECIMAL(3,2), DEFAULT 2.50): Hệ số độ dễ của thẻ, dùng để nhân rộng interval sau mỗi lần lặp.
- Trường "next_review_date" (Kiểu TIMESTAMP, DEFAULT NOW()): Thời điểm kế tiếp học viên cần ôn tập thẻ này.

---

B.3. Mẫu dữ liệu minh họa (Sample Data)

Dưới đây là một số dòng dữ liệu thực tế trích xuất trực tiếp từ tệp tri thức ngữ pháp JLPT_N2_Grammar_v2.csv của hệ thống:

Ví dụ 1:
- Cấu trúc (pattern): ～として（は）／～としても／～としての
- Ý nghĩa (meaning): Nói về lập trường, tư cách, chủng loại.
- Giải thích cách liên kết (explanation): [名] ＋ として
- Câu ví dụ (example_sentence): 彼は国費留学生として日本へ来た。
- Bản dịch ví dụ (example_translation): Anh ấy đã đến Nhật với tư cách là lưu học sinh ngân sách nhà nước.

Ví dụ 2:
- Cấu trúc (pattern): ～てならない
- Ý nghĩa (meaning): Một cách phi thường (Cảm xúc mạnh lên một cách tự nhiên).
- Giải thích cách liên kết (explanation): [動－て形] / [い形－くて] / [な形－て] ＋ ならない
- Câu ví dụ (example_sentence): 交通事故で両親を亡くした子供がかわいそうに思えてならない。
- Bản dịch ví dụ (example_translation): Không thể kìm lòng (thương tiếc vô cùng) trước những đứa trẻ mất bố mẹ do tai nạn giao thông.

Ví dụ 3:
- Cấu trúc (pattern): ～にきまっている
- Ý nghĩa (meaning): Nhất định là ~, đương nhiên là ~.
- Giải thích cách liên kết (explanation): [動・い形・な形・名] の普通形 ＋ にきまっている (な形 và 名 không dùng だ)
- Câu ví dụ (example_sentence): ぜんぜん練習していないんだから、今度の試合は負けるにきまっている。
- Bản dịch ví dụ (example_translation): Vì chẳng tập luyện chút nào cả, trận đấu lần này nhất định là sẽ thua rồi.

Ví dụ 4:
- Cấu trúc (pattern): ～にすぎない
- Ý nghĩa (meaning): Chỉ là ~, không hơn không kém.
- Giải thích cách liên kết (explanation): [動－普通形] / [な形－である] / [名] ＋ にすぎない
- Câu ví dụ (example_sentence): 私は警官としてしなければ manual ないことをしたにすぎません.
- Bản dịch ví dụ (example_translation): Tôi chỉ làm những việc mình cần phải làm với tư cách là một cảnh sát.

Ví dụ 5:
- Cấu trúc (pattern): （より）ほか（は）ない／ほかしかたがない
- Ý nghĩa (meaning): Không có cách nào khác ngoài ~
- Giải thích cách liên kết (explanation): [動－辞書形] ＋ ほかない
- Câu ví dụ (example_sentence): だれにも頼めないから、自分でやるほかはない。
- Bản dịch ví dụ (example_translation): Vì không nhờ cậy được ai nên chẳng còn cách nào khác ngoài tự mình làm cả.
