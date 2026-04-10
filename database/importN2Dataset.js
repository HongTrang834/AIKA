/**
 * Script để import N2 Dataset và tự động tạo Lessons
 * 
 * TODO: Dataset cần có cấu trúc như sau:
 * 1. Vocabulary dataset: 
 *    - Format: CSV hoặc JSON
 *    - Fields: word (từ), meaning (nghĩa), pronunciation (phát âm), category (chủ đề), level
 *    - VD: { word: "敬語", meaning: "honorific language", pronunciation: "けいご", category: "Business" }
 * 
 * 2. Grammar dataset:
 *    - Format: CSV hoặc JSON
 *    - Fields: pattern (mẫu), meaning (nghĩa), example (ví dụ), category (chủ đề), level
 *    - VD: { pattern: "~いただけますか", meaning: "can you please", example: "お手数ですが、確認していただけますか", category: "Business" }
 * 
 * 3. Category cần match với units hiện tại:
 *    - "Business Ethics" (unit_id: 1)
 *    - "Office Communication" (unit_id: 2)
 *    - "Formal Presentations" (unit_id: 3)
 *    - "Customer Service" (unit_id: 4)
 *    - "Advanced Negotiations" (unit_id: 5)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: Cấu hình đường dẫn dataset
const VOCAB_FILE = path.join(__dirname, 'n2_vocabulary.csv'); // hoặc .json
const GRAMMAR_FILE = path.join(__dirname, 'n2_grammar.csv'); // hoặc .json

// Mapping category -> unit_id
const categoryToUnitId = {
  'Business Ethics': 1,
  'Office Communication': 2,
  'Formal Presentations': 3,
  'Customer Service': 4,
  'Advanced Negotiations': 5,
};

/**
 * TODO: Implement - Parse CSV file
 * @param {string} filePath - Đường dẫn file CSV
 * @returns {Array} Mảng objects từ CSV
 */
async function parseCSV(filePath) {
  // CÁCH 1: Dùng thư viện csv-parser
  // npm install csv-parser
  // const results = [];
  // fs.createReadStream(filePath)
  //   .pipe(csv())
  //   .on('data', (data) => results.push(data))
  //   .on('end', () => console.log('CSV parsed'));
  // return results;

  // CÁCH 2: Dùng thư viện papaparse
  // npm install papaparse
  // const Papa = require('papaparse');
  // const fileContent = fs.readFileSync(filePath, 'utf-8');
  // const results = Papa.parse(fileContent, { header: true });
  // return results.data;

  throw new Error('TODO: Implement CSV parser');
}

/**
 * TODO: Implement - Parse JSON file
 * @param {string} filePath - Đường dẫn file JSON
 * @returns {Array} Mảng objects từ JSON
 */
async function parseJSON(filePath) {
  // const fileContent = fs.readFileSync(filePath, 'utf-8');
  // return JSON.parse(fileContent);
  throw new Error('TODO: Implement JSON parser');
}

/**
 * Import vocabulary vào database
 * TODO: Cần chắc chắn bảng `vocabulary` đã được tạo
 */
async function importVocabulary(vocabularies) {
  console.log(`📚 Importing ${vocabularies.length} vocabulary items...`);
  
  // TODO: Validate vocabulary structure
  // Kiểm tra mỗi item có: word, meaning, pronunciation, category, level

  for (const vocab of vocabularies) {
    try {
      // TODO: Map category -> lesson_id
      // Hiện tại cần tìm lesson dựa vào category và tạo nếu chưa có

      const query = `
        INSERT INTO vocabulary (lesson_id, word, meaning, pronunciation, level)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `;

      // const lessonId = await findOrCreateLesson(vocab.category, vocab.level);
      // await db.query(query, [lessonId, vocab.word, vocab.meaning, vocab.pronunciation, vocab.level]);
    } catch (error) {
      console.error(`❌ Error importing vocab "${vocab.word}":`, error.message);
    }
  }

  console.log(`✅ Vocabulary import completed`);
}

/**
 * Import grammar vào database
 * TODO: Cần chắc chắn bảng `grammar` đã được tạo
 */
async function importGrammar(grammars) {
  console.log(`📝 Importing ${grammars.length} grammar patterns...`);

  // TODO: Validate grammar structure
  // Kiểm tra mỗi item có: pattern, meaning, example, category, level

  for (const grammar of grammars) {
    try {
      // TODO: Map category -> lesson_id
      const query = `
        INSERT INTO grammar (lesson_id, pattern, meaning, example, level)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `;

      // const lessonId = await findOrCreateLesson(grammar.category, grammar.level);
      // await db.query(query, [lessonId, grammar.pattern, grammar.meaning, grammar.example, grammar.level]);
    } catch (error) {
      console.error(`❌ Error importing grammar "${grammar.pattern}":`, error.message);
    }
  }

  console.log(`✅ Grammar import completed`);
}

/**
 * TODO: Tìm hoặc tạo lesson tương ứng
 * @param {string} category - Chủ đề (VD: "Business Ethics")
 * @param {number} level - Level (1-10)
 * @returns {number} lesson_id
 */
async function findOrCreateLesson(category, level) {
  // Logic:
  // 1. Tìm lesson có category này
  // 2. Nếu không có, tạo lesson mới dựa vào category
  // 3. Return lesson_id

  // VD:
  // const unitId = categoryToUnitId[category];
  // const existingLesson = await db.query(
  //   'SELECT id FROM lessons WHERE unit_id = $1 AND category = $2',
  //   [unitId, category]
  // );
  // if (existingLesson.rows.length > 0) return existingLesson.rows[0].id;
  
  // // Create new lesson
  // const newLesson = await db.query(
  //   'INSERT INTO lessons (unit_id, title, description) VALUES ($1, $2, $3) RETURNING id',
  //   [unitId, category, `Lesson for ${category}`]
  // );
  // return newLesson.rows[0].id;

  throw new Error('TODO: Implement findOrCreateLesson');
}

/**
 * Auto-generate lessons từ vocabulary + grammar
 * TODO: Implement logic nhóm dữ liệu
 */
async function autoGenerateLessons() {
  console.log(`🎓 Auto-generating lessons...`);

  // TODO: Làm rõ cách nhóm:
  // Option A: Nhóm theo category + level
  //   - Chia thành 5 lessons per unit (Business Ethics → Lesson 1-10, etc)
  //   - Mỗi lesson có ~50 vocab + 10 grammar
  
  // Option B: Nhóm theo số lượng cố định
  //   - Mỗi lesson 50 vocab + 10 grammar, không phân biệt category
  
  // Option C: Nhóm theo kanji reading difficulty
  //   - Lesson 1-5: Easy reading kanji
  //   - Lesson 6-10: Medium reading
  //   - Lesson 11+: Hard reading

  // const lessons = await groupVocabAndGrammar(vocabularies, grammars);
  
  // for (const lesson of lessons) {
  //   const result = await db.query(
  //     'INSERT INTO lessons (unit_id, title, vocabulary_count, grammar_count, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
  //     [lesson.unit_id, lesson.title, lesson.vocab_count, lesson.grammar_count, lesson.description]
  //   );
  // }

  throw new Error('TODO: Implement autoGenerateLessons');
}

/**
 * Main import function
 */
async function main() {
  try {
    console.log('🚀 Starting N2 Dataset Import...\n');

    // TODO: Kiểm tra file dataset tồn tại
    // if (!fs.existsSync(VOCAB_FILE)) {
    //   throw new Error(`Vocabulary file not found: ${VOCAB_FILE}`);
    // }
    // if (!fs.existsSync(GRAMMAR_FILE)) {
    //   throw new Error(`Grammar file not found: ${GRAMMAR_FILE}`);
    // }

    // TODO: Parse dataset
    // const vocabularies = VOCAB_FILE.endsWith('.csv') 
    //   ? await parseCSV(VOCAB_FILE)
    //   : await parseJSON(VOCAB_FILE);
    
    // const grammars = GRAMMAR_FILE.endsWith('.csv')
    //   ? await parseCSV(GRAMMAR_FILE)
    //   : await parseJSON(GRAMMAR_FILE);

    // console.log(`📊 Parsed ${vocabularies.length} vocabulary items`);
    // console.log(`📊 Parsed ${grammars.length} grammar patterns\n`);

    // TODO: Import dữ liệu
    // await importVocabulary(vocabularies);
    // await importGrammar(grammars);

    // TODO: Auto-generate lessons
    // await autoGenerateLessons();

    console.log('\n✅ Dataset import completed!');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

main();

/**
 * NEXT STEPS - Để chạy script này:
 * 
 * 1. Tạo file vocabulary dataset:
 *    - d:\DATN\n2-japanese-learning\database\n2_vocabulary.csv (hoặc .json)
 *    - VD CSV format:
 *      word,meaning,pronunciation,category,level
 *      敬語,honorific language,けいご,Business Ethics,5
 *      失礼,rude/disrespectful,しつれい,Business Ethics,5
 *    
 *    - VD JSON format:
 *      [
 *        { "word": "敬語", "meaning": "honorific language", "pronunciation": "けいご", "category": "Business Ethics", "level": 5 },
 *        ...
 *      ]
 * 
 * 2. Tạo file grammar dataset:
 *    - d:\DATN\n2-japanese-learning\database\n2_grammar.csv (hoặc .json)
 *    - VD:
 *      pattern,meaning,example,category,level
 *      ~いただけますか,can you please,お手数ですが、確認していただけますか,Business Ethics,5
 * 
 * 3. Cài thư viện parse CSV (tùy chọn):
 *    npm install csv-parser  # hoặc papaparse
 * 
 * 4. Chạy script:
 *    node database/importN2Dataset.js
 * 
 * 5. Verify:
 *    psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM vocabulary;"
 *    psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM grammar;"
 */
