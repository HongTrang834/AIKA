const crypto = require('crypto');

// This should match backend JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Simple JWT implementation (header.payload.signature)
function generateJWT(payload) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Add timestamps
  payload.iat = Math.floor(Date.now() / 1000);
  payload.exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(message)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${message}.${signature}`;
}

// Generate admin token
const adminToken = generateJWT({
  userId: 'import-admin',
  role: 'admin'
});

console.log('🔐 Generated Admin JWT Token:');
console.log(adminToken);
console.log('\nUse this token with header: Authorization: Bearer ' + adminToken);
