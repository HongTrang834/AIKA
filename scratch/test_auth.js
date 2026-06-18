import pool from '../backend/db.js';
import { runMigrations } from '../backend/migrations.js';
import bcrypt from 'bcryptjs';

async function testE2EAuth() {
  console.log('🏁 Starting E2E Auth Test...');
  
  // 1. Run migrations first to ensure columns exist
  await runMigrations();

  const testEmail = 'test_verify_user_999@aika.com';
  const testUsername = 'test_verify_user_999';
  const testPassword = 'old_password_123';
  const testNewPassword = 'new_password_123';

  try {
    // Clean up any old test users
    await pool.query('DELETE FROM users WHERE email = $1 OR username = $2', [testEmail, testUsername]);
    console.log('🧹 Cleaned up old test users.');

    // 2. Register
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const verificationCode = '987654';
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const regResult = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name, role, is_verified, verification_code, verification_expires) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, is_verified, verification_code',
      [testUsername, testEmail, hashedPassword, 'Test User', 'student', false, verificationCode, verificationExpires]
    );

    const user = regResult.rows[0];
    console.log('📝 Registered test user:', user);
    if (user.is_verified !== false || user.verification_code !== '987654') {
      throw new Error('Registration fields incorrect');
    }

    // 3. Login attempt before verification (Should be blocked)
    const userCheck = await pool.query('SELECT is_verified FROM users WHERE email = $1', [testEmail]);
    if (userCheck.rows[0].is_verified === true) {
      throw new Error('User should not be verified yet');
    }
    console.log('🛡️ Login block check passed: user is not verified.');

    // 4. Verify Email
    const verifyResult = await pool.query(
      'UPDATE users SET is_verified = true, verification_code = NULL, verification_expires = NULL WHERE email = $1 AND verification_code = $2 RETURNING is_verified, verification_code',
      [testEmail, '987654']
    );

    const verifiedUser = verifyResult.rows[0];
    console.log('✅ Verified email:', verifiedUser);
    if (verifiedUser.is_verified !== true || verifiedUser.verification_code !== null) {
      throw new Error('Email verification failed');
    }

    // 5. Forgot Password
    const resetCode = '123456';
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      'UPDATE users SET reset_code = $1, reset_expires = $2 WHERE email = $3',
      [resetCode, resetExpires, testEmail]
    );
    console.log('🔑 Forgot Password requested, reset code saved.');

    // 6. Reset Password
    const resetUserCheck = await pool.query('SELECT reset_code FROM users WHERE email = $1', [testEmail]);
    if (resetUserCheck.rows[0].reset_code !== '123456') {
      throw new Error('Reset code not matches');
    }

    const newHashedPassword = await bcrypt.hash(testNewPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_code = NULL, reset_expires = NULL WHERE email = $2 AND reset_code = $3',
      [newHashedPassword, testEmail, '123456']
    );
    console.log('🔄 Password reset completed successfully.');

    // 7. Verify new password works
    const finalUser = await pool.query('SELECT password_hash, reset_code FROM users WHERE email = $1', [testEmail]);
    const passMatch = await bcrypt.compare(testNewPassword, finalUser.rows[0].password_hash);
    if (!passMatch || finalUser.rows[0].reset_code !== null) {
      throw new Error('New password verification or reset code cleanup failed');
    }
    console.log('🎉 E2E Auth Test completed successfully! All checks passed.');
  } catch (error) {
    console.error('❌ E2E Auth Test failed:', error);
  } finally {
    // Clean up test user
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await pool.end();
  }
}

testE2EAuth();
