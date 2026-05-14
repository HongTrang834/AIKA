/**
 * RAG Index Builder
 * Đọc CSV file, tạo embeddings, lưu vào grammar_db/embeddings.json
 *
 * Chạy 1 lần (hoặc khi dữ liệu CSV thay đổi):
 *   node scripts/buildRagIndex.js
 *   hoặc: npm run rag:build
 *
 * Python equivalent (nếu convert sang FastAPI sau):
 *   python scripts/build_rag_index.py
 */

import { pipeline } from '@xenova/transformers';
import { parse }    from 'csv-parse/sync';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath }    from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

const CSV_FILES = [
  resolve(ROOT, 'grammar_db/JLPT_N2_Grammar_v2.csv'),
  resolve(ROOT, 'grammar_db/Mimikara_Grammar.csv'),
];

const OUTPUT_PATH = resolve(ROOT, 'grammar_db/embeddings.json');
const MODEL_NAME  = process.env.RAG_EMBEDDING_MODEL
  || 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

// ─────────────────────────────────────────────
//  Step 1: Load & parse CSV files
// ─────────────────────────────────────────────

function loadCSV(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`⚠️  File not found, skipping: ${filePath}`);
    return [];
  }

  console.log(`📄 Reading: ${filePath}`);
  const raw = readFileSync(filePath, 'utf-8');

  // Remove BOM if present
  const content = raw.replace(/^\uFEFF/, '');

  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    console.log(`   → ${records.length} rows loaded`);
    return records;
  } catch (err) {
    console.error(`❌ Failed to parse ${filePath}:`, err.message);
    return [];
  }
}

function normalizeRecord(rec) {
  // Normalize column names (CSV files may have different column names)
  return {
    pattern:            (rec.pattern || rec['パターン'] || '').trim(),
    meaning:            (rec.meaning || rec['意味'] || '').trim(),
    title:              (rec.title   || '').trim(),
    explanation:        (rec.explanation || rec['接続'] || '').trim(),
    category:           (rec.category    || '').trim(),
    example:            (rec.example_sentence || rec['例文'] || '').trim(),
    exampleTranslation: (rec.example_translation || rec['訳'] || '').trim(),
  };
}

function deduplicateByPattern(entries) {
  const seen = new Set();
  return entries.filter(e => {
    if (!e.pattern || seen.has(e.pattern)) return false;
    seen.add(e.pattern);
    return true;
  });
}

// ─────────────────────────────────────────────
//  Step 2: Build search text for embedding
// ─────────────────────────────────────────────

function buildSearchText(entry) {
  // Repeat pattern twice to give it more weight in the embedding
  const parts = [
    entry.pattern,
    entry.pattern,  // weight x2
    entry.meaning,
  ];
  if (entry.example) parts.push(entry.example.slice(0, 80)); // limit example length
  return parts.filter(Boolean).join(' | ');
}

// ─────────────────────────────────────────────
//  Step 3: Compute embeddings
// ─────────────────────────────────────────────

async function embedAll(entries, embedder) {
  const results = [];
  const total   = entries.length;

  console.log(`\n🔢 Computing embeddings for ${total} entries...`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const text  = buildSearchText(entry);

    const output = await embedder(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);

    results.push({ ...entry, embedding: vector });

    // Progress indicator
    const pct = Math.round(((i + 1) / total) * 100);
    process.stdout.write(`\r   Progress: [${i + 1}/${total}] ${pct}%`);
  }

  process.stdout.write('\n');
  return results;
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  RAG Index Builder – AIKA N2 Grammar');
  console.log('═══════════════════════════════════════════\n');

  // 1. Load CSV data
  const rawEntries = CSV_FILES.flatMap(loadCSV);
  if (rawEntries.length === 0) {
    console.error('❌ No data loaded from CSV files. Aborting.');
    process.exit(1);
  }

  const normalized  = rawEntries.map(normalizeRecord);
  const deduplicated = deduplicateByPattern(normalized);
  console.log(`\n📊 Total after deduplication: ${deduplicated.length} entries`);

  // 2. Load embedding model
  console.log(`\n🤖 Loading model: ${MODEL_NAME}`);
  console.log('   (First run will download ~120MB – cached afterwards)\n');

  const embedder = await pipeline('feature-extraction', MODEL_NAME, {
    quantized: true,
    progress_callback: (info) => {
      if (info.status === 'downloading') {
        const pct = info.total
          ? Math.round((info.loaded / info.total) * 100)
          : '?';
        process.stdout.write(`\r   Downloading ${info.file}: ${pct}%  `);
      }
    },
  });
  console.log('\n✅ Model loaded\n');

  // 3. Compute embeddings
  const indexed = await embedAll(deduplicated, embedder);

  // 4. Save to JSON
  const output = {
    model:     MODEL_NAME,
    createdAt: new Date().toISOString(),
    totalEntries: indexed.length,
    entries:   indexed,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

  const fileSizeKB = Math.round(
    Buffer.byteLength(JSON.stringify(output)) / 1024
  );

  console.log('\n═══════════════════════════════════════════');
  console.log(`✅ Index built successfully!`);
  console.log(`   Entries : ${indexed.length}`);
  console.log(`   Output  : ${OUTPUT_PATH}`);
  console.log(`   Size    : ~${fileSizeKB} KB`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
