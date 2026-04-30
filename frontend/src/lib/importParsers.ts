/**
 * Parse Excel file (.xlsx or .xls)
 * Returns array of records with word, reading, meaning fields
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!sheet) {
      throw new Error('No sheet found in Excel file');
    }

    const rows = XLSX.utils.sheet_to_json(sheet);
    
    // Normalize keys to lowercase (in case headers have mixed case)
    const normalizedRows = rows.map((row: any) => {
      const normalized: any = {};
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        normalized[lowerKey] = row[key];
      });
      return normalized;
    });
    
    console.log('Excel parsed rows:', normalizedRows);
    return normalizedRows;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse CSV file with proper handling of quoted values
 * Handles commas inside quoted strings
 * Returns array of records with word, reading, meaning fields
 */
export function parseCSVFile(text: string): any[] {
  const lines = text.trim().split('\n');
  
  // Parse header line with proper quote handling
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    const row: any = {};
    
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line with proper quote handling
 * Example: "name","value with, comma","other" → ["name", "value with, comma", "other"]
 */
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: ""
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Validate record has required fields
 */
export function validateRecord(record: any): { valid: boolean; error?: string } {
  if (!record.word || !record.word.toString().trim()) {
    return { valid: false, error: 'Missing word' };
  }
  if (!record.reading || !record.reading.toString().trim()) {
    return { valid: false, error: 'Missing reading' };
  }
  if (!record.meaning || !record.meaning.toString().trim()) {
    return { valid: false, error: 'Missing meaning' };
  }
  return { valid: true };
}

/**
 * Validate batch of records and create preview format
 */
export function validateRecords(records: any[]): any[] {
  return records.map(record => {
    const validation = validateRecord(record);
    return {
      word: record.word?.toString().trim() || '',
      reading: record.reading?.toString().trim() || '',
      meaning: record.meaning?.toString().trim() || '',
      category: record.category?.toString().trim() || '',
      level: record.level ? parseInt(record.level) : 2,
      example_sentence: record.example_sentence?.toString().trim() || '',
      example_count: record.examples?.length || 0,
      examples: record.examples || [],
      error: validation.valid ? undefined : validation.error,
    };
  });
}

/**
 * Validate grammar record has required fields (pattern, meaning)
 */
export function validateGrammarRecord(record: any): { valid: boolean; error?: string } {
  if (!record.pattern || !record.pattern.toString().trim()) {
    return { valid: false, error: 'Missing pattern' };
  }
  if (!record.meaning || !record.meaning.toString().trim()) {
    return { valid: false, error: 'Missing meaning' };
  }
  return { valid: true };
}

/**
 * Validate batch of grammar records and create preview format
 */
export function validateGrammarRecords(records: any[]): any[] {
  return records.map(record => {
    const validation = validateGrammarRecord(record);
    return {
      title: record.title?.toString().trim() || '',
      pattern: record.pattern?.toString().trim() || '',
      meaning: record.meaning?.toString().trim() || '',
      explanation: record.explanation?.toString().trim() || '',
      category: record.category?.toString().trim() || '',
      level: record.level ? parseInt(record.level) : 2,
      example_sentence: record.example_sentence?.toString().trim() || '',
      example_translation: record.example_translation?.toString().trim() || '',
      error: validation.valid ? undefined : validation.error,
    };
  });
}
