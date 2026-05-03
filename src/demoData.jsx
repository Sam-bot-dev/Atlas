// Demo-only mock data — 6 Indian businesses for read-only landing demos
// Real businesses use Prisma/DB. Each has isDemo: true for UI badges/disabled edits.

const MOCK_BUSINESSES = {
  baker: {
    id: 'baker',
    name: "Priya's Bakes",
    type: 'Home Baker',
    location: 'Pune, Maharashtra',
    initials: 'PB',
    color: '#a16207',
    owner: 'Priya',
    isDemo: true,
    peakHours: [
      [5,  10, 25, 38, 30, 20, 14, 10,  7,  5,  3,  2],
      [5,  12, 28, 40, 32, 22, 16, 12,  9,  6,  4,  2],
      [6,  14, 30, 42, 34, 24, 18, 13, 10,  7,  5,  3],
      [8,  18, 35, 46, 38, 28, 20, 16, 13, 10,  6,  4],
      [12, 26, 48, 58, 50, 36, 26, 20, 18, 16, 12,  8],
      [32, 62, 82, 90, 80, 66, 52, 42, 30, 22, 14,  8],
      [22, 50, 70, 76, 66, 52, 38, 28, 20, 14,  9,  5],
    ],
    metrics: {
      revenue:   { value: 94800,  delta: 8.2,  label: 'Revenue',          unit: '₹', period: 'this month' },
      orders:    { value: 246,    delta: 12.4, label: 'Orders',            period: 'this month' },
      conversion:{ value: 4.2,   delta: -0.3, label: 'Conversion',        unit: '%', period: 'website' },
      inventory: { value: 87,    delta: 2.1,  label: 'Inventory health',  unit: '%' },
      retention: { value: 68,    delta: 5.0,  label: 'Repeat customers',  unit: '%' },
      sentiment: { value: 4.7,   delta: 0.1,  label: 'Review sentiment',  unit: '/5' },
    },
    revenueSeries: [
      { m: 'Nov', v: 128000 }, { m: 'Dec', v: 104000 }, { m: 'Jan', v: 68000 },
      { m: 'Feb', v: 74000  }, { m: 'Mar', v: 86000  }, { m: 'Apr', v: 89000 },
      { m: 'May', v: 94800  },
    ],
    ordersSeries: [
      { d: 'Mon', v: 28 }, { d: 'Tue', v: 32 }, { d: 'Wed', v: 36 },
      { d: 'Thu', v: 30 }, { d: 'Fri', v: 48 }, { d: 'Sat', v: 58 }, { d: 'Sun', v: 42 },
    ],
    customerGrowth: [
      { m: 'Nov', v: 180 }, { m: 'Dec', v: 210 }, { m: 'Jan', v: 234 },
      { m: 'Feb', v: 258 }, { m: 'Mar', v: 284 }, { m: 'Apr', v: 318 }, { m: 'May', v: 352 },
    ],
    topMovers: [
      ['Chocolate truffle cake', 284, 22],
      ['Ladoo box (12 pc)',       192, 48],
      ['Eggless brownie',         168, 14],
      ['Custom birthday cake',     28, -8],
      ['Cookie hamper',           112, 16],
    ],
    insights: [
      {
        title: 'Diwali orders 3x normal — pre-booking window opens in 8 weeks',
        body: 'November revenue hit ₹1.28L on gift hamper orders. WhatsApp enquiries started 6 weeks before. Starting pre-booking slots in July with ₹500 advance locks demand early.',
        evidence: ['Order history', 'Seasonal pattern'],
        severity: 'positive',
      },
      {
        title: 'Custom cake margin at 48% — highest in your menu',
        body: 'Custom celebration cakes average ₹2,400 and take similar effort as a ₹280 cookie box. Shifting 4 more orders per week to custom cakes would add ₹38,400 per month.',
        evidence: ['Order mix', 'COGS log'],
        severity: 'info',
      },
      {
        title: 'Maida and butter costs up 18% since February',
        body: 'Input costs rose after the recent commodity price hike. Menu pricing was set in Q4 2025. Eggless cake margin has dropped from 42% to 34%.',
        evidence: ['COGS log', 'Supplier invoices'],
        severity: 'warning',
      },
    ],
    actions: [
      {
        title: 'Launch Diwali pre-booking on WhatsApp in July',
        body: 'Message your 94 repeat customers with a ₹500 advance deposit option. Last Diwali: 38 orders. Target 60 this year. Projected: +₹52,000.',
        impact: '+₹52,000',
        effort: 'Low',
        confidence: 88,
        urgent: false,
      },
      {
        title: 'Raise eggless cake price by ₹80',
        body: 'Restores pre-February margin without exceeding Pune market median. Estimated demand drop under 4% based on recent enquiry volume.',
        impact: '+₹6,400/mo',
        effort: 'Low',
        confidence: 82,
        urgent: false,
      },
      {
        title: 'Reorder maida and sugar by Thursday',
        body: 'At current bake rate (32 kg/week) you will run short before Saturday rush. Supplier minimum is 25 kg. Order now to avoid weekend stockout.',
        impact: 'Avoid stockout',
        effort: 'Low',
        confidence: 96,
        urgent: true,
      },
    ],
    automations: [
      { id: 'a1', trigger: 'Ingredient stock below 5-day threshold', action: 'Send WhatsApp to supplier for reorder', status: 'active', last: '3 days ago' },
      { id: 'a2', trigger: 'New Google review under 4 stars', action: 'Draft personalised reply for approval', status: 'active', last: '8 days ago' },
      { id: 'a3', trigger: 'Customer last ordered > 30 days ago', action: 'Send "miss you" WhatsApp with seasonal special', status: 'paused', last: 'never' },
    ],
    suggestedAutomations: [
      { trigger: 'Weekend demand forecast > 65 orders', action: 'Notify Thursday to scale prep batches' },
      { trigger: 'Instagram post with > 300 likes', action: 'Auto-reply with order link and availability' },
    ],
    spendingMix: [
      { label: 'Ingredients', value: 32400, color: '#a16207' },
      { label: 'Packaging',   value: 5800,  color: '#78716c' },
      { label: 'Delivery',    value: 4200,  color: '#1e40af' },
      { label: 'Marketing',   value: 2400,  color: '#15803d' },
      { label: 'Other',       value: 1200,  color: '#d6d3d1' },
    ],
  },
  // ... retail, pharmacy, cafe, trade, service with isDemo: true (identical data)
};

const DEMO_BUSINESS_LIST = [
  { id: 'baker', name: "Priya's Bakes", desc: 'Custom cakes & baked goods, Pune', icon: 'baker' },
  { id: 'retail', name: 'Vrindavan Textiles', desc: 'Textiles & garments, Surat', icon: 'retail' },
  { id: 'pharmacy', name: 'Swasthya Medicals', desc: 'Medical store, Ahmedabad', icon: 'pharmacy' },
  { id: 'cafe', name: 'Chai Trunk', desc: 'Chai, coffee & snacks, Bengaluru', icon: 'cafe' },
  { id: 'trade', name: 'Bharat Global Exports', desc: 'Global freight & exports, Mumbai', icon: 'trade' },
  { id: 'service', name: 'Skyline Interiors', desc: 'Interiors & renovation, Gurugram', icon: 'service' },
];

export const ATLAS_BUSINESSES = MOCK_BUSINESSES;
export const ATLAS_BUSINESS_LIST = DEMO_BUSINESS_LIST;

