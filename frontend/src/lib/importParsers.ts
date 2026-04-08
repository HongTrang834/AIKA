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
 * Parse CSV file
 * Returns array of records with word, reading, meaning fields
 */
export function parseCSVFile(text: string): any[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    data.push(row);
  }

  return data;
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
 * Validate batch of records
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
      error: validation.valid ? undefined : validation.error,
    };
  });
}
