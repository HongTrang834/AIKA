import fs from 'fs';

const inputFile = 'JLPT_N2_Grammar.csv';
const outputFile = 'JLPT_N2_Grammar_IMPORT.csv';

console.log(`📄 Reading original file: ${inputFile}`);
const content = fs.readFileSync(inputFile, 'utf8');
const lines = content.split('\n').filter(l => l.trim());

console.log(`📊 Total lines: ${lines.length}`);

// Helper: escape CSV field
function escapeCSV(field) {
  if (!field) return '""';
  const str = String(field).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

// Parse original CSV with quotes
function parseOriginalLine(line) {
  const fields = [];
  let current = '';
  let inQuote = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];
    
    if (char === '"') {
      if (inQuote && nextChar === '"') {
        current += '"';
        j++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

// Build CSV output
const output = [];
output.push('pattern,meaning,title,explanation,category,example_sentence,example_translation');

let imported = 0;
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  try {
    const fields = parseOriginalLine(lines[i]);
    
    if (fields.length < 7) {
      console.log(`⏭️  Row ${i + 1}: Not enough fields (${fields.length})`);
      skipped++;
      continue;
    }
    
    const pattern = fields[0]?.trim() || '';
    const meaning = fields[1]?.trim() || '';
    const title = fields[2]?.trim() || '';
    const explanation = fields[3]?.trim() || '';
    const category = fields[4]?.trim() || 'jlpt_grammar';
    
    // Important: Merge fields 5+ as example data
    const exampleData = fields.slice(5).join(',').trim();
    
    // Split example_sentence and example_translation
    // Pattern: Japanese text (ends with 。) + space/newline + Vietnamese text
    let jpSentence = '';
    let vnTranslation = '';
    
    if (exampleData) {
      // Try to find the split point
      const match = exampleData.match(/^(.+?)(。|\.)\s+(.+)$/s);
      if (match) {
        jpSentence = match[1] + match[2];
        vnTranslation = match[3];
      } else {
        // Fallback: try pattern with Vietnamese capital letter
        const parts = exampleData.split(/(\s+(?=[A-ZÀ-ỲƯ]))/);
        if (parts.length > 2) {
          jpSentence = parts[0];
          vnTranslation = parts.slice(1).join('').trim();
        } else {
          jpSentence = exampleData;
          vnTranslation = '';
        }
      }
    }
    
    // Validate
    if (!pattern || !meaning) {
      console.log(`⏭️  Row ${i + 1}: Missing pattern or meaning`);
      skipped++;
      continue;
    }
    
    // Build CSV row
    const row = [
      escapeCSV(pattern),
      escapeCSV(meaning),
      escapeCSV(title),
      escapeCSV(explanation),
      escapeCSV(category),
      escapeCSV(jpSentence),
      escapeCSV(vnTranslation)
    ].join(',');
    
    output.push(row);
    imported++;
    
    if (i % 50 === 0) {
      console.log(`✅ Processing row ${i}...`);
    }
  } catch (err) {
    console.error(`❌ Error row ${i + 1}:`, err.message);
    skipped++;
  }
}

// Write output
fs.writeFileSync(outputFile, output.join('\n'), 'utf8');

console.log(`\n📊 Summary:`);
console.log(`✅ Imported: ${imported}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`📁 Output: ${outputFile}`);
console.log(`\n✨ Done! File ready for import.`);

// Show first few rows
console.log(`\n📋 First 3 data rows:`);
output.slice(1, 4).forEach((row, idx) => {
  console.log(`Row ${idx + 1}:`, row.substring(0, 80) + '...');
});
