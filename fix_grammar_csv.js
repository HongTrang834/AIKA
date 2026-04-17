import fs from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import readline from 'readline';
import path from 'path';

const inputFile = 'JLPT_N2_Grammar.csv';
const outputFile = 'JLPT_N2_Grammar_FIXED.csv';

// Read the file and parse
const fileContent = fs.readFileSync(inputFile, 'utf8');
const lines = fileContent.split('\n').filter(l => l.trim());

console.log(`📄 Reading ${inputFile}...`);
console.log(`📊 Found ${lines.length - 1} grammar entries (excluding header)`);

// Parse header
const header = lines[0].split(',').map(h => h.trim());
console.log('📋 Header:', header);

// New header with level
const newHeader = 'pattern,meaning,title,explanation,category,level,example_sentence,example_translation';

const results = [];
let fixed = 0;
let errors = 0;

// Parse each line
for (let i = 1; i < lines.length; i++) {
  try {
    const line = lines[i];
    
    // Handle CSV with quotes
    const parts = [];
    let current = '';
    let inQuote = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuote && nextChar === '"') {
          current += '"';
          j++; // Skip next quote
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());
    
    // Map to new format
    const pattern = parts[0]?.replace(/^"|"$/g, '').trim() || '';
    const meaning = parts[1]?.replace(/^"|"$/g, '').trim() || '';
    const title = parts[2]?.replace(/^"|"$/g, '').trim() || '';
    const explanation = parts[3]?.replace(/^"|"$/g, '').trim() || '';
    const category = parts[4]?.replace(/^"|"$/g, '').trim() || 'jlpt_grammar';
    let exampleSentence = parts[5]?.replace(/^"|"$/g, '').trim() || '';
    
    // Split example_sentence and example_translation
    // Typically: Japanese text followed by period and then Vietnamese text
    let jpSentence = '';
    let vnTranslation = '';
    
    if (exampleSentence) {
      // Try to split at: "。" (Japanese period) followed by space
      const match = exampleSentence.match(/^(.+?)[。\.]\s+(.+)$/);
      if (match) {
        jpSentence = match[1] + '。';
        vnTranslation = match[2];
      } else {
        // Fallback: try to find Vietnamese text (starts with capital letter in Vietnamese)
        const parts2 = exampleSentence.split(/(\s+(?=[A-ZÀ-ỸƯ]|[^。\.]*$))/);
        if (parts2.length > 1) {
          jpSentence = parts2[0];
          vnTranslation = parts2.slice(1).join('').trim();
        } else {
          jpSentence = exampleSentence;
          vnTranslation = '';
        }
      }
    }
    
    // Validate required fields
    if (!pattern || !meaning) {
      console.error(`❌ Row ${i + 1}: Missing required fields (pattern="${pattern}", meaning="${meaning}")`);
      errors++;
      continue;
    }
    
    // Create new row
    const row = [
      `"${pattern.replace(/"/g, '""')}"`,
      `"${meaning.replace(/"/g, '""')}"`,
      `"${title.replace(/"/g, '""')}"`,
      `"${explanation.replace(/"/g, '""')}"`,
      category,
      2, // Default level
      `"${jpSentence.replace(/"/g, '""')}"`,
      `"${vnTranslation.replace(/"/g, '""')}"`
    ].join(',');
    
    results.push(row);
    fixed++;
    
    if (i % 50 === 0) {
      console.log(`✅ Processed ${fixed} entries...`);
    }
  } catch (err) {
    console.error(`❌ Error parsing row ${i + 1}:`, err.message);
    errors++;
  }
}

// Write output
const output = [newHeader, ...results].join('\n');
fs.writeFileSync(outputFile, output, 'utf8');

console.log(`\n📊 Summary:`);
console.log(`✅ Fixed: ${fixed}`);
console.log(`❌ Errors: ${errors}`);
console.log(`📁 Output: ${outputFile}`);
console.log(`\n✨ Done! Use the new file to import.`);
