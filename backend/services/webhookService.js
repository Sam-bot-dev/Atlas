async function dispatchWebhook(url, payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch (err) {
    console.error(`Webhook error dispatching to ${url}:`, err);
    return false;
  }
}

module.exports = { dispatchWebhook };
