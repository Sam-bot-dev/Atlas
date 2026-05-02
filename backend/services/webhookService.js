async function dispatchWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (err) {
    console.error(`Webhook error dispatching to ${url}:`, err);
    return false;
  }
}

module.exports = { dispatchWebhook };
