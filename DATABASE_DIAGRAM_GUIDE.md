# Database Diagram - Hướng Dẫn Sử Dụng

## 📊 Cách Vẽ Diagram trên dbdiagram.io

### **Bước 1: Mở dbdiagram.io**

1. Truy cập https://dbdiagram.io/d
2. Tạo tài khoản hoặc đăng nhập

### **Bước 2: Import Schema**

1. Mở file `/database/dbdiagram.io` trong project
2. Copy toàn bộ nội dung
3. Tại dbdiagram.io:
   - Click **"Create New Diagram"**
   - Chọn **"Write SQL"** hoặc **"Import/Paste SQL"**
   - Dán nội dung file vào
   - Click **"Visualize"**

### **Bước 3: Tùy Chỉnh**

- **Thay đổi Theme**: Menu trên cùng → Select theme (Dark, Light)
- **Export**: Click **"Export"** → Chọn PNG, PDF, SQL
- **Share**: Click **"Share"** → Copy link để chia sẻ

---

## 🗂️ Cấu Trúc Database

### **Core Tables (7 tables)**

```
users ← (1:N) → flashcard_decks
users ← (1:N) → flashcards
users ← (1:N) → conversation_history
users ← (1:1) → user_progress
users ← (1:N) → test_results

vocabulary ← (1:N) → flashcards
vocabulary ← (1:N) → test_questions

grammar ← (1:N) → flashcards
grammar ← (1:N) → test_questions

flashcard_decks ← (1:N) → flashcards

tests ← (1:N) → test_questions
tests ← (1:N) → test_results

scenarios ← (1:N) → conversation_history
```

---

## 📋 Các Table Chính

### **1. Users** (Quản lý người dùng)

- `id`: Primary key
- `username`: Tên đăng nhập (unique)
- `email`: Email (unique)
- `password_hash`: Mật khẩu mã hóa
- `role`: 'student' hoặc 'admin'
- `avatar_url`: Ảnh đại diện (base64)

### **2. Vocabulary** (Từ vựng N2)

- `id`: Primary key
- `word`: Kanji/Hiragana
- `reading`: Cách phát âm
- `meaning`: Nghĩa tiếng Việt
- `examples`: JSON array (multiple examples)
- `level`: N-level (2 = N2)
- `category`: Business, Daily, v.v.

### **3. Grammar** (Ngữ pháp N2)

- `id`: Primary key
- `title`: Tên mẫu ngữ pháp
- `pattern`: Cấu trúc (~といった, ~によって)
- `explanation`: Giải thích chi tiết
- `examples`: JSON array (multiple examples)

### **4. Flashcard_Decks** (Bộ flashcard)

- `id`: Primary key
- `user_id`: Người sở hữu (NULL for global)
- `name`: Tên bộ (N2 Vocabulary, Kanji, v.v.)
- `is_global`: true = tất cả user có thể dùng
- `color`: Màu hiển thị

### **5. Flashcards** (Thẻ học)

- `id`: Primary key
- `user_id`: Người sở hữu
- `vocab_id` / `grammar_id`: Mục tiêu học
- `deck_id`: Thuộc bộ nào
- **SM-2 Algorithm**:
  - `interval`: Khoảng thời gian đợi (days)
  - `repetitions`: Số lần ôn tập
  - `ease_factor`: Độ khó (2.5-5.0)
  - `next_review_date`: Khi nào ôn tập tiếp

### **6. Tests** (Bài kiểm tra)

- `id`: Primary key
- `name`: Tên bài thi
- `category`: Chuyên đề
- `topic_type`: 'vocabulary' hoặc 'grammar'
- `total_questions`: Số câu hỏi

### **7. Test_Questions** (Câu hỏi bài thi)

- `id`: Primary key
- `test_id`: Thuộc bài thi nào
- `question_type`: 'multiple_choice', 'fill_blank', v.v.
- `options`: JSONB (A, B, C, D choices)
- `correct_answer`: Đáp án đúng

### **8. Test_Results** (Kết quả bài thi)

- `id`: Primary key
- `user_id`: Người làm
- `test_id`: Bài thi nào
- `score`: Điểm (%)
- `answers`: JSONB (lưu các câu trả lời)

### **9. Conversation_History** (Lịch sử Kaiwa)

- `id`: Primary key
- `user_id`: Người dùng
- `mode`: 'free' hoặc 'scenario'
- `user_message`: Câu user
- `ai_response`: Phản hồi AI
- `grammar_errors`: JSON (lỗi sửa lại)

### **10. User_Progress** (Tiến độ học)

- `user_id`: Người dùng (1:1)
- `total_vocab_learned`: Số từ học
- `total_kaiwas`: Số lần hội thoại
- `last_activity`: Hoạt động cuối cùng

---

## 🔗 Relationships

| From            | To                   | Type | Note                              |
| --------------- | -------------------- | ---- | --------------------------------- |
| users           | flashcard_decks      | 1:N  | User có nhiều bộ flashcard        |
| users           | flashcards           | 1:N  | User có nhiều flashcard           |
| users           | conversation_history | 1:N  | User có nhiều cuộc hội thoại      |
| users           | test_results         | 1:N  | User làm nhiều bài thi            |
| users           | user_progress        | 1:1  | 1 user = 1 progress               |
| vocabulary      | flashcards           | 1:N  | 1 từ → nhiều flashcard            |
| vocabulary      | test_questions       | 1:N  | 1 từ → nhiều câu hỏi              |
| grammar         | flashcards           | 1:N  | 1 pattern → nhiều flashcard       |
| grammar         | test_questions       | 1:N  | 1 pattern → nhiều câu hỏi         |
| flashcard_decks | flashcards           | 1:N  | 1 deck → nhiều flashcard          |
| tests           | test_questions       | 1:N  | 1 bài thi → nhiều câu hỏi         |
| tests           | test_results         | 1:N  | 1 bài thi → nhiều kết quả         |
| scenarios       | conversation_history | 1:N  | 1 scenario → nhiều cuộc hội thoại |

---

## 📊 Export Options

Sau khi vẽ xong, bạn có thể export:

- **PNG**: Ảnh tĩnh (cho slides, báo cáo)
- **PDF**: Tài liệu (cho báo cáo PDF)
- **SQL**: Code SQL (đưa vào database)
- **Link**: Chia sẻ link diagram cho team

---

## 💡 Tips

1. **Organize Layout**: Kéo thả các table để sắp xếp đẹp mắt
2. **Color Coding**: Dùng màu khác nhau cho các module
   - Blue: User Management
   - Green: Learning (Vocabulary, Grammar, Flashcards)
   - Orange: Assessment (Tests)
   - Purple: Conversation (Kaiwa)
3. **Show/Hide Fields**: Có thể ẩn các field không quan trọng
4. **Print-friendly**: Theme sáng + export PDF cho báo cáo

---

## 📝 Viết Báo Cáo

Khi viết báo cáo, bạn có thể:

1. **Embed diagram**: Export PNG, dán vào Word/Google Docs
2. **Describe relationships**: Giải thích các foreign key
3. **Show sample queries**:
   ```sql
   -- Lấy flashcard sẽ review hôm nay
   SELECT f.* FROM flashcards f
   WHERE f.user_id = 3 AND f.next_review_date <= NOW();
   ```

---

## 🎯 Các Case Study

### **Case 1: User học từ vựng mới**

```
user → tạo deck
deck → thêm flashcard
flashcard → vocab_id (liên kết từ vựng)
```

### **Case 2: User ôn tập flashcard (SM-2)**

```
flashcard (today is next_review_date)
→ hiển thị
→ user trả lời
→ cập nhật interval, repetitions, ease_factor
→ tính next_review_date mới
```

### **Case 3: User làm bài kiểm tra**

```
test → test_question (5 câu)
test_question → vocab/grammar
user → test_result (ghi lại điểm)
test_result.answers (JSON các đáp án)
```

### **Case 4: User hội thoại Kaiwa**

```
user → conversation_history
conversation_history.mode = 'free' or 'scenario'
ai_response (từ Gemini API)
grammar_errors (JSON file lỗi)
```

---

**Link Diagram**: https://dbdiagram.io/d

Paste file `/database/dbdiagram.io` vào và click "Visualize" để xem! 🎨
