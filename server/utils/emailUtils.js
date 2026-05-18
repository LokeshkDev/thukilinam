const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const sendResetEmail = async (to, name, resetLink) => {
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: 'Reset Your Thukilinam Password',
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width:600px; margin:0 auto; padding:40px; background:#0F172A; color:#fff; border-radius:16px;">
        <h2 style="background:linear-gradient(135deg,#6A38B6,#3B82F6);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">Thukilinam</h2>
        <h3 style="color:#fff;">Hello, ${name}!</h3>
        <p style="color:#94a3b8;">We received a request to reset your password. Click the button below to proceed.</p>
        <a href="${resetLink}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#6A38B6,#3B82F6);color:#fff;text-decoration:none;border-radius:50px;font-weight:600;">Reset Password</a>
        <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        <hr style="border-color:#1e293b;margin:24px 0;">
        <p style="color:#475569;font-size:12px;">© 2025 Thukilinam Boutique. All rights reserved.</p>
      </div>
    `
  });
};

const sendOrderConfirmationEmail = async (to, name, order) => {
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: `Order Confirmed! #${order.order_number} — Thukilinam`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width:600px; margin:0 auto; padding:40px; background:#0F172A; color:#fff; border-radius:16px;">
        <h2 style="background:linear-gradient(135deg,#6A38B6,#3B82F6);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">Thukilinam</h2>
        <h3 style="color:#fff;">Thank you, ${name}! 🎉</h3>
        <p style="color:#94a3b8;">Your order <strong style="color:#fff;">#${order.order_number}</strong> has been placed successfully.</p>
        <div style="background:#1e293b;border-radius:12px;padding:24px;margin:20px 0;">
          <p style="color:#94a3b8;margin:0;"><strong style="color:#fff;">Total:</strong> ₹${order.total}</p>
          <p style="color:#94a3b8;margin:8px 0 0;"><strong style="color:#fff;">Payment:</strong> ${order.payment_method.toUpperCase()}</p>
          <p style="color:#94a3b8;margin:8px 0 0;"><strong style="color:#fff;">Status:</strong> ${order.status}</p>
        </div>
        <p style="color:#64748b;font-size:13px;">You can track your order in your dashboard.</p>
        <hr style="border-color:#1e293b;margin:24px 0;">
        <p style="color:#475569;font-size:12px;">© 2025 Thukilinam Boutique. All rights reserved.</p>
      </div>
    `
  });
};

module.exports = { sendResetEmail, sendOrderConfirmationEmail };
