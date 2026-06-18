import { sendPasswordResetEmail } from '../backend/services/mail.js';

async function testMail() {
  console.log('Testing sendPasswordResetEmail...');
  const start = Date.now();
  await sendPasswordResetEmail('test@example.com', 'testuser', '123456');
  console.log(`Finished in ${Date.now() - start}ms`);
  process.exit(0);
}

testMail();
