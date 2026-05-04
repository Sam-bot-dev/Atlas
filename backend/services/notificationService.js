const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Escape HTML to prevent XSS in email bodies
const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function sendEmailAlert(to, subject, body) {
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Atlas AI <onboarding@resend.dev>',
        to: [to],
        subject: escapeHtml(subject),
        html: `<strong>${escapeHtml(subject)}</strong><p>${escapeHtml(body)}</p>`,
      });
      return true;
    } catch (error) {
      console.error('[NOTIFICATION: Email] Failed:', error);
    }
  }
  
  // Fallback / Integration point for SendGrid, AWS SES, etc.
  console.log(`[NOTIFICATION: Email] To: ${to} | Subject: ${subject}`);
  return true;
}

async function sendWhatsAppAlert(phone, message) {
  // Integration point for Twilio, Meta API, etc.
  console.log(`[NOTIFICATION: WhatsApp] To: ${phone} | Message: ${message}`);
  return true;
}

module.exports = {
  sendEmailAlert,
  sendWhatsAppAlert,
};
