/\*\*

- N2 DATASET IMPORT - CHECKLIST & TODO ITEMS
-
- Tóm tắt những phần cần hoàn thiện để import N2 dataset
- và tự động tạo lessons
  \*/

## 📋 FILES CREATED

1. ✅ `/database/importN2Dataset.js` - Script import dataset
2. ✅ `/database/migration_n2.sql` - SQL migration tạo tables
3. ✅ `/backend/routes/progress.js` - Thêm 2 endpoints (vocabulary + grammar)

## 🎯 TODO CHECKLIST

### STEP 1: Chuẩn bị Dataset (BẠN LÀM)

- [ ] Tạo file `n2_vocabulary.csv` hoặc `n2_vocabulary.json`
  - Đặt tại: `d:\DATN\n2-japanese-learning\database\n2_vocabulary.csv`
  - Cấu trúc CSV:
    ```
    word,meaning,pronunciation,category,level
    敬語,honorific language,けいご,Business Ethics,5
    失礼,rude/disrespectful,しつれい,Business Ethics,5
    ```
  - VD JSON: `[{ "word": "敬語", "meaning": "...", ... }]`

- [ ] Tạo file `n2_grammar.csv` hoặc `n2_grammar.json`
  - Đặt tại: `d:\DATN\n2-japanese-learning\database\n2_grammar.csv`
  - Cấu trúc CSV:
    ```
    pattern,meaning,example,category,level
    ~いただけますか,can you please,お手数ですが確認していただけますか,Business Ethics,5
    ```

- [ ] **Verify category mapping** - Category phải match 1 trong 5 units hiện tại:
  - "Business Ethics"
  - "Office Communication"
  - "Formal Presentations"
  - "Customer Service"
  - "Advanced Negotiations"

### STEP 2: Database Migration (SETUP)

- [ ] Chạy migration SQL:
  ```bash
  psql -U postgres -d aika_db -f database/migration_n2.sql
  ```

  - Hoặc chạy queries trực tiếp trong psql
- [ ] Verify tables được tạo:

  ```bash
  psql -U postgres -d aika_db -c "\dt vocabulary grammar"
  ```

- [ ] Verify test data được insert:
  ```bash
  psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM vocabulary;"
  psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM grammar;"
  ```

### STEP 3: Complete Import Script (CODE)

Files: `/database/importN2Dataset.js`

- [ ] Implement `parseCSV()` function
  - Option A: Dùng `csv-parser` library
    ```bash
    npm install csv-parser
    ```
  - Option B: Dùng `papaparse` library
    ```bash
    npm install papaparse
    ```
  - Option C: Manual parse (không recommended)

- [ ] Implement `parseJSON()` function (nếu dùng JSON)

- [ ] Implement `importVocabulary(vocabularies)` function
  - Query: INSERT INTO vocabulary (lesson_id, word, meaning, pronunciation, level)
  - Cần map category → lesson_id trước

- [ ] Implement `importGrammar(grammars)` function
  - Query: INSERT INTO grammar (lesson_id, pattern, meaning, example, level)
  - Cần map category → lesson_id trước

- [ ] Implement `findOrCreateLesson(category, level)` function
  - Logic:
    - Tìm lesson có category này trong unit tương ứng
    - Nếu chưa có, tạo lesson mới
    - Return lesson_id

- [ ] Implement `autoGenerateLessons()` function
  - Nhóm vocabulary + grammar thành lessons
  - Logic nhóm:
    - Option A: By category (Business → Lessons 1-10, etc)
    - Option B: By fixed count (50 vocab + 10 grammar per lesson)
    - Option C: By difficulty level

- [ ] Handle file validation & error handling

### STEP 4: Update Frontend (OPTIONAL)

Files: `/frontend/src/pages/Lesson.tsx`

- [ ] Uncomment API calls cho `/api/progress/lessons/:lessonId/vocabulary`
- [ ] Uncomment API calls cho `/api/progress/lessons/:lessonId/grammar`
- [ ] Render vocabulary list trong lesson page
- [ ] Render grammar list trong lesson page
- [ ] Replace hardcoded sample data

### STEP 5: Test & Verify

- [ ] Chạy import script:

  ```bash
  node database/importN2Dataset.js
  ```

- [ ] Check database:

  ```bash
  psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM lessons;"
  psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM vocabulary;"
  psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM grammar;"
  ```

- [ ] Test API endpoints:

  ```bash
  # Lấy vocabulary của lesson 1
  curl http://localhost:5000/api/progress/lessons/1/vocabulary

  # Lấy grammar của lesson 1
  curl http://localhost:5000/api/progress/lessons/1/grammar
  ```

- [ ] Test frontend:
  - Navigate to Dashboard
  - Click "Resume Learning"
  - Verify lesson page hiển thị vocabulary + grammar

## 📧 NEXT: GỬI DATASET CHO TÔI

Khi bạn có dataset N2 (vocabulary + grammar), gửi cho tôi:

- File `n2_vocabulary.csv` hoặc `n2_vocabulary.json`
- File `n2_grammar.csv` hoặc `n2_grammar.json`
- Hoặc link / format của dataset

Tôi sẽ:

1. Xem cấu trúc dataset
2. Implement import script hoàn chỉnh
3. Test import vào database
4. Update frontend để hiển thị dữ liệu

## 💡 NOTES

- **Vocabulary count**: N2 có ~2,500 từ (theo JLPT)
- **Grammar patterns**: N2 có ~50-70 mẫu ngữ pháp
- **Learnings per lesson**: Recommendation ~50 vocab + 10 grammar per lesson
  - Total lessons: 2,500 ÷ 50 = 50 lessons (across 5 units)

- **Database size**: ~10-15 MB (bao gồm vocabulary + grammar)
- **Import time**: ~5-10 giây

- **Endpoints đã sẵn**:
  - ✅ GET /api/progress/lessons/:lessonId/vocabulary
  - ✅ GET /api/progress/lessons/:lessonId/grammar
  - ✅ GET /api/progress/current-lesson
  - ✅ POST /api/progress/current-lesson/:lessonId
