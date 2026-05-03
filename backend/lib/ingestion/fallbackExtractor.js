const { emptyExtraction, validateExtraction } = require('./schema');

const lowerKeys = (row) =>
  Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key.toLowerCase().trim(), value]));

const first = (row, names) => {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== '') return row[name];
  }
  return '';
};

const money = (value) => {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const inferStatus = (quantity, reorderPoint) => {
  if (quantity <= 0) return 'out';
  if (reorderPoint > 0 && quantity <= reorderPoint) return 'low';
  return 'ok';
};

const fromRows = (rows) => {
  const output = emptyExtraction();

  for (const rawRow of rows || []) {
    const row = lowerKeys(rawRow);
    const productName = first(row, ['product', 'product name', 'item', 'item name', 'sku name', 'name']);
    const orderId = first(row, ['order id', 'order_id', 'invoice', 'invoice no', 'bill no', 'id']);
    const total = money(first(row, ['total', 'amount', 'revenue', 'sales', 'price', 'net amount']));
    const quantity = money(first(row, ['qty', 'quantity', 'units', 'units sold']));
    const stock = money(first(row, ['stock', 'inventory', 'quantity on hand', 'on hand', 'available']));
    const rating = money(first(row, ['rating', 'stars', 'review rating']));
    const customerName = first(row, ['customer', 'customer name', 'client', 'name']);
    const customerPhone = first(row, ['phone', 'mobile', 'customer phone']);
    const date = first(row, ['date', 'order date', 'invoice date', 'created at']);

    // Orders
    if (orderId || total || (productName && quantity)) {
      output.orders.push({
        externalId: orderId,
        orderDate: date || null,
        customerName,
        customerPhone,
        productName,
        quantity,
        unitPrice: quantity > 0 && total > 0 ? total / quantity : money(first(row, ['unit price', 'rate'])),
        total,
        channel: first(row, ['channel', 'source', 'platform']),
      });
    }

    // Products
    if (productName && (quantity || total || stock)) {
      output.products.push({
        sku: first(row, ['sku', 'product id', 'item id']),
        name: productName,
        category: first(row, ['category', 'type']),
        unitsSold: quantity,
        revenue: total,
        quantityOnHand: stock,
        reorderPoint: money(first(row, ['reorder point', 'reorder', 'minimum stock', 'min stock'])),
      });
    }

    // Customers
    if (customerName || customerPhone || row.email) {
      output.customers.push({
        externalId: first(row, ['customer id', 'client id']),
        name: customerName,
        phone: customerPhone,
        email: first(row, ['email', 'customer email']),
        ordersCount: money(first(row, ['orders', 'orders count', 'visits'])),
        totalSpend: total,
        segment: first(row, ['segment', 'cohort']),
      });
    }

    // Reviews
    if (rating || row.review || row.comment || row.feedback) {
      const body = first(row, ['review', 'comment', 'feedback', 'body']);
      output.reviews.push({
        platform: first(row, ['platform', 'source']),
        rating,
        body,
        sentiment: rating >= 4 ? 'positive' : rating && rating < 3 ? 'negative' : 'neutral',
        reviewDate: date || null,
      });
    }

    // Inventory
    if (stock !== undefined || row['reorder point'] !== undefined || row['min stock'] !== undefined) {
      const reorderPoint = money(first(row, ['reorder point', 'reorder', 'minimum stock', 'min stock']));
      output.inventory.push({
        sku: first(row, ['sku', 'product id', 'item id']),
        itemName: productName || first(row, ['item', 'name']) || 'Inventory item',
        quantityOnHand: stock,
        reorderPoint,
        status: inferStatus(stock, reorderPoint),
      });
    }

    // Traffic
    if (row.visitors !== undefined || row.traffic !== undefined || row.conversions !== undefined) {
      output.traffic.push({
        occurredAt: date || null,
        channel: first(row, ['channel', 'source', 'platform']),
        visitors: money(first(row, ['visitors', 'traffic', 'footfall'])),
        conversions: money(first(row, ['conversions', 'orders'])),
      });
    }
  }

  return validateExtraction(output);
};

const fromText = (rawText) => {
  const output = emptyExtraction();
  const lines = String(rawText || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const amountMatch = line.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d+)?)/i);
    const dateMatch = line.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
    const qtyMatch = line.match(/\b(?:qty|quantity|units?)[:\s]+(\d+(?:\.\d+)?)/i);

    if (/order|invoice|bill|sale|paid|revenue/i.test(line) && amountMatch) {
      const total = money(amountMatch[1]);
      output.orders.push({
        externalId: '',
        orderDate: dateMatch?.[1] || null,
        customerName: '',
        customerPhone: '',
        productName: line.replace(amountMatch[0], '').slice(0, 80),
        quantity: qtyMatch ? money(qtyMatch[1]) : 1,
        unitPrice: total,
        total,
        channel: '',
      });
    }

    if (/rating|review|stars?|feedback/i.test(line)) {
      const rating = amountMatch ? Math.min(5, money(amountMatch[1])) : 0;
      output.reviews.push({
        platform: '',
        rating,
        body: line.slice(0, 280),
        sentiment: rating >= 4 ? 'positive' : rating && rating < 3 ? 'negative' : 'neutral',
        reviewDate: dateMatch?.[1] || null,
      });
    }
  }

  return validateExtraction(output);
};

const fallbackExtract = ({ rows, rawText, json }) => {
  if (json && (json.orders || json.products || json.customers || json.reviews || json.inventory || json.traffic)) {
    return validateExtraction(json);
  }

  if (rows && rows.length) return fromRows(rows);
  return fromText(rawText);
};

module.exports = { fallbackExtract };
