/**
 * Notification Service
 * 
 * Handles Email (SendGrid) and WhatsApp (Twilio) notifications
 * Integrates with task automation for alerts and follow-ups
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE;

/**
 * Send email notification
 * @param {string} toEmail - recipient email
 * @param {string} subject - email subject
 * @param {string} body - email body (HTML)
 * @param {Object} business - business context for branding
 */
async function sendEmailNotification(toEmail, subject, body, business = {}) {
  if (!SENDGRID_API_KEY) {
    console.warn(
      'SENDGRID_API_KEY not configured. Email notification skipped.',
    );
    return { sent: false, reason: 'SendGrid not configured' };
  }

  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Atlas</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0;">Business Decision Assistant</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>${business.name || 'Atlas'}</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            ${body}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            This is an automated notification from Atlas. 
            ${business.name ? `Manage preferences in your ${business.name} settings.` : ''}
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
            subject,
          },
        ],
        from: {
          email: 'noreply@atlasbiz.app',
          name: 'Atlas',
        },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    return { sent: true, method: 'email', recipient: toEmail };
  } catch (error) {
    console.error('Email notification error:', error);
    return { sent: false, reason: error.message };
  }
}

/**
 * Send WhatsApp notification via Twilio
 * @param {string} toPhone - recipient phone (E.164 format: +91...)
 * @param {string} message - message body (max 160 chars recommended)
 * @param {Object} business - business context
 */
async function sendWhatsAppNotification(toPhone, message, business = {}) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    console.warn(
      'Twilio credentials not configured. WhatsApp notification skipped.',
    );
    return { sent: false, reason: 'Twilio not configured' };
  }

  try {
    const auth = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
    ).toString('base64');

    const messageBody = `
*Atlas Alert* 🎯

${message}

---
Atlas Business Assistant
`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${TWILIO_PHONE}`,
          To: `whatsapp:${toPhone}`,
          Body: messageBody,
        }).toString(),
      },
    );

    if (!response.ok) {
      throw new Error(`Twilio error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      sent: true,
      method: 'whatsapp',
      recipient: toPhone,
      sid: data.sid,
    };
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { sent: false, reason: error.message };
  }
}

/**
 * Send SMS notification via Twilio
 * @param {string} toPhone - recipient phone (E.164 format)
 * @param {string} message - SMS body
 */
async function sendSMSNotification(toPhone, message) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('Twilio credentials not configured. SMS notification skipped.');
    return { sent: false, reason: 'Twilio not configured' };
  }

  try {
    const auth = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
    ).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE,
          To: toPhone,
          Body: message,
        }).toString(),
      },
    );

    if (!response.ok) {
      throw new Error(`Twilio error: ${response.statusText}`);
    }

    return { sent: true, method: 'sms', recipient: toPhone };
  } catch (error) {
    console.error('SMS notification error:', error);
    return { sent: false, reason: error.message };
  }
}

/**
 * Send low stock alert
 */
async function sendLowStockAlert(business, items, contactEmail) {
  const itemList = items.map((i) => `- ${i.itemName}: ${i.quantityOnHand} units`).join('\n');

  const emailBody = `
    <h3>Low Stock Alert</h3>
    <p>The following items are below reorder point:</p>
    <pre>${itemList}</pre>
    <p><strong>Action:</strong> Place orders immediately to prevent stockouts.</p>
  `;

  return await sendEmailNotification(contactEmail, '⚠️ Low Stock Alert', emailBody, business);
}

/**
 * Send daily summary email
 */
async function sendDailySummaryEmail(business, metrics, insights, actions, contactEmail) {
  const emailBody = `
    <h3>📊 Daily Summary: ${business.name}</h3>
    
    <h4>Top Metrics</h4>
    <ul>
      <li>Revenue: ₹${metrics.revenue.label}</li>
      <li>Orders: ${metrics.orders.value}</li>
      <li>Conversion: ${metrics.conversion.value}%</li>
    </ul>
    
    <h4>Key Insights</h4>
    <ul>
      ${insights
        .slice(0, 3)
        .map((i) => `<li><strong>${i.title}:</strong> ${i.body}</li>`)
        .join('')}
    </ul>
    
    <h4>Top Actions to Take</h4>
    <ul>
      ${actions
        .slice(0, 3)
        .map((a) => `<li>${a.title} (Impact: ${a.impact})</li>`)
        .join('')}
    </ul>
    
    <p><a href="https://atlasbiz.app/dashboard/${business.id}" style="background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Full Dashboard</a></p>
  `;

  return await sendEmailNotification(
    contactEmail,
    `📊 Atlas Daily Summary - ${business.name}`,
    emailBody,
    business,
  );
}

/**
 * Send promotional alert to customer
 */
async function sendPromotionalAlert(customer, promotion, contactMethod = 'email') {
  const message = `
    🎉 Special Offer for You!
    ${promotion.title}
    ${promotion.description}
    Valid until: ${promotion.expiryDate}
    Use code: ${promotion.code}
  `;

  if (contactMethod === 'whatsapp' && customer.phone) {
    return await sendWhatsAppNotification(customer.phone, message);
  } else if (contactMethod === 'sms' && customer.phone) {
    return await sendSMSNotification(customer.phone, message);
  } else if (customer.email) {
    return await sendEmailNotification(customer.email, '🎉 Special Offer', `<p>${message}</p>`);
  }
}

/**
 * Send verification email for new business
 */
async function sendVerificationEmail(email, verificationLink) {
  const body = `
    <h3>Welcome to Atlas!</h3>
    <p>Please verify your email address to activate your account.</p>
    <p><a href="${verificationLink}" style="background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Verify Email</a></p>
    <p>Link expires in 24 hours.</p>
  `;

  return await sendEmailNotification(email, 'Verify Your Atlas Account', body);
}

module.exports = {
  sendEmailNotification,
  sendWhatsAppNotification,
  sendSMSNotification,
  sendLowStockAlert,
  sendDailySummaryEmail,
  sendPromotionalAlert,
  sendVerificationEmail,
};
