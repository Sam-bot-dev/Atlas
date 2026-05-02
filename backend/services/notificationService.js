const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendEmailAlert(to, subject, body) {
  if (resend) {
    try {
      await resend.emails.send({
        from: 'Atlas AI <alerts@atlas.ai>',
        to: [to],
        subject: subject,
        html: `<strong>${subject}</strong><p>${body}</p>`,
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
