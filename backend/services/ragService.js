/**
 * RAG Service – Retrieval-Augmented Generation for N2 Grammar
 *
 * Interface (Python-ready):
 *   retrieve(query: string, topK?: number) → Promise<GrammarEntry[]>
 *   formatContext(entries: GrammarEntry[])  → string
 *
 * To convert to Python FastAPI later:
 *   POST /rag/retrieve  { query, top_k } → { entries: GrammarEntry[] }
 *   Node.js AIService chỉ cần đổi import → fetch() call
 */

import { pipeline } from '@xenova/transformers';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INDEX_PATH   = resolve(__dirname, '../../grammar_db/embeddings.json');
const MODEL_NAME   = process.env.RAG_EMBEDDING_MODEL
  || 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const DEFAULT_TOP_K = parseInt(process.env.RAG_TOP_K || '3', 10);

class RAGService {
  constructor() {
    this.entries    = [];   // { pattern, meaning, explanation, example, exampleTranslation, embedding }
    this.embedder   = null; // @xenova/transformers pipeline (lazy-loaded)
    this.ready      = false;
    this._initPromise = null;
  }

  // ─────────────────────────────────────────────
  //  Public API  (mirrors future Python endpoint)
  // ─────────────────────────────────────────────

  /**
   * Initialize: load pre-built index from JSON file.
   * Must be called once before retrieve().
   */
  async initialize() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._doInit();
    return this._initPromise;
  }

  /**
   * Retrieve top-K grammar entries most relevant to query.
   * @param {string} query  – user message (Japanese / Vietnamese / mixed)
   * @param {number} topK   – number of results (default: RAG_TOP_K env or 3)
   * @returns {Promise<Array>} ranked grammar entries
   */
  async retrieve(query, topK = DEFAULT_TOP_K) {
    await this.initialize();

    if (!this.ready || this.entries.length === 0) {
      console.warn('⚠️ [RAG] Index not ready – returning empty context');
      return [];
    }

    const queryVec = await this._embed(query);
    const scored   = this.entries.map(entry => {
      let score = this._cosine(queryVec, entry.embedding);

      // --- Keyword Boosting ---
      // If the pattern (minus the ~ symbol) exists in the query, boost the score
      const cleanPattern = entry.pattern.replace(/[～~]/g, '').trim();
      if (cleanPattern && query.includes(cleanPattern)) {
        score += 0.2; // Significant boost for exact keyword match
      }
      
      return { ...entry, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK);

    console.log(`🔍 [RAG] Query: "${query.slice(0, 40)}..." → top hits:`);
    top.forEach((e, i) =>
      console.log(`   ${i + 1}. ${e.pattern} (score: ${e.score.toFixed(3)})`));

    return top.map(({ pattern, meaning, explanation, example, exampleTranslation, score }) => ({
      pattern, meaning, explanation, example, exampleTranslation, score,
    }));
  }

  /**
   * Format retrieved entries into a string for system prompt injection.
   * @param {Array} entries – result from retrieve()
   * @returns {string}
   */
  formatContext(entries) {
    if (!entries || entries.length === 0) return '';

    const lines = entries.map((e, i) => {
      const parts = [
        `【${i + 1}】パターン: ${e.pattern}`,
        `    意味: ${e.meaning}`,
      ];
      if (e.explanation) parts.push(`    接続: ${e.explanation}`);
      if (e.example)     parts.push(`    例文: ${e.example}`);
      if (e.exampleTranslation) parts.push(`    訳:   ${e.exampleTranslation}`);
      return parts.join('\n');
    });

    return [
      '━━━ 関連するN2文法 (RAG参照) ━━━',
      ...lines,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');
  }

  // ─────────────────────────────────────────────
  //  Private helpers
  // ─────────────────────────────────────────────

  async _doInit() {
    if (!existsSync(INDEX_PATH)) {
      console.error(`❌ [RAG] Index file not found: ${INDEX_PATH}`);
      console.error('   Run: npm run rag:build');
      this.ready = false;
      return;
    }

    try {
      console.log('📂 [RAG] Loading index from', INDEX_PATH);
      const raw  = readFileSync(INDEX_PATH, 'utf-8');
      const data = JSON.parse(raw);

      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid index format – missing entries[]');
      }

      this.entries = data.entries;
      console.log(`✅ [RAG] Loaded ${this.entries.length} grammar entries (model: ${data.model})`);

      // Lazy-load embedder (used at query time)
      console.log('🔄 [RAG] Loading embedding model (first run may take a moment)...');
      this.embedder = await pipeline('feature-extraction', MODEL_NAME, {
        quantized: true,   // smaller, faster
        progress_callback: (info) => {
          if (info.status === 'downloading') {
            process.stdout.write(`\r   Downloading ${info.file} – ${Math.round((info.loaded / info.total) * 100)}%`);
          }
        },
      });
      console.log('\n✅ [RAG] Embedding model ready');
      this.ready = true;
    } catch (err) {
      console.error('❌ [RAG] Failed to initialize:', err.message);
      this.ready = false;
    }
  }

  async _embed(text) {
    const output = await this.embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  _cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na  += a[i] * a[i];
      nb  += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
}

// Singleton – shared across the server process
export default new RAGService();
