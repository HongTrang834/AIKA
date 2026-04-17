import fs from 'fs';
import fetch from 'node-fetch';
import Papa from 'papaparse';

const csvFile = 'JLPT_N2_Grammar_FIXED.csv';
const apiUrl = 'http://localhost:5000/api/admin/grammar/import';

// Read CSV
console.log(`📄 Reading ${csvFile}...`);
const fileContent = fs.readFileSync(csvFile, 'utf8');

// Parse CSV
Papa.parse(fileContent, {
  header: true,
  complete: async (results) => {
    console.log(`📊 Parsed ${results.data.length - 1} grammar entries`);
    
    // Filter out empty rows
    const records = results.data.filter(r => r.pattern && r.meaning);
    
    console.log(`📤 Sending ${records.length} records to API...`);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin' // Adjust as needed
        },
        body: JSON.stringify({ records })
      });
      
      const result = await response.json();
      
      console.log('\n📊 Import Result:');
      console.log(`✅ Imported: ${result.imported}`);
      console.log(`⏭️  Skipped: ${result.skipped}`);
      console.log(`📋 Total: ${result.total}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(err => console.log(`  - ${err}`));
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  },
  error: (error) => {
    console.error('❌ CSV Parse Error:', error);
  }
});
