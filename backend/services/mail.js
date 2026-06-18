import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter if SMTP settings exist
let transporter = null;
const isSmtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

if (isSmtpConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000,   // 5 seconds
      socketTimeout: 5000,     // 5 seconds
    });
    console.log('📬 Mail Service: SMTP Transporter configured successfully');
  } catch (error) {
    console.error('❌ Mail Service: SMTP Configuration error:', error.message);
  }
} else {
  console.log('ℹ️ Mail Service: SMTP is not configured. Running in Developer Fallback Mode (printing emails to console).');
}

const sendMail = async ({ to, subject, html, text }) => {
  const from = process.env.SMTP_FROM || '"AIKa Platform" <no-reply@aika.com>';
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`📬 Email sent to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to} via SMTP:`, error.message);
      logToConsole({ to, subject, text });
      return false;
    }
  } else {
    logToConsole({ to, subject, text });
    return true;
  }
};

const logToConsole = ({ to, subject, text }) => {
  console.log('\n==================================================');
  console.log('📬 [DEVELOPER MAIL BOX FALLBACK]');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('--------------------------------------------------');
  console.log(text);
  console.log('==================================================\n');
};

/**
 * Sends a 6-digit verification code to the user's email for registration.
 */
export const sendVerificationEmail = async (email, username, code) => {
  const subject = '[AIKa] Xác minh địa chỉ Email đăng ký tài khoản';
  const text = `Xin chào ${username},\n\nCảm ơn bạn đã đăng ký tài khoản tại ứng dụng học tiếng Nhật AIKa.\nMã xác minh 6 số của bạn là: ${code}\n\nMã xác minh này có hiệu lực trong vòng 15 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\n\nTrân trọng,\nĐội ngũ AIKa`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Chào mừng bạn đến với AIKa!</h2>
      <p>Xin chào <strong>${username}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản trên nền tảng học tiếng Nhật N2 tích hợp AI - <strong>AIKa</strong>.</p>
      <p>Để hoàn tất đăng ký, vui lòng sử dụng mã xác minh 6 chữ số dưới đây:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; background-color: #e0e7ff; padding: 10px 20px; border-radius: 8px; border: 2px dashed #4f46e5;">
          ${code}
        </span>
      </div>
      <p style="color: #ef4444; font-size: 14px;">Mã xác minh có hiệu lực trong vòng 15 phút. Vui lòng không cung cấp mã này cho người khác.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Đây là email tự động từ hệ thống AIKa, vui lòng không trả lời email này.</p>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};

/**
 * Sends a 6-digit password reset code to the user's email.
 */
export const sendPasswordResetEmail = async (email, username, code) => {
  const subject = '[AIKa] Yêu cầu khôi phục mật khẩu tài khoản';
  const text = `Xin chào ${username},\n\nHệ thống AIKa nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.\nMã khôi phục mật khẩu 6 số của bạn là: ${code}\n\nMã này có hiệu lực trong vòng 15 phút. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và bảo mật mật khẩu của mình.\n\nTrân trọng,\nĐội ngũ AIKa`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Khôi phục mật khẩu tài khoản</h2>
      <p>Xin chào <strong>${username}</strong>,</p>
      <p>Chúng tôi nhận được yêu cầu cài đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này trên hệ thống <strong>AIKa</strong>.</p>
      <p>Vui lòng nhập mã xác minh gồm 6 chữ số dưới đây tại ứng dụng để đặt mật khẩu mới:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #dc2626; background-color: #fee2e2; padding: 10px 20px; border-radius: 8px; border: 2px dashed #dc2626;">
          ${code}
        </span>
      </div>
      <p style="color: #ef4444; font-size: 14px;">Mã xác minh có hiệu lực trong vòng 15 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Đây là email tự động từ hệ thống AIKa, vui lòng không trả lời email này.</p>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};
