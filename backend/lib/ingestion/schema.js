const { z } = require('zod');

const optionalDate = z.preprocess((val) => {
  if (!val) return null;
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
}, z.date().nullable());

const numberish = z.coerce.number().catch(() => 0);
const stringish = z.string().transform((val) => val?.trim() ?? '').optional().default('');

const orderSchema = z.object({
  externalId: stringish.default(''),
  orderDate: optionalDate.default(null),
  customerName: stringish.default(''),
  customerPhone: stringish.default(''),
  productName: stringish.default(''),
  quantity: numberish.default(0),
  unitPrice: numberish.default(0),
  total: numberish.default(0),
  channel: stringish.default(''),
});

const productSchema = z.object({
  sku: stringish.default(''),
  name: stringish,
  category: stringish.default(''),
  unitsSold: numberish.default(0),
  revenue: numberish.default(0),
  quantityOnHand: numberish.default(0),
  reorderPoint: numberish.default(0),
});

const customerSchema = z.object({
  externalId: stringish.default(''),
  name: stringish.default(''),
  phone: stringish.default(''),
  email: stringish.default(''),
  ordersCount: z.coerce.number().int().catch(() => 0),
  totalSpend: numberish.default(0),
  segment: stringish.default(''),
});

const reviewSchema = z.object({
  platform: stringish.default(''),
  rating: numberish.default(0),
  body: stringish.default(''),
  sentiment: z.enum(['positive', 'neutral', 'negative']).catch(() => 'neutral'),
  reviewDate: optionalDate.default(null),
});

const inventorySchema = z.object({
  sku: stringish.default(''),
  itemName: stringish,
  quantityOnHand: numberish.default(0),
  reorderPoint: numberish.default(0),
  status: z.enum(['ok', 'low', 'out']).catch(() => 'ok'),
});

const trafficSchema = z.object({
  occurredAt: optionalDate.default(null),
  channel: stringish.default(''),
  visitors: z.coerce.number().int().catch(() => 0),
  conversions: z.coerce.number().int().catch(() => 0),
});

const extractionSchema = z.object({
  orders: z.array(orderSchema).default([]),
  products: z.array(productSchema).default([]),
  customers: z.array(customerSchema).default([]),
  reviews: z.array(reviewSchema).default([]),
  inventory: z.array(inventorySchema).default([]),
  traffic: z.array(trafficSchema).default([]),
});

const emptyExtraction = () => ({
  orders: [],
  products: [],
  customers: [],
  reviews: [],
  inventory: [],
  traffic: [],
});

const validateExtraction = (payload) => extractionSchema.parse(payload || {});

module.exports = {
  emptyExtraction,
  validateExtraction,
};
