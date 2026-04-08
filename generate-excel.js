import fs from 'fs';
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Vocabulary', {
  pageSetup: { paperSize: 9, orientation: 'landscape' },
});

// Define columns with simple names for easier parsing
worksheet.columns = [
  { header: 'word', key: 'word', width: 15 },
  { header: 'reading', key: 'reading', width: 15 },
  { header: 'meaning', key: 'meaning', width: 20 },
  { header: 'category', key: 'category', width: 15 },
  { header: 'level', key: 'level', width: 10 },
  { header: 'example_sentence', key: 'example_sentence', width: 40 },
];

// Style header row
worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
worksheet.getRow(1).height = 25;

// Add sample data
const data = [
  { word: '学ぶ', reading: 'まなぶ', meaning: 'to learn', category: 'Verbs', level: 2, example_sentence: '私は毎日日本語を学んでいます。' },
  { word: '日本', reading: 'にほん', meaning: 'Japan', category: 'Geography', level: 1, example_sentence: '私は日本から来ました。' },
  { word: '勉強', reading: 'べんきょう', meaning: 'study', category: 'Nouns', level: 2, example_sentence: '明日試験があるので勉強しなければなりません。' },
  { word: '先生', reading: 'せんせい', meaning: 'teacher', category: 'Nouns', level: 1, example_sentence: '先生は親切に教えてくれました。' },
  { word: '学校', reading: 'がっこう', meaning: 'school', category: 'Nouns', level: 1, example_sentence: '毎朝7時に学校へ行きます。' },
  { word: '友達', reading: 'ともだち', meaning: 'friend', category: 'Nouns', level: 1, example_sentence: '週末に友達と遊びました。' },
  { word: '家', reading: 'いえ', meaning: 'house', category: 'Nouns', level: 1, example_sentence: '私の家は駅の近くです。' },
  { word: '食べる', reading: 'たべる', meaning: 'to eat', category: 'Verbs', level: 1, example_sentence: '朝食にパンを食べました。' },
  { word: '飲む', reading: 'のむ', meaning: 'to drink', category: 'Verbs', level: 1, example_sentence: 'コーヒーを飲みながら本を読みました。' },
  { word: '読む', reading: 'よむ', meaning: 'to read', category: 'Verbs', level: 1, example_sentence: '毎晩新聞を読みます。' },
  { word: '大好き', reading: 'だいすき', meaning: 'love/like very much', category: 'Adjectives', level: 2, example_sentence: '私は日本文化が大好きです。' },
  { word: '美しい', reading: 'うつくしい', meaning: 'beautiful', category: 'Adjectives', level: 2, example_sentence: 'このお寺は本当に美しいです。' },
  { word: '高い', reading: 'たかい', meaning: 'high/expensive', category: 'Adjectives', level: 1, example_sentence: 'この建物は本当に高いです。' },
  { word: '安い', reading: 'やすい', meaning: 'cheap', category: 'Adjectives', level: 1, example_sentence: 'このお店は野菜が安いです。' },
  { word: '寒い', reading: 'さむい', meaning: 'cold', category: 'Adjectives', level: 1, example_sentence: '冬は非常に寒いです。' },
  { word: '暖かい', reading: 'あたたかい', meaning: 'warm', category: 'Adjectives', level: 2, example_sentence: '春は暖かくなりました。' },
  { word: '新しい', reading: 'あたらしい', meaning: 'new', category: 'Adjectives', level: 1, example_sentence: '新しいパソコンを買いました。' },
  { word: '古い', reading: 'ふるい', meaning: 'old', category: 'Adjectives', level: 1, example_sentence: 'この家は古いですが、とても素敵です。' },
  { word: '大きい', reading: 'おおきい', meaning: 'big', category: 'Adjectives', level: 1, example_sentence: '東京は大きい都市です。' },
  { word: '小さい', reading: 'ちいさい', meaning: 'small', category: 'Adjectives', level: 1, example_sentence: 'この部屋は小さいので、狭いです。' },
];

worksheet.addRows(data);

// Format data rows
for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
  const row = worksheet.getRow(rowNum);
  row.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  row.height = 30;
  
  // Alternate row colors
  if (rowNum % 2 === 0) {
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  }
}

// Freeze header row
worksheet.views = [
  { state: 'frozen', ySplit: 1 }
];

// Save file
const filePath = './vocabulary_template.xlsx';
workbook.xlsx.writeFile(filePath).then(() => {
  console.log(`✅ Excel file created: ${filePath}`);
}).catch((err) => {
  console.error('❌ Error creating Excel file:', err);
  process.exit(1);
});
