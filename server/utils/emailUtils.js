const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const brandName = 'Thukilinam';
const fromAddress = process.env.FROM_EMAIL || process.env.SMTP_USER;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const ownerEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.OWNER_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USER;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatPrice = (value = 0) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const titleCase = (value = '') => String(value)
  .replace(/_/g, ' ')
  .replace(/\b\w/g, char => char.toUpperCase());

const courierLabel = (value = '') => ({
  st_courier: 'ST Courier',
  professional_courier: 'Professional Courier',
  other: 'Other Courier'
}[value] || titleCase(value));

const parseMaybeJson = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const formatAddress = (address) => {
  const addr = parseMaybeJson(address);
  const parts = [
    addr.full_name,
    addr.phone,
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.pincode,
    addr.country
  ].filter(Boolean);

  return parts.length ? parts.map(escapeHtml).join('<br>') : 'Address not available';
};

const buildOrderItemsRows = (items = []) => {
  if (!Array.isArray(items) || !items.length) {
    return '<tr><td colspan="4" style="padding:14px;color:#746a81;">Order items are not available.</td></tr>';
  }

  return items.map(item => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const variantParts = [item.variant_size, item.variant_color].filter(Boolean).join(' / ');

    return `
      <tr>
        <td style="padding:14px;border-top:1px solid #eee8f5;">
          <strong>${escapeHtml(item.product_name || 'Product')}</strong>
          ${variantParts ? `<div style="color:#746a81;font-size:12px;margin-top:3px;">${escapeHtml(variantParts)}</div>` : ''}
        </td>
        <td align="center" style="padding:14px;border-top:1px solid #eee8f5;">${quantity}</td>
        <td align="right" style="padding:14px;border-top:1px solid #eee8f5;">${formatPrice(price)}</td>
        <td align="right" style="padding:14px;border-top:1px solid #eee8f5;font-weight:700;">${formatPrice(price * quantity)}</td>
      </tr>
    `;
  }).join('');
};

const orderDetailsBlock = (order = {}) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#fbf9fd;border:1px solid #eee8f5;border-radius:12px;">
    <tr><td style="padding:16px;color:#746a81;">Order total</td><td align="right" style="padding:16px;font-weight:700;">${formatPrice(order.total)}</td></tr>
    ${order.payment_method ? `<tr><td style="padding:0 16px 16px;color:#746a81;">Payment</td><td align="right" style="padding:0 16px 16px;font-weight:700;text-transform:uppercase;">${escapeHtml(order.payment_method)}</td></tr>` : ''}
    <tr><td style="padding:0 16px 16px;color:#746a81;">Status</td><td align="right" style="padding:0 16px 16px;font-weight:700;">${escapeHtml(titleCase(order.status || 'processing'))}</td></tr>
    ${order.courier ? `<tr><td style="padding:0 16px 16px;color:#746a81;">Courier</td><td align="right" style="padding:0 16px 16px;font-weight:700;">${escapeHtml(courierLabel(order.courier))}</td></tr>` : ''}
    ${order.tracking_number ? `<tr><td style="padding:0 16px 16px;color:#746a81;">Tracking</td><td align="right" style="padding:0 16px 16px;font-weight:700;">${escapeHtml(order.tracking_number)}</td></tr>` : ''}
  </table>
  <h2 style="margin:24px 0 10px;font-size:18px;color:#151326;">Order details</h2>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;border:1px solid #eee8f5;border-radius:12px;overflow:hidden;">
    <tr style="background:#fbf9fd;color:#746a81;font-size:12px;text-transform:uppercase;">
      <th align="left" style="padding:12px;">Item</th>
      <th align="center" style="padding:12px;">Qty</th>
      <th align="right" style="padding:12px;">Price</th>
      <th align="right" style="padding:12px;">Total</th>
    </tr>
    ${buildOrderItemsRows(order.items)}
  </table>
  <h2 style="margin:24px 0 10px;font-size:18px;color:#151326;">Shipping address</h2>
  <p style="margin:0 0 14px;">${formatAddress(order.shipping_address)}</p>
`;

const emailLayout = ({ eyebrow, title, body, ctaLabel, ctaUrl, footerNote }) => `
  <div style="margin:0;padding:0;background:#f7f4fc;font-family:Arial,Helvetica,sans-serif;color:#151326;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4fc;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e7dfef;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#151326;color:#ffffff;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#cdb8f0;">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:#ffffff;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#312a3d;font-size:15px;line-height:1.7;">
                ${body}
                ${ctaLabel && ctaUrl ? `
                  <div style="margin:30px 0;">
                    <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 22px;background:#6a38b6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">${escapeHtml(ctaLabel)}</a>
                  </div>
                ` : ''}
                ${footerNote ? `<p style="margin:24px 0 0;color:#746a81;font-size:13px;">${escapeHtml(footerNote)}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#fbf9fd;border-top:1px solid #eee8f5;color:#8a8097;font-size:12px;">
                ${brandName} Boutique<br>
                This is an automated email. Please do not share secure links or order details with anyone.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const sendResetEmail = async (to, name, resetLink, options = {}) => {
  const accountLabel = options.accountLabel || 'customer account';

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `Reset your ${brandName} password`,
    html: emailLayout({
      eyebrow: `${brandName} account security`,
      title: 'Password reset request',
      body: `
        <p style="margin:0 0 14px;">Hello ${escapeHtml(name || 'there')},</p>
        <p style="margin:0 0 14px;">We received a request to reset the password for your ${escapeHtml(accountLabel)}.</p>
        <p style="margin:0;">Use the secure button below to choose a new password. The link expires in 1 hour and can be used only once.</p>
      `,
      ctaLabel: 'Reset Password',
      ctaUrl: resetLink,
      footerNote: "If you didn't request this, you can safely ignore this email. Your password will not change."
    })
  });
};

const sendOrderConfirmationEmail = async (to, name, order) => {
  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `Order received #${order.order_number} - ${brandName}`,
    html: emailLayout({
      eyebrow: 'Order received',
      title: `Thank you, ${name || 'Customer'}`,
      body: `
        <p style="margin:0 0 14px;">Your order <strong>#${escapeHtml(order.order_number)}</strong> has been received and is now being prepared by our team.</p>
        ${orderDetailsBlock(order)}
        <p style="margin:0;">We will email you again when the order status changes.</p>
      `,
      ctaLabel: 'Track Order',
      ctaUrl: `${clientUrl}/track`
    })
  });
};

const sendNewOrderNotificationEmail = async (order) => {
  if (!ownerEmail) return;

  await transporter.sendMail({
    from: fromAddress,
    to: ownerEmail,
    subject: `New order #${order.order_number} - ${brandName}`,
    html: emailLayout({
      eyebrow: 'New order notification',
      title: `New order #${order.order_number}`,
      body: `
        <p style="margin:0 0 14px;">A new order has been confirmed by ${escapeHtml(order.customer_name || 'a customer')}.</p>
        ${order.customer_email ? `<p style="margin:0 0 14px;">Customer email: <strong>${escapeHtml(order.customer_email)}</strong></p>` : ''}
        ${orderDetailsBlock(order)}
      `,
      ctaLabel: 'Open Admin Orders',
      ctaUrl: `${process.env.ADMIN_URL || 'http://localhost:5174'}/orders`
    })
  });
};

const sendOrderStatusEmail = async (to, name, order) => {
  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `Order #${order.order_number} is ${titleCase(order.status)} - ${brandName}`,
    html: emailLayout({
      eyebrow: 'Order status update',
      title: `Your order is ${titleCase(order.status)}`,
      body: `
        <p style="margin:0 0 14px;">Hello ${escapeHtml(name || 'there')},</p>
        <p style="margin:0 0 14px;">The status for order <strong>#${escapeHtml(order.order_number)}</strong> changed to <strong>${escapeHtml(titleCase(order.status))}</strong>.</p>
        ${orderDetailsBlock(order)}
        <p style="margin:0;">You can use the tracking page for the latest delivery information.</p>
      `,
      ctaLabel: 'View Tracking',
      ctaUrl: `${clientUrl}/track?order_number=${encodeURIComponent(order.order_number || '')}`
    })
  });
};

const sendWelcomeEmail = async (to, name) => {
  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `Welcome to ${brandName}`,
    html: emailLayout({
      eyebrow: `${brandName} account`,
      title: `Welcome, ${name || 'there'}`,
      body: `
        <p style="margin:0 0 14px;">Your ${brandName} account has been created successfully.</p>
        <p style="margin:0;">You can now sign in, manage your profile, track orders, and save your favourite pieces.</p>
      `,
      ctaLabel: 'Visit Store',
      ctaUrl: clientUrl
    })
  });
};

const sendNewUserNotificationEmail = async (user) => {
  if (!ownerEmail) return;

  await transporter.sendMail({
    from: fromAddress,
    to: ownerEmail,
    subject: `New customer registered - ${brandName}`,
    html: emailLayout({
      eyebrow: 'New customer',
      title: user.name || 'New customer registered',
      body: `
        <p style="margin:0 0 14px;">A new customer account was created.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#fbf9fd;border:1px solid #eee8f5;border-radius:12px;">
          <tr><td style="padding:16px;color:#746a81;">Name</td><td align="right" style="padding:16px;font-weight:700;">${escapeHtml(user.name || 'Customer')}</td></tr>
          <tr><td style="padding:0 16px 16px;color:#746a81;">Email</td><td align="right" style="padding:0 16px 16px;font-weight:700;">${escapeHtml(user.email || '')}</td></tr>
          ${user.phone ? `<tr><td style="padding:0 16px 16px;color:#746a81;">Phone</td><td align="right" style="padding:0 16px 16px;font-weight:700;">${escapeHtml(user.phone)}</td></tr>` : ''}
        </table>
      `,
      ctaLabel: 'Open Customers',
      ctaUrl: `${process.env.ADMIN_URL || 'http://localhost:5174'}/customers`
    })
  });
};

module.exports = {
  sendResetEmail,
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
  sendOrderStatusEmail,
  sendWelcomeEmail,
  sendNewUserNotificationEmail
};
