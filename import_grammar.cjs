const fs = require('fs');
const path = require('path');
const http = require('http');

// Use pre-generated admin token (from generate_admin_token.js)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJpbXBvcnQtYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzY0Njg0MTAsImV4cCI6MTc3NzA3MzIxMH0.21pGsnL5uDP1AOd6UtgwRPL9WGWO3TFLIMvUUATTzVg';

// Simple CSV parser for grammar file
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple parse - split by comma
    const values = line.split(',');
    
    if (values.length >= headers.length && values[0].trim()) {
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] ? values[idx].trim() : '';
      });
      records.push(record);
    }
  }
  return records;
}

const csvFile = path.join(__dirname, 'JLPT_N2_Grammar.csv');

// Read CSV
console.log(`📄 Reading ${csvFile}...`);
const fileContent = fs.readFileSync(csvFile, 'utf8');

// Parse CSV
const records = parseCSV(fileContent);
console.log(`📊 Parsed ${records.length} grammar entries`);
console.log('First record:', records[0]);

// Prepare payload
const payload = JSON.stringify({ records });

// Make HTTP POST request to backend
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/admin/grammar/import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
  },
};

console.log(`\n📤 Sending ${records.length} records to http://localhost:5000/admin/grammar/import...`);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n✅ Status: ${res.statusCode}`);
    try {
      const result = JSON.parse(data);
      console.log(`\n📊 Import Result:`);
      console.log(`  ✅ Imported: ${result.imported}`);
      console.log(`  ⏭️  Skipped: ${result.skipped}`);
      console.log(`  📋 Total: ${result.total}`);
      if (result.errors && result.errors.length > 0) {
        console.log(`  ❌ Errors (first 10):`);
        result.errors.slice(0, 10).forEach(e => console.log(`    - ${e}`));
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(payload);
req.end();
