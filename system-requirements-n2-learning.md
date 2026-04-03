# Tài liệu Mô tả Hệ thống
# Hệ thống Hỗ trợ Học Tiếng Nhật N2 Tích Hợp Chatbot AI
### Kiến trúc Microservices

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Phân rã Microservices](#3-phân-rã-microservices)
4. [Đặc tả chức năng từng module](#4-đặc-tả-chức-năng-từng-module)
5. [Mô hình AI Pipeline](#5-mô-hình-ai-pipeline)
6. [Thiết kế cơ sở dữ liệu](#6-thiết-kế-cơ-sở-dữ-liệu)
7. [Luồng xử lý nghiệp vụ chính](#7-luồng-xử-lý-nghiệp-vụ-chính)
8. [Đặc tả API giữa các Service](#8-đặc-tả-api-giữa-các-service)
9. [Yêu cầu phi chức năng](#9-yêu-cầu-phi-chức-năng)
10. [Công nghệ sử dụng](#10-công-nghệ-sử-dụng)
11. [Phạm vi & Hướng mở rộng](#11-phạm-vi--hướng-mở-rộng)

---

## 1. Tổng quan hệ thống

### 1.1 Giới thiệu

Hệ thống là một **web application** hỗ trợ người học tiếng Nhật trình độ **N2** (JLPT), tích hợp đa hình thức học trong một nền tảng duy nhất. Điểm khác biệt cốt lõi là tích hợp **AI Chatbot** cho phép luyện giao tiếp tiếng Nhật — khắc phục điểm yếu lớn nhất của người học ngoại ngữ truyền thống.

### 1.2 Mục tiêu

| Mục tiêu | Mô tả |
|---|---|
| Học từ vựng N2 | Cung cấp hệ thống từ vựng N2 có cấu trúc, ví dụ minh họa |
| Học ngữ pháp N2 | Giải thích ngữ pháp kèm ví dụ thực tế |
| Luyện hội thoại AI | Chatbot AI luyện giao tiếp tiếng Nhật tự nhiên, có sửa lỗi |
| Ôn tập Flashcard | Hệ thống flashcard thông minh theo thuật toán Spaced Repetition |
| Thống kê tiến độ | Theo dõi hành trình học tập của người dùng |

### 1.3 Đối tượng người dùng

- Người học tiếng Nhật đang chuẩn bị thi JLPT N2
- Người muốn cải thiện kỹ năng giao tiếp tiếng Nhật thực tế
- Người đã có nền tảng N3, muốn nâng lên N2

---

## 2. Kiến trúc tổng thể

### 2.1 Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│              React SPA (Web Browser / Mobile)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                      API GATEWAY                            │
│         (Routing / Auth Middleware / Rate Limiting)         │
└──────┬─────────────────────────────────────────────┬────────┘
       │                                             │
┌──────▼──────────┐   ┌──────────────────┐   ┌──────▼────────┐
│  User Service   │   │   Core Service   │   │  AI Service   │
│  (Node.js)      │   │   (Node.js)      │   │  (Python      │
│                 │   │                  │   │   FastAPI)    │
│ - Auth          │   │ - Vocabulary     │   │               │
│ - Profile       │   │ - Grammar        │   │ - LangChain   │
│ - Statistics    │   │ - Flashcard      │   │ - RAG Engine  │
│                 │   │ - Quiz           │   │ - Gemini LLM  │
└──────┬──────────┘   └────────┬─────────┘   └──────┬────────┘
       │                       │                     │
┌──────▼───────────────────────▼─────────────────────▼───────┐
│                      DATA LAYER                             │
│   PostgreSQL (Users)  │  MongoDB (Content)  │  Qdrant /    │
│                       │                     │  ChromaDB    │
│                       │  Redis (Cache /     │  (Vector DB) │
│                       │   Session)          │              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Nguyên tắc thiết kế

- **Loose Coupling**: Mỗi service hoạt động độc lập, giao tiếp qua REST API hoặc Message Queue
- **Single Responsibility**: Mỗi service chịu trách nhiệm duy nhất cho một domain nghiệp vụ
- **API Gateway Pattern**: Mọi request từ client đều đi qua một cổng duy nhất
- **Stateless Services**: Trạng thái người dùng lưu trên Redis/DB, không giữ trong service

---

## 3. Phân rã Microservices

### 3.1 Danh sách Services

| Service | Ngôn ngữ / Framework | Trách nhiệm |
|---|---|---|
| **API Gateway** | Node.js / Express hoặc Nginx | Định tuyến, xác thực JWT, rate limiting |
| **User Service** | Node.js / Express | Quản lý tài khoản, xác thực, thống kê tiến độ |
| **Core Service** | Node.js / Express | Từ vựng, ngữ pháp, flashcard, quiz |
| **AI Service** | Python / FastAPI | Chatbot, RAG, sửa lỗi ngữ pháp, quản lý hội thoại |

### 3.2 Giao tiếp giữa các Services

```
React Frontend
     │
     ▼
API Gateway ──────────────────────────────────────┐
     │                                            │
     ├──► User Service   (JWT Auth / Profile)     │
     │                                            │
     ├──► Core Service   (Vocab / Grammar /       │
     │                    Flashcard / Quiz)       │
     │                                            │
     └──► AI Service     (Chat / Error Check)     │
               │                                  │
               └── Gọi Core Service để lấy ───────┘
                   dữ liệu N2 cho RAG
```

---

## 4. Đặc tả chức năng từng module

### 4.1 User Service

#### 4.1.1 Đăng ký / Đăng nhập

| Chức năng | Mô tả |
|---|---|
| Đăng ký | Nhập email, password, username. Hệ thống kiểm tra trùng lặp, hash password (bcrypt), gửi email xác nhận (nếu có) |
| Đăng nhập | Xác thực email + password. Trả về `access_token` (JWT, TTL: 1h) và `refresh_token` (TTL: 7 ngày) |
| Refresh Token | Client dùng `refresh_token` để lấy `access_token` mới khi hết hạn |
|  | Vô hiệu hóa `refresh_token` trong Redis (blacklist) |
| Quên mật khẩu | Gửi link reset qua email, link có TTL 15 phút |

#### 4.1.2 Quản lý thông tin cá nhân

| Trường | Kiểu | Mô tả |
|---|---|---|
| `username` | String | Tên hiển thị |
| `email` | String | Email đăng nhập |
| `avatar` | String (URL) | Ảnh đại diện |
| `learning_goal` | String | Mục tiêu học (ví dụ: "Thi N2 tháng 12") |
| `created_at` | DateTime | Ngày tham gia |

#### 4.1.3 Thống kê tiến độ học tập

Hệ thống theo dõi và hiển thị:

- **Từ vựng**: Số từ đã học / tổng từ N2 (ví dụ: 342 / 1500 từ)
- **Ngữ pháp**: Số mẫu ngữ pháp đã học / tổng số (ví dụ: 45 / 172 mẫu)
- **Thời gian luyện hội thoại**: Tổng số phút/giờ đã luyện Kaiwa với AI
- **Flashcard**: Số thẻ đã ôn, streak (chuỗi ngày học liên tiếp)
- **Lỗi thường gặp**: Thống kê loại lỗi ngữ pháp AI đã phát hiện (trợ từ, kính ngữ, thì...)

---

### 4.2 Core Service

Core Service gộp chung 3 domain: **Từ vựng**, **Ngữ pháp**, và **Flashcard**.

#### 4.2.1 Module Từ vựng N2

**Cấu trúc dữ liệu một từ vựng:**

```json
{
  "id": "vocab_001",
  "word": "確認",
  "reading": "かくにん",
  "meaning": "Xác nhận, kiểm tra",
  "part_of_speech": "Danh từ / Động từ (する)",
  "jlpt_level": "N2",
  "cluster_id": "cluster_05",
  "examples": [
    {
      "sentence_jp": "内容を確認してください。",
      "sentence_vn": "Vui lòng xác nhận nội dung."
    }
  ],
  "tags": ["business", "formal"]
}
```

**Chức năng:**

| Chức năng | Mô tả |
|---|---|
| Xem danh sách theo cụm | Từ vựng được nhóm thành các cluster (~30–50 từ/cụm) theo chủ đề |
| Xem chi tiết từ | Hiển thị nghĩa, phiên âm, ví dụ câu, loại từ |
| Đánh dấu từ vào Flashcard | Người dùng nhấn icon ➕ để lưu từ vào bộ flashcard cá nhân |
| Trắc nghiệm theo cụm | Sau mỗi cụm, hệ thống sinh quiz 10–15 câu từ vựng của cụm đó |

#### 4.2.2 Module Ngữ pháp N2

**Cấu trúc dữ liệu một mẫu ngữ pháp:**

```json
{
  "id": "grammar_001",
  "pattern": "〜にもかかわらず",
  "meaning": "Mặc dù ~, bất chấp ~",
  "usage": "Diễn đạt sự tương phản. Dùng sau Danh từ / Động từ thể thông thường.",
  "jlpt_level": "N2",
  "cluster_id": "cluster_03",
  "examples": [
    {
      "sentence_jp": "雨にもかかわらず、試合は続けられた。",
      "sentence_vn": "Mặc dù trời mưa, trận đấu vẫn tiếp tục."
    }
  ],
  "similar_patterns": ["〜にもかかわらず", "〜のに", "〜ても"]
}
```

**Chức năng:**

| Chức năng | Mô tả |
|---|---|
| Xem danh sách theo cụm | Ngữ pháp được nhóm theo cụm chủ đề/độ khó |
| Xem chi tiết | Hiển thị cách dùng, cấu trúc chia, ví dụ câu, so sánh với mẫu tương tự |
| Trắc nghiệm theo cụm | Quiz điền vào chỗ trống / chọn mẫu đúng |

#### 4.2.3 Module Quiz

**Loại câu hỏi hỗ trợ:**

| Loại | Mô tả | Áp dụng cho |
|---|---|---|
| Multiple Choice | Chọn nghĩa đúng của từ/mẫu ngữ pháp | Từ vựng, Ngữ pháp |
| Fill in the blank | Điền từ vựng / mẫu ngữ pháp vào câu | Ngữ pháp |
| Matching | Nối từ với nghĩa | Từ vựng |

**Luồng Quiz:**
1. Người dùng hoàn thành học 1 cụm → Nút "Làm bài kiểm tra" xuất hiện
2. Hệ thống sinh ngẫu nhiên 10–15 câu từ pool của cụm
3. Sau khi nộp → Hiển thị điểm, câu sai được giải thích
4. Kết quả được lưu vào thống kê của User Service

#### 4.2.4 Module Flashcard

**Cơ chế hoạt động:**

Flashcard sử dụng thuật toán **Spaced Repetition System (SRS)** tương tự Anki:

```
Mỗi thẻ flashcard có trạng thái:
- interval      : Số ngày đến lần ôn tiếp theo
- ease_factor   : Hệ số dễ/khó (mặc định 2.5)
- repetitions   : Số lần đã ôn thành công liên tiếp
- next_review   : Timestamp ôn lần tiếp theo
```

**Quy tắc cập nhật (SM-2 Algorithm):**

| Đánh giá người dùng | Kết quả |
|---|---|
| ❌ Không nhớ | Reset: `interval = 1`, `repetitions = 0` |
| 😐 Khó nhớ | `interval` tăng nhẹ, `ease_factor` giảm |
| ✅ Nhớ tốt | `interval = interval × ease_factor`, lên lịch ôn xa hơn |
| ⭐ Nhớ rất tốt | `interval` tăng mạnh, `ease_factor` tăng |

**Loại bộ Flashcard:**

| Loại | Mô tả |
|---|---|
| Bộ có sẵn | Flashcard N2 theo từng cụm từ vựng, được cài sẵn trong hệ thống |
| Bộ cá nhân | Người dùng tự thêm từ khi học từ vựng (nhấn icon ➕) |

---

### 4.3 AI Service

> Đây là service phức tạp nhất, được xây dựng bằng **Python + FastAPI**.

#### 4.3.1 Chế độ hội thoại

**Chế độ 1 – Hội thoại Tự do (Free Chat)**

- AI nói chuyện không giới hạn chủ đề với người dùng bằng tiếng Nhật
- Không áp đặt cấp độ N2 trừ khi người dùng yêu cầu
- Trong suốt cuộc trò chuyện, AI **âm thầm phân tích** từng câu của người dùng
- Khi phát hiện lỗi: AI vẫn trả lời tự nhiên, đồng thời **đính kèm phần sửa lỗi** trong response JSON

**Chế độ 2 – Hội thoại Theo Tình Huống (Scenario-based Chat)**

- Người dùng chọn 1 kịch bản có sẵn (xem danh sách bên dưới)
- AI đóng vai nhân vật trong kịch bản và **dẫn dắt cuộc hội thoại** bám sát chủ đề
- Nếu người dùng lạc đề, AI khéo léo dẫn về kịch bản
- Sửa lỗi tương tự chế độ tự do

**Danh sách kịch bản gợi ý:**

| ID | Tên kịch bản | Mô tả |
|---|---|---|
| SC01 | Phỏng vấn xin việc | AI đóng vai HR, phỏng vấn bằng tiếng Nhật |
| SC02 | Thảo luận dự án IT | AI đóng vai đồng nghiệp Nhật, thảo luận kỹ thuật |
| SC03 | Đặt lịch hẹn | AI đóng vai thư ký/lễ tân, sắp xếp cuộc hẹn |
| SC04 | Mua sắm / Thương lượng | AI đóng vai nhân viên cửa hàng |
| SC05 | Hỏi đường / Di chuyển | AI đóng vai người dân địa phương Nhật |

**Chế độ N2 (tùy chọn bổ sung):**

- Người dùng có thể bật tùy chọn "Hội thoại theo chuẩn N2"
- AI sẽ ưu tiên dùng từ vựng, ngữ pháp N2 trong câu trả lời
- Gợi ý cách diễn đạt tương đương chuẩn N2 nếu người dùng dùng cách nói thấp hơn

#### 4.3.2 Hệ thống Phát hiện & Sửa lỗi

**Loại lỗi được phát hiện:**

| Loại lỗi | Ví dụ |
|---|---|
| Lỗi trợ từ (助詞) | Dùng `に` thay vì `で`, `は` thay vì `が` |
| Lỗi kính ngữ (敬語) | Dùng thể thông thường trong ngữ cảnh trang trọng |
| Lỗi chia động từ | Chia sai thể て、た、ない... |
| Lỗi mẫu ngữ pháp | Dùng sai cấu trúc N2 |
| Cách diễn đạt không tự nhiên | Câu đúng ngữ pháp nhưng người Nhật không nói vậy |

**Cấu trúc JSON phản hồi từ AI Service:**

```json
{
  "reply": "そうですね。プロジェクトの進捗について詳しく教えていただけますか？",
  "errors": [
    {
      "original": "プロジェクトを進めています",
      "corrected": "プロジェクトを進めております",
      "type": "keigo",
      "explanation": "ビジネスの場では「〜ております」という謙譲語を使うのが自然です。",
      "explanation_vn": "Trong môi trường kinh doanh, nên dùng khiêm nhường ngữ「〜ております」thay vì thể thông thường."
    }
  ],
  "n2_suggestion": "「プロジェクトが進捗しております」という言い方もN2レベルで自然です。",
  "session_id": "sess_abc123",
  "message_id": "msg_789"
}
```

---

## 5. Mô hình AI Pipeline

### 5.1 Tổng quan 4 tầng

```
┌─────────────────────────────────────────────────────────┐
│  TẦNG 1 – GIAO TIẾP (Communication Layer)               │
│  Nhận Text/Voice từ Frontend qua API Gateway            │
│  Chuyển Voice → Text (nếu có) bằng Whisper / Web API   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  TẦNG 2 – TRI THỨC / RAG (Knowledge Layer)              │
│  1. Phân tích ngữ cảnh câu người dùng                   │
│  2. Truy vấn Vector DB → Lấy từ vựng/ngữ pháp N2       │
│     liên quan nhất với chủ đề đang nói                  │
│  3. Đưa vào Context Window của LLM                      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  TẦNG 3 – TƯ DUY / LLM (Reasoning Layer)                │
│  Gemini 1.5 Flash (hoặc model thay thế)                 │
│  + System Prompt chuyên biệt theo chế độ                │
│  + Lịch sử hội thoại (LangChain Memory)                 │
│  + Dữ liệu N2 từ RAG                                    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  TẦNG 4 – CHUẨN HÓA (Output Normalization Layer)        │
│  Output Parser bóc tách JSON từ phản hồi LLM            │
│  Validate cấu trúc JSON                                  │
│  Trả về response chuẩn cho Frontend                     │
└─────────────────────────────────────────────────────────┘
```

### 5.2 RAG Pipeline chi tiết

```
Câu của người dùng
       │
       ▼
[Embedding Model] ──► Vector (1536 chiều)
       │
       ▼
[Vector DB Search] ──► Top-K chunk N2 liên quan
(Qdrant / ChromaDB)     (từ vựng + ngữ pháp)
       │
       ▼
[Context Builder]  ──► Prompt được bổ sung
                        kiến thức N2 phù hợp
```

**Dữ liệu N2 trong Vector DB:**
- Toàn bộ từ vựng N2 (khoảng 1500 từ) đã được embed
- Toàn bộ ngữ pháp N2 (~172 mẫu) đã được embed
- Mỗi entry kèm metadata: `cluster_id`, `word/pattern`, `meaning`, `example`

### 5.3 System Prompt Strategy

Hệ thống sử dụng **3 System Prompt template** khác nhau:

**Prompt A – Free Chat Mode:**
```
Bạn là trợ lý luyện tiếng Nhật. Hãy nói chuyện tự nhiên bằng tiếng Nhật với người dùng.
Không giới hạn chủ đề. Phân tích mỗi câu người dùng viết, phát hiện lỗi ngữ pháp nếu có.
Trả về JSON với 2 phần: "reply" (câu trả lời) và "errors" (danh sách lỗi, có thể rỗng).
[... chi tiết format JSON ...]
```

**Prompt B – Scenario Mode:**
```
Bạn đóng vai {role} trong kịch bản: {scenario_description}.
Duy trì kịch bản này trong toàn bộ hội thoại. Nếu người dùng lạc chủ đề, nhẹ nhàng dẫn về.
Phát hiện và báo cáo lỗi ngữ pháp người dùng mắc phải.
[... chi tiết format JSON ...]
```

**Prompt C – N2 Mode (bổ sung vào A hoặc B):**
```
Ngoài ra, ưu tiên sử dụng từ vựng và ngữ pháp ở cấp độ N2 trong câu trả lời.
Nếu người dùng dùng cách diễn đạt thấp hơn N2, gợi ý cách nói tương đương chuẩn N2.
```

### 5.4 Memory Management (LangChain)

- **ConversationBufferWindowMemory**: Giữ N tin nhắn gần nhất (mặc định: 10 lượt)
- **Session-based**: Mỗi phiên chat có `session_id` riêng, lưu trong Redis
- **Scenario State**: Kịch bản hiện tại, "bước" trong kịch bản được lưu trong session context

### 5.5 Voice Feature (Mở rộng)

> Tính năng này là **phụ / mở rộng**, không thuộc phạm vi core.

| Chiều | Công nghệ | Mô tả |
|---|---|---|
| Voice → Text | OpenAI Whisper / Web Speech API | Nhận giọng nói người dùng, chuyển thành text |
| Text → Voice | Google TTS / Web Speech Synthesis | Đọc phần trả lời của AI thành giọng nói |

---

## 6. Thiết kế cơ sở dữ liệu

### 6.1 User Service – PostgreSQL

**Bảng `users`**
```sql
id            UUID        PRIMARY KEY
username      VARCHAR(50) UNIQUE NOT NULL
email         VARCHAR(100) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
avatar_url    TEXT
learning_goal TEXT
created_at    TIMESTAMP   DEFAULT NOW()
updated_at    TIMESTAMP
```

**Bảng `user_vocab_progress`**
```sql
id            UUID      PRIMARY KEY
user_id       UUID      REFERENCES users(id)
vocab_id      VARCHAR   -- ID từ Core Service
status        ENUM('learning', 'learned', 'reviewing')
learned_at    TIMESTAMP
```

**Bảng `user_grammar_progress`**
```sql
id            UUID      PRIMARY KEY
user_id       UUID      REFERENCES users(id)
grammar_id    VARCHAR   -- ID từ Core Service
status        ENUM('learning', 'learned', 'reviewing')
learned_at    TIMESTAMP
```

**Bảng `kaiwa_sessions`**
```sql
id            UUID      PRIMARY KEY
user_id       UUID      REFERENCES users(id)
session_id    VARCHAR   -- Khớp với Redis session
mode          ENUM('free', 'scenario')
scenario_id   VARCHAR   NULLABLE
started_at    TIMESTAMP
ended_at      TIMESTAMP
duration_secs INTEGER
```

**Bảng `grammar_errors_log`**
```sql
id            UUID      PRIMARY KEY
user_id       UUID      REFERENCES users(id)
session_id    VARCHAR
error_type    VARCHAR   -- 'joshi', 'keigo', 'conjugation', 'pattern', 'unnatural'
original_text TEXT
corrected_text TEXT
created_at    TIMESTAMP
```

### 6.2 Core Service – MongoDB

**Collection `vocabularies`**
```json
{
  "_id": "vocab_001",
  "word": "確認",
  "reading": "かくにん",
  "meaning": "Xác nhận",
  "part_of_speech": "名詞・する動詞",
  "jlpt_level": "N2",
  "cluster_id": "cluster_05",
  "examples": [{ "jp": "...", "vn": "..." }],
  "tags": ["business"]
}
```

**Collection `grammar_patterns`**
```json
{
  "_id": "grammar_001",
  "pattern": "〜にもかかわらず",
  "meaning": "Mặc dù ~",
  "usage": "...",
  "jlpt_level": "N2",
  "cluster_id": "cluster_03",
  "examples": [{ "jp": "...", "vn": "..." }],
  "similar_patterns": ["〜のに"]
}
```

**Collection `clusters`**
```json
{
  "_id": "cluster_05",
  "type": "vocabulary",
  "name": "Từ vựng Kinh doanh - Cụm 5",
  "description": "Các từ dùng trong môi trường văn phòng",
  "item_count": 35
}
```

**Collection `flashcards`**
```json
{
  "_id": "fc_uuid",
  "user_id": "user_uuid",
  "vocab_id": "vocab_001",
  "type": "custom",
  "interval": 3,
  "ease_factor": 2.5,
  "repetitions": 2,
  "next_review": "2025-08-20T00:00:00Z",
  "created_at": "2025-08-01T00:00:00Z"
}
```

**Collection `quiz_results`**
```json
{
  "_id": "qr_uuid",
  "user_id": "user_uuid",
  "cluster_id": "cluster_05",
  "type": "vocabulary",
  "score": 8,
  "total": 10,
  "wrong_items": ["vocab_003", "vocab_011"],
  "completed_at": "2025-08-15T10:30:00Z"
}
```

### 6.3 Redis – Cache & Session

| Key Pattern | TTL | Nội dung |
|---|---|---|
| `session:{session_id}` | 2 giờ | Lịch sử chat, scenario state, chế độ AI |
| `token_blacklist:{jti}` | 7 ngày | Refresh token đã bị thu hồi |
| `user_stats:{user_id}` | 5 phút | Cache thống kê tiến độ |

---

## 7. Luồng xử lý nghiệp vụ chính

### 7.1 Luồng Đăng nhập

```
[User] ──► Nhập email + password
              │
              ▼
[API Gateway] ──► POST /api/auth/login → [User Service]
                                              │
                                    Kiểm tra DB + bcrypt compare
                                              │
                                    ┌─────────┴──────────┐
                                  Thất bại            Thành công
                                    │                    │
                                 401 Error        Tạo JWT + Refresh Token
                                                         │
                                                  Lưu Refresh Token → Redis
                                                         │
                                                  Trả về { access_token, refresh_token }
```

### 7.2 Luồng Hội thoại AI

```
[User] ──► Nhập câu tiếng Nhật → Frontend
              │
              ▼
[API Gateway] ──► POST /api/ai/chat (kèm JWT)
              │
              ▼
[AI Service – FastAPI]
   │
   ├─ 1. Đọc session từ Redis (lịch sử hội thoại)
   │
   ├─ 2. Embedding câu người dùng → Truy vấn Vector DB
   │      → Lấy top-3 từ vựng/ngữ pháp N2 liên quan
   │
   ├─ 3. Build Prompt:
   │      System Prompt (theo mode) +
   │      RAG Context (N2 data) +
   │      Conversation History +
   │      Câu người dùng
   │
   ├─ 4. Gọi Gemini 1.5 Flash API
   │
   ├─ 5. Parse JSON response:
   │      { reply, errors[], n2_suggestion }
   │
   ├─ 6. Lưu lỗi → gọi User Service (log errors)
   │
   ├─ 7. Cập nhật session history → Redis
   │
   └─ 8. Trả về JSON response → Frontend
              │
              ▼
[Frontend] ──► Hiển thị:
   ├─ Câu trả lời của AI
   └─ Panel sửa lỗi (nếu errors[] không rỗng)
```

### 7.3 Luồng Ôn tập Flashcard

```
[User] ──► Mở màn hình Flashcard
              │
              ▼
[Core Service] ──► Lấy danh sách thẻ có next_review ≤ NOW()
   │                Sắp xếp theo độ ưu tiên (quá hạn lâu nhất lên trước)
   ▼
[Frontend] ──► Hiển thị thẻ (mặt trước: từ tiếng Nhật)
   │
[User] ──► Lật thẻ → Xem nghĩa → Đánh giá (❌/😐/✅/⭐)
   │
   ▼
[Core Service] ──► Cập nhật interval, ease_factor, next_review (SM-2)
   │
[User Service] ──► Ghi nhận vào thống kê (số thẻ đã ôn hôm nay)
```

---

## 8. Đặc tả API giữa các Service

### 8.1 API Gateway → User Service

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập, trả JWT |
| POST | `/auth/refresh` | Làm mới access token |
| POST | `/auth/logout` | Đăng xuất |
| GET | `/users/me` | Lấy thông tin profile |
| PUT | `/users/me` | Cập nhật profile |
| GET | `/users/me/stats` | Lấy thống kê tiến độ |
| POST | `/users/me/errors` | Ghi log lỗi ngữ pháp (gọi từ AI Service) |

### 8.2 API Gateway → Core Service

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/vocabulary/clusters` | Danh sách các cụm từ vựng |
| GET | `/vocabulary/clusters/:id` | Từ vựng trong một cụm |
| GET | `/vocabulary/:id` | Chi tiết một từ |
| GET | `/grammar/clusters` | Danh sách các cụm ngữ pháp |
| GET | `/grammar/clusters/:id` | Ngữ pháp trong một cụm |
| GET | `/grammar/:id` | Chi tiết một mẫu ngữ pháp |
| POST | `/quiz/generate` | Tạo bộ câu hỏi quiz cho 1 cụm |
| POST | `/quiz/submit` | Nộp kết quả quiz |
| GET | `/flashcards` | Lấy thẻ cần ôn hôm nay |
| POST | `/flashcards` | Thêm từ vào flashcard |
| PUT | `/flashcards/:id/review` | Cập nhật kết quả ôn thẻ |

### 8.3 API Gateway → AI Service

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/ai/sessions` | Tạo phiên hội thoại mới |
| POST | `/ai/sessions/:id/messages` | Gửi tin nhắn, nhận reply + errors |
| DELETE | `/ai/sessions/:id` | Kết thúc phiên hội thoại |
| GET | `/ai/scenarios` | Lấy danh sách kịch bản có sẵn |

### 8.4 Request / Response mẫu – Chat

**Request:**
```json
POST /ai/sessions/{session_id}/messages
Authorization: Bearer {access_token}
{
  "message": "プロジェクトを進めています。",
  "mode": "scenario",
  "n2_mode": true
}
```

**Response:**
```json
{
  "message_id": "msg_xyz",
  "reply": "そうですか。プロジェクトの進捗はいかがでしょうか？",
  "errors": [
    {
      "original": "プロジェクトを進めています",
      "corrected": "プロジェクトを進めております",
      "type": "keigo",
      "explanation_jp": "ビジネスでは謙譲語「〜ております」が適切です。",
      "explanation_vn": "Trong kinh doanh, nên dùng「〜ております」(khiêm nhường ngữ)."
    }
  ],
  "n2_suggestion": "「プロジェクトが進捗しております」もN2らしい表現です。"
}
```

---

## 9. Yêu cầu phi chức năng

### 9.1 Hiệu năng (Performance)

| Chỉ số | Mục tiêu |
|---|---|
| Thời gian phản hồi API thông thường | < 300ms |
| Thời gian phản hồi AI Chat | < 3 giây (phụ thuộc Gemini API) |
| Thời gian tải trang đầu (First Load) | < 2 giây |
| Concurrent users hỗ trợ | ≥ 100 users đồng thời |

### 9.2 Bảo mật (Security)

- Toàn bộ API dùng **HTTPS**
- Password lưu trữ bằng **bcrypt** (cost factor ≥ 12)
- **JWT** với TTL ngắn (1h), refresh token lưu server-side
- **Rate Limiting** tại API Gateway: giới hạn request/phút để tránh lạm dụng AI API
- Validate và sanitize tất cả input từ người dùng

### 9.3 Khả năng mở rộng (Scalability)

- Mỗi Microservice có thể **scale độc lập** (horizontal scaling)
- AI Service dùng **async/await** (FastAPI) để xử lý nhiều request đồng thời không blocking
- Vector DB và Redis có thể chuyển sang managed cloud service khi cần tăng tải

### 9.4 Khả năng bảo trì (Maintainability)

- Mỗi service có **Dockerfile** riêng
- Sử dụng **Docker Compose** để quản lý môi trường development
- API được document bằng **Swagger/OpenAPI** (FastAPI tự sinh, Node.js dùng Swagger UI)
- Logging tập trung (có thể dùng ELK Stack hoặc đơn giản là file log có cấu trúc)

---

## 10. Công nghệ sử dụng

### 10.1 Bảng tổng hợp

| Layer | Công nghệ | Lý do chọn |
|---|---|---|
| **Frontend** | React + Vite + TailwindCSS | SPA nhanh, ecosystem lớn |
| **API Gateway** | Nginx / Express Gateway | Đơn giản, dễ cấu hình |
| **User Service** | Node.js + Express | Quen thuộc, nhanh cho REST API |
| **Core Service** | Node.js + Express | Đồng nhất với User Service |
| **AI Service** | Python + FastAPI | Hỗ trợ tốt NLP, async tốt, tích hợp LangChain |
| **LLM** | Google Gemini 1.5 Flash | Free tier hào phóng, đa ngôn ngữ tốt |
| **LLM Framework** | LangChain | Memory, RAG, Prompt management |
| **Vector DB** | Qdrant hoặc ChromaDB | Open-source, dễ self-host |
| **Primary DB (User)** | PostgreSQL | Relational, ACID, phù hợp dữ liệu user |
| **Primary DB (Content)** | MongoDB | Flexible schema, phù hợp content N2 |
| **Cache / Session** | Redis | In-memory, TTL dễ quản lý |
| **Containerization** | Docker + Docker Compose | Đồng nhất môi trường dev/prod |

### 10.2 Phân công công việc

| Hạng mục | Công cụ | Sinh viên thực hiện |
|---|---|---|
| Prompt Engineering | Gemini API | Thiết kế System Prompt cho 3 chế độ |
| RAG Logic | LangChain + Qdrant | Pipeline tìm kiếm ngữ cảnh, embed dữ liệu N2 |
| Output Parser | Python + Pydantic | Bóc tách JSON lỗi từ response LLM |
| Memory Management | LangChain Memory | Giữ lịch sử hội thoại, duy trì kịch bản |
| AI Service API | FastAPI | Toàn bộ server AI, async handler |
| Dataset N2 | CSV/JSON | Thu thập, chuẩn hóa, bổ sung dữ liệu N2 |
| SRS Algorithm | Custom code | Cài đặt thuật toán SM-2 cho Flashcard |

---

## 11. Phạm vi & Hướng mở rộng

### 11.1 Phạm vi trong đề tài (In-scope)

- ✅ Đăng ký / Đăng nhập / Quản lý profile
- ✅ Học từ vựng N2 theo cụm + Quiz
- ✅ Học ngữ pháp N2 theo cụm + Quiz
- ✅ Luyện hội thoại AI (Free Chat + Scenario Chat)
- ✅ Phát hiện và sửa lỗi ngữ pháp trong hội thoại
- ✅ Flashcard cá nhân + SRS (Spaced Repetition)
- ✅ Thống kê tiến độ học tập
- ✅ Voice Chat (mức cơ bản, tính năng phụ)

### 11.2 Ngoài phạm vi / Hướng mở rộng (Out-of-scope / Future)

| Tính năng | Ưu tiên | Ghi chú |
|---|---|---|
| Bài thi thử N2 đầy đủ | Cao | Mô phỏng đề thi thật 3 phần |
| Luyện nghe (Listening) | Cao | Tích hợp audio bài nghe |
| Tra cứu từ vựng cộng đồng | Trung bình | User có thể đóng góp ví dụ câu |
| Tối ưu latency AI | Trung bình | Streaming response, caching câu trả lời |
| Mobile App (React Native) | Thấp | Tái sử dụng API layer |

---

*Tài liệu này mô tả yêu cầu hệ thống phiên bản 1.0 — cập nhật lần cuối: 2025*
