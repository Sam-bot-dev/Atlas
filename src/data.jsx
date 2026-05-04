// Mock data — 6 Indian demo businesses
// revenueSeries: 12 monthly points (Jun 2025 – May 2026)
// revenueDailySeries: 30 daily points (Apr 6 – May 5, 2026) with realistic day-of-week patterns
// customerGrowth: 12 monthly points matching revenueSeries
// customerDailySeries: 30 daily points matching revenueDailySeries

const BUSINESSES = {
  baker: {
    id: 'baker',
    name: "Priya's Bakes",
    category: 'Home Baker',
    location: 'Pune, Maharashtra',
    initials: 'PB',
    color: '#a16207',
    owner: 'Priya',
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
      revenue:   { value: 94800,  delta: 8.2,  label: 'Revenue',         unit: '₹', period: 'this month' },
      orders:    { value: 246,    delta: 12.4, label: 'Orders',           period: 'this month' },
      conversion:{ value: 4.2,   delta: -0.3, label: 'Conversion',       unit: '%', period: 'website' },
      inventory: { value: 87,    delta: 2.1,  label: 'Inventory health', unit: '%' },
      retention: { value: 68,    delta: 5.0,  label: 'Repeat customers', unit: '%' },
      sentiment: { value: 4.7,   delta: 0.1,  label: 'Review sentiment', unit: '/5' },
    },
    // 12 months: Jun 2025 – May 2026
    // Diwali/Navratri spike Oct–Nov, post-festive Jan dip, steady recovery
    revenueSeries: [
      { m: 'Jun', v: 58000  }, { m: 'Jul', v: 52000  }, { m: 'Aug', v: 61000  },
      { m: 'Sep', v: 74000  }, { m: 'Oct', v: 148000 }, { m: 'Nov', v: 182000 },
      { m: 'Dec', v: 104000 }, { m: 'Jan', v: 52000  }, { m: 'Feb', v: 61000  },
      { m: 'Mar', v: 78000  }, { m: 'Apr', v: 86000  }, { m: 'May', v: 94800  },
    ],
    // 30 days: Apr 6 – May 5, 2026
    // Baker: weekends spike hard (Fri/Sat/Sun), weekdays moderate
    // Apr 6=Sun, Apr 7=Mon ... May 5=Mon
    revenueDailySeries: [
      { d: '6 Apr',  v: 5200 }, { d: '7 Apr',  v: 2100 }, { d: '8 Apr',  v: 2400 },
      { d: '9 Apr',  v: 2600 }, { d: '10 Apr', v: 2800 }, { d: '11 Apr', v: 4200 },
      { d: '12 Apr', v: 6800 }, { d: '13 Apr', v: 4600 }, { d: '14 Apr', v: 2200 },
      { d: '15 Apr', v: 2500 }, { d: '16 Apr', v: 2700 }, { d: '17 Apr', v: 2900 },
      { d: '18 Apr', v: 4400 }, { d: '19 Apr', v: 7200 }, { d: '20 Apr', v: 4800 },
      { d: '21 Apr', v: 2300 }, { d: '22 Apr', v: 2600 }, { d: '23 Apr', v: 2800 },
      { d: '24 Apr', v: 3000 }, { d: '25 Apr', v: 4600 }, { d: '26 Apr', v: 7600 },
      { d: '27 Apr', v: 5100 }, { d: '28 Apr', v: 2400 }, { d: '29 Apr', v: 2700 },
      { d: '30 Apr', v: 2900 }, { d: '1 May',  v: 3100 }, { d: '2 May',  v: 4800 },
      { d: '3 May',  v: 8200 }, { d: '4 May',  v: 5600 }, { d: '5 May',  v: 2600 },
    ],
    ordersSeries: [
      { d: 'Mon', v: 18 }, { d: 'Tue', v: 24 }, { d: 'Wed', v: 31 },
      { d: 'Thu', v: 22 }, { d: 'Fri', v: 52 }, { d: 'Sat', v: 74 }, { d: 'Sun', v: 48 },
    ],
    // 12 months customer growth
    customerGrowth: [
      { m: 'Jun', v: 168 }, { m: 'Jul', v: 152 }, { m: 'Aug', v: 178 },
      { m: 'Sep', v: 210 }, { m: 'Oct', v: 380 }, { m: 'Nov', v: 420 },
      { m: 'Dec', v: 280 }, { m: 'Jan', v: 195 }, { m: 'Feb', v: 241 },
      { m: 'Mar', v: 278 }, { m: 'Apr', v: 318 }, { m: 'May', v: 352 },
    ],
    customerDailySeries: [
      { d: '6 Apr',  v: 38 }, { d: '7 Apr',  v: 14 }, { d: '8 Apr',  v: 16 },
      { d: '9 Apr',  v: 18 }, { d: '10 Apr', v: 20 }, { d: '11 Apr', v: 32 },
      { d: '12 Apr', v: 52 }, { d: '13 Apr', v: 34 }, { d: '14 Apr', v: 15 },
      { d: '15 Apr', v: 17 }, { d: '16 Apr', v: 19 }, { d: '17 Apr', v: 21 },
      { d: '18 Apr', v: 34 }, { d: '19 Apr', v: 56 }, { d: '20 Apr', v: 36 },
      { d: '21 Apr', v: 16 }, { d: '22 Apr', v: 18 }, { d: '23 Apr', v: 20 },
      { d: '24 Apr', v: 22 }, { d: '25 Apr', v: 36 }, { d: '26 Apr', v: 60 },
      { d: '27 Apr', v: 38 }, { d: '28 Apr', v: 17 }, { d: '29 Apr', v: 19 },
      { d: '30 Apr', v: 21 }, { d: '1 May',  v: 23 }, { d: '2 May',  v: 38 },
      { d: '3 May',  v: 64 }, { d: '4 May',  v: 42 }, { d: '5 May',  v: 18 },
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
        title: "Mother's Day weekend is 11 days away — your biggest May opportunity",
        body: "Last year's second Sunday of May brought 84 orders in 3 days. Custom cakes and gift hampers were 70% of that revenue. You have 11 days to take pre-orders and prep batches — WhatsApp your 94 regulars today.",
        evidence: ['Order history', 'Seasonal pattern'],
        severity: 'positive',
      },
      {
        title: 'Custom cake margin at 48% — highest in your menu',
        body: "Custom celebration cakes average ₹2,400 and take similar effort as a ₹280 cookie box. You're currently doing 6 custom orders a week. Shifting 4 more would add ₹38,400 this month alone.",
        evidence: ['Order mix', 'COGS log'],
        severity: 'info',
      },
      {
        title: 'Maida and butter costs up 18% since February — margins squeezed',
        body: "Input costs rose after the March commodity hike. Your eggless cake margin has dropped from 42% to 34% and you haven't repriced since Q4 2025. Competitors in Aundh have already raised by ₹60–80.",
        evidence: ['COGS log', 'Supplier invoices'],
        severity: 'warning',
      },
      {
        title: '4 custom cake orders cancelled last week — no deposit policy hurting you',
        body: "Four confirmed custom orders were cancelled within 48 hours of delivery, wasting ₹6,800 in ingredients and 14 hours of prep. You have no advance deposit requirement. Adding a 40% non-refundable deposit would have recovered ₹2,720 and filtered out non-serious buyers.",
        evidence: ['Cancellation log', 'Order history'],
        severity: 'negative',
      },
    ],
    actions: [
      {
        title: "Send Mother's Day pre-order message to 94 regulars today",
        body: "WhatsApp broadcast: custom cakes, hampers, and ladoo boxes with ₹300 advance. Deadline May 10 for May 11 delivery. Last year 38 orders came from this list alone.",
        impact: '+₹68,000 this weekend',
        effort: 'Low',
        confidence: 91,
        urgent: true,
      },
      {
        title: 'Raise eggless cake price by ₹80 this week',
        body: "Restores pre-February margin without exceeding Pune market median. Estimated demand drop under 4% based on recent enquiry volume. Do it before Mother's Day orders lock in.",
        impact: '+₹6,400/mo',
        effort: 'Low',
        confidence: 82,
      },
      {
        title: 'Reorder maida and sugar by Thursday',
        body: 'At current bake rate (32 kg/week) you will run short before the Mother\'s Day rush. Supplier minimum is 25 kg. Order now — delivery takes 2 days.',
        impact: 'Avoid stockout',
        effort: 'Low',
        confidence: 96,
        urgent: true,
      },
    ],
    automations: [
      { id: 'a1', trigger: 'Ingredient stock below 5-day threshold', action: 'Send WhatsApp to supplier for reorder', status: 'active', last: '2 days ago' },
      { id: 'a2', trigger: 'New Google review under 4 stars', action: 'Draft personalised reply for approval', status: 'active', last: 'today' },
      { id: 'a3', trigger: 'Customer last ordered > 30 days ago', action: 'Send "miss you" WhatsApp with seasonal special', status: 'active', last: '5 days ago' },
    ],
    suggestedAutomations: [
      { trigger: 'Weekend demand forecast > 65 orders', action: 'Notify Thursday to scale prep batches' },
      { trigger: "Mother's Day / Father's Day approaching (10 days out)", action: 'Send pre-order broadcast to repeat customers' },
    ],
    spendingMix: [
      { label: 'Ingredients', value: 32400, color: '#a16207' },
      { label: 'Packaging',   value: 5800,  color: '#78716c' },
      { label: 'Delivery',    value: 4200,  color: '#1e40af' },
      { label: 'Marketing',   value: 2400,  color: '#15803d' },
      { label: 'Other',       value: 1200,  color: '#d6d3d1' },
    ],
  },

  retail: {
    id: 'retail',
    name: 'Vrindavan Textiles',
    category: 'Retail Shop',
    location: 'Surat, Gujarat',
    initials: 'VT',
    color: '#1e40af',
    owner: 'Rajesh',
    peakHours: [
      [ 4,  8, 22, 38, 36, 28, 24, 30, 38, 44, 32, 18],
      [ 4,  8, 24, 40, 38, 30, 26, 32, 40, 46, 34, 20],
      [ 5, 10, 26, 42, 40, 32, 28, 34, 42, 48, 36, 22],
      [ 6, 12, 28, 44, 42, 34, 30, 36, 44, 50, 38, 24],
      [ 8, 16, 34, 50, 46, 38, 34, 42, 58, 75, 68, 42],
      [15, 30, 58, 72, 66, 56, 50, 56, 64, 60, 46, 28],
      [ 8, 20, 42, 56, 50, 40, 32, 36, 40, 38, 26, 14],
    ],
    metrics: {
      revenue:   { value: 584000, delta: 4.1,  label: 'Revenue',         unit: '₹', period: 'this month' },
      orders:    { value: 1480,   delta: -2.1, label: 'Orders',          period: 'this month' },
      conversion:{ value: 2.8,   delta: 0.4,  label: 'Conversion',      unit: '%' },
      inventory: { value: 72,    delta: -3.0, label: 'Inventory health', unit: '%' },
      retention: { value: 44,    delta: 1.2,  label: 'Repeat customers', unit: '%' },
      sentiment: { value: 4.4,   delta: -0.1, label: 'Review sentiment', unit: '/5' },
    },
    // 12 months: Jun 2025 – May 2026
    // Navratri/Diwali Oct–Nov massive spike, summer slump Apr–Jun, wedding season Feb–Mar
    revenueSeries: [
      { m: 'Jun', v: 320000  }, { m: 'Jul', v: 280000  }, { m: 'Aug', v: 410000  },
      { m: 'Sep', v: 680000  }, { m: 'Oct', v: 1480000 }, { m: 'Nov', v: 1240000 },
      { m: 'Dec', v: 680000  }, { m: 'Jan', v: 390000  }, { m: 'Feb', v: 560000  },
      { m: 'Mar', v: 620000  }, { m: 'Apr', v: 498000  }, { m: 'May', v: 584000  },
    ],
    // 30 days: Apr 6 – May 5, 2026
    // Retail: Thu/Fri/Sat strong, heat suppresses Mon–Wed afternoons
    // Apr revenue ~498k → ~16,600/day avg; Fri/Sat spike to ~28k, Mon dip to ~10k
    revenueDailySeries: [
      { d: '6 Apr',  v: 22000 }, { d: '7 Apr',  v: 10800 }, { d: '8 Apr',  v: 12400 },
      { d: '9 Apr',  v: 13600 }, { d: '10 Apr', v: 18200 }, { d: '11 Apr', v: 28400 },
      { d: '12 Apr', v: 24600 }, { d: '13 Apr', v: 11200 }, { d: '14 Apr', v: 12000 },
      { d: '15 Apr', v: 13200 }, { d: '16 Apr', v: 14400 }, { d: '17 Apr', v: 19600 },
      { d: '18 Apr', v: 29800 }, { d: '19 Apr', v: 25400 }, { d: '20 Apr', v: 11600 },
      { d: '21 Apr', v: 12400 }, { d: '22 Apr', v: 13800 }, { d: '23 Apr', v: 15200 },
      { d: '24 Apr', v: 20400 }, { d: '25 Apr', v: 31200 }, { d: '26 Apr', v: 26800 },
      { d: '27 Apr', v: 12000 }, { d: '28 Apr', v: 13200 }, { d: '29 Apr', v: 14600 },
      { d: '30 Apr', v: 16000 }, { d: '1 May',  v: 21200 }, { d: '2 May',  v: 32400 },
      { d: '3 May',  v: 28000 }, { d: '4 May',  v: 12800 }, { d: '5 May',  v: 14000 },
    ],
    ordersSeries: [
      { d: 'Mon', v: 142 }, { d: 'Tue', v: 168 }, { d: 'Wed', v: 195 },
      { d: 'Thu', v: 224 }, { d: 'Fri', v: 312 }, { d: 'Sat', v: 286 }, { d: 'Sun', v: 98 },
    ],
    customerGrowth: [
      { m: 'Jun', v: 820  }, { m: 'Jul', v: 740  }, { m: 'Aug', v: 1080 },
      { m: 'Sep', v: 1640 }, { m: 'Oct', v: 3200 }, { m: 'Nov', v: 2840 },
      { m: 'Dec', v: 2180 }, { m: 'Jan', v: 1760 }, { m: 'Feb', v: 2040 },
      { m: 'Mar', v: 2160 }, { m: 'Apr', v: 2140 }, { m: 'May', v: 2240 },
    ],
    customerDailySeries: [
      { d: '6 Apr',  v: 148 }, { d: '7 Apr',  v: 62  }, { d: '8 Apr',  v: 72  },
      { d: '9 Apr',  v: 80  }, { d: '10 Apr', v: 108 }, { d: '11 Apr', v: 172 },
      { d: '12 Apr', v: 148 }, { d: '13 Apr', v: 66  }, { d: '14 Apr', v: 74  },
      { d: '15 Apr', v: 82  }, { d: '16 Apr', v: 90  }, { d: '17 Apr', v: 118 },
      { d: '18 Apr', v: 180 }, { d: '19 Apr', v: 154 }, { d: '20 Apr', v: 68  },
      { d: '21 Apr', v: 76  }, { d: '22 Apr', v: 84  }, { d: '23 Apr', v: 94  },
      { d: '24 Apr', v: 124 }, { d: '25 Apr', v: 188 }, { d: '26 Apr', v: 162 },
      { d: '27 Apr', v: 72  }, { d: '28 Apr', v: 80  }, { d: '29 Apr', v: 88  },
      { d: '30 Apr', v: 98  }, { d: '1 May',  v: 128 }, { d: '2 May',  v: 196 },
      { d: '3 May',  v: 168 }, { d: '4 May',  v: 76  }, { d: '5 May',  v: 84  },
    ],
    topMovers: [
      ['Silk saree (6 yards)',  284, 18],
      ['Cotton salwar set',     412,  8],
      ['Printed kurti',         368, 24],
      ['Bridal lehenga',          8, -22],
      ['Chanderi dupatta',      128, 12],
    ],
    insights: [
      {
        title: 'Summer heat is killing afternoon walk-ins — down 38% since April 15',
        body: "Surat hit 43°C last week. Your transaction data shows footfall between 1–5 PM dropped from 312 to 194 daily. Morning slots (9–12 PM) are up 22%. Competitors on Ring Road have already shifted to split hours.",
        evidence: ['Transaction timing', 'Weather data'],
        severity: 'warning',
      },
      {
        title: 'Cotton and linen moving fast — polyester sitting dead',
        body: "Cotton salwar sets and printed kurtis are up 24% in April. 18 polyester SKUs haven't moved in 60+ days. Holding cost is ₹18,400/month. A 20% markdown this week clears shelf before monsoon kills foot traffic further.",
        evidence: ['Inventory age', 'Sales mix'],
        severity: 'negative',
      },
      {
        title: 'B2B boutique reorders accelerating — 3 Pune clients due this week',
        body: 'Three Pune boutiques reordered in March and April. Average cadence is 22 days — all three are due again by May 8. B2B order size is 12x walk-in. Proactive outreach today locks ₹1.8L before they go elsewhere.',
        evidence: ['Order cadence', 'Customer type'],
        severity: 'positive',
      },
      {
        title: 'No digital catalogue — losing online enquiries to competitors every day',
        body: "Three Surat textile competitors launched WhatsApp catalogues in Q1. Your walk-in customers frequently ask for photos to share with family before buying. Without a digital catalogue, you're losing at least 20% of enquiries that never convert to visits.",
        evidence: ['Enquiry log', 'Competitor analysis'],
        severity: 'info',
      },
    ],
    actions: [
      {
        title: 'Call 3 Pune boutique clients today — reorders due by May 8',
        body: 'Riya Boutique, Threads & Co, and Ananya Collections are all on 22-day cadence. Last orders were April 12–16. Call now with a 5% early-reorder discount to lock ₹1.8L this week.',
        impact: '+₹1.8L this week',
        effort: 'Low',
        confidence: 88,
        urgent: true,
      },
      {
        title: 'Markdown 18 polyester SKUs by 20% before May 15',
        body: 'Monsoon arrives in Surat around June 10. Foot traffic drops 40% during monsoon. Clearing dead stock now recovers ₹1.1L capital and frees shelf for the cotton/linen restock.',
        impact: '+₹1.1L cash',
        effort: 'Low',
        confidence: 84,
      },
      {
        title: 'Shift store hours to 9 AM–1 PM and 6–9 PM this week',
        body: 'Afternoon heat is costing you ~118 customers/day. Evening hours in Surat are active until 9:30 PM in summer. Two nearby competitors already made this shift last week.',
        impact: 'Recover ₹22,000/week',
        effort: 'Low',
        confidence: 80,
      },
    ],
    automations: [
      { id: 'a1', trigger: 'SKU on shelf > 60 days', action: 'Flag for markdown review in daily report', status: 'active', last: 'today' },
      { id: 'a2', trigger: 'Daily revenue 20% below forecast', action: 'Draft WhatsApp offer for loyal customers', status: 'active', last: '3 days ago' },
      { id: 'a3', trigger: 'New review posted', action: 'Notify and draft reply', status: 'active', last: 'yesterday' },
    ],
    suggestedAutomations: [
      { trigger: 'Temperature forecast > 42°C in Surat', action: 'Switch store to split hours and notify customers on WhatsApp' },
      { trigger: 'B2B client reorder cadence > 25 days', action: 'Send proactive restock offer with 5% discount' },
    ],
    spendingMix: [
      { label: 'Fabric stock', value: 280000, color: '#1e40af' },
      { label: 'Rent',         value: 42000,  color: '#a16207' },
      { label: 'Staff',        value: 68000,  color: '#15803d' },
      { label: 'Marketing',    value: 18000,  color: '#78716c' },
      { label: 'Other',        value: 8000,   color: '#d6d3d1' },
    ],
  },

  pharmacy: {
    id: 'pharmacy',
    name: 'Swasthya Medicals',
    category: 'Pharmacy',
    location: 'Ahmedabad, Gujarat',
    initials: 'SM',
    color: '#15803d',
    owner: 'Dr. Anjali',
    peakHours: [
      [20, 72, 88, 80, 68, 58, 44, 36, 28, 22, 14,  8],
      [18, 68, 84, 76, 64, 54, 40, 32, 24, 18, 12,  6],
      [16, 64, 80, 72, 60, 50, 38, 30, 22, 16, 10,  5],
      [14, 60, 76, 68, 56, 46, 34, 28, 20, 14,  9,  4],
      [18, 70, 86, 78, 66, 56, 42, 34, 26, 20, 12,  6],
      [10, 38, 60, 72, 64, 50, 38, 28, 20, 14,  8,  4],
      [ 4, 12, 24, 36, 32, 24, 18, 12,  8,  6,  3,  2],
    ],
    metrics: {
      revenue:   { value: 980000, delta: 2.8, label: 'Revenue',           unit: '₹' },
      orders:    { value: 2840,   delta: 1.4, label: 'Prescriptions filled' },
      conversion:{ value: 91,    delta: 0.6, label: 'Refill rate',        unit: '%' },
      inventory: { value: 94,    delta: 0.8, label: 'Inventory health',   unit: '%' },
      retention: { value: 76,    delta: 0.4, label: 'Repeat customers',   unit: '%' },
      sentiment: { value: 4.6,   delta: 0.0, label: 'Review sentiment',   unit: '/5' },
    },
    // 12 months: Jun 2025 – May 2026
    // Monsoon surge Jul–Sep (viral/diarrhea), winter flu spike Dec–Jan, heatwave bump May
    revenueSeries: [
      { m: 'Jun', v: 820000  }, { m: 'Jul', v: 1020000 }, { m: 'Aug', v: 1180000 },
      { m: 'Sep', v: 1060000 }, { m: 'Oct', v: 880000  }, { m: 'Nov', v: 860000  },
      { m: 'Dec', v: 1080000 }, { m: 'Jan', v: 1140000 }, { m: 'Feb', v: 920000  },
      { m: 'Mar', v: 880000  }, { m: 'Apr', v: 910000  }, { m: 'May', v: 980000  },
    ],
    // 30 days: Apr 6 – May 5, 2026
    // Pharmacy: very consistent Mon–Sat, Sunday half-day, heatwave uptick late Apr
    // ~910k/month Apr → ~30,300/day avg; Sat slightly higher, Sun ~12k
    revenueDailySeries: [
      { d: '6 Apr',  v: 18200 }, { d: '7 Apr',  v: 31400 }, { d: '8 Apr',  v: 29800 },
      { d: '9 Apr',  v: 30600 }, { d: '10 Apr', v: 31200 }, { d: '11 Apr', v: 32800 },
      { d: '12 Apr', v: 34600 }, { d: '13 Apr', v: 18800 }, { d: '14 Apr', v: 32200 },
      { d: '15 Apr', v: 30400 }, { d: '16 Apr', v: 31000 }, { d: '17 Apr', v: 31800 },
      { d: '18 Apr', v: 33400 }, { d: '19 Apr', v: 35200 }, { d: '20 Apr', v: 19400 },
      { d: '21 Apr', v: 33000 }, { d: '22 Apr', v: 31600 }, { d: '23 Apr', v: 32400 },
      { d: '24 Apr', v: 33200 }, { d: '25 Apr', v: 35000 }, { d: '26 Apr', v: 37200 },
      { d: '27 Apr', v: 20200 }, { d: '28 Apr', v: 34800 }, { d: '29 Apr', v: 33400 },
      { d: '30 Apr', v: 34200 }, { d: '1 May',  v: 35000 }, { d: '2 May',  v: 36800 },
      { d: '3 May',  v: 39200 }, { d: '4 May',  v: 21400 }, { d: '5 May',  v: 36000 },
    ],
    ordersSeries: [
      { d: 'Mon', v: 620 }, { d: 'Tue', v: 498 }, { d: 'Wed', v: 544 },
      { d: 'Thu', v: 462 }, { d: 'Fri', v: 588 }, { d: 'Sat', v: 724 }, { d: 'Sun', v: 284 },
    ],
    customerGrowth: [
      { m: 'Jun', v: 2280 }, { m: 'Jul', v: 2640 }, { m: 'Aug', v: 2980 },
      { m: 'Sep', v: 2820 }, { m: 'Oct', v: 2560 }, { m: 'Nov', v: 2480 },
      { m: 'Dec', v: 2820 }, { m: 'Jan', v: 2960 }, { m: 'Feb', v: 2740 },
      { m: 'Mar', v: 2680 }, { m: 'Apr', v: 2780 }, { m: 'May', v: 2940 },
    ],
    customerDailySeries: [
      { d: '6 Apr',  v: 62  }, { d: '7 Apr',  v: 108 }, { d: '8 Apr',  v: 102 },
      { d: '9 Apr',  v: 104 }, { d: '10 Apr', v: 106 }, { d: '11 Apr', v: 112 },
      { d: '12 Apr', v: 118 }, { d: '13 Apr', v: 64  }, { d: '14 Apr', v: 110 },
      { d: '15 Apr', v: 104 }, { d: '16 Apr', v: 106 }, { d: '17 Apr', v: 108 },
      { d: '18 Apr', v: 114 }, { d: '19 Apr', v: 120 }, { d: '20 Apr', v: 66  },
      { d: '21 Apr', v: 112 }, { d: '22 Apr', v: 108 }, { d: '23 Apr', v: 110 },
      { d: '24 Apr', v: 114 }, { d: '25 Apr', v: 120 }, { d: '26 Apr', v: 128 },
      { d: '27 Apr', v: 68  }, { d: '28 Apr', v: 118 }, { d: '29 Apr', v: 114 },
      { d: '30 Apr', v: 116 }, { d: '1 May',  v: 120 }, { d: '2 May',  v: 126 },
      { d: '3 May',  v: 134 }, { d: '4 May',  v: 72  }, { d: '5 May',  v: 122 },
    ],
    topMovers: [
      ['Paracetamol 500mg',     684, 4],
      ['Cetirizine 10mg',       520, 38],
      ['Vitamin D3 sachet',     312, 22],
      ['BP monitor (Omron)',     18, -6],
      ['Cough syrup D-Cold',    248, 14],
    ],
    insights: [
      {
        title: 'Heatwave dehydration demand already rising',
        body: "ORS sales are up 45% in April — temperatures hitting 42°C are causing dehydration cases. ORS sachets moved 280 units last week vs 180 in March. Heatwave peaks in May — you have 2 weeks to build stock.",
        evidence: ['Sales velocity', 'Temperature data'],
        severity: 'positive',
      },
      {
        title: 'Tuesday afternoon wait time at 24 min — 8 complaints this month',
        body: "Your target is 15 minutes. One technician is on leave every Tuesday afternoon. Eight patients cited wait time in May reviews. This is your lowest-rated day and it's fixable with a simple shift swap.",
        evidence: ['Fill timing', 'Complaint log'],
        severity: 'warning',
      },
      {
        title: 'Generic substitution panel driving 94% retention on counselled patients',
        body: "Patients who were counselled on Jan Aushadhi generics show 94% refill retention vs 78% for those who weren't. Your generic panel covers 42% of prescription volume — expanding it to 55% adds ~180 loyal patients.",
        evidence: ['Refill data', 'Retention cohort'],
        severity: 'info',
      },
      {
        title: 'Cold chain breach risk — 3 insulin SKUs stored above 8°C last Tuesday',
        body: "Your refrigeration unit logged a temperature spike to 11°C for 4 hours on Tuesday morning during a power fluctuation. Three insulin SKUs (Lantus, Tresiba, Basaglar) may be compromised. Selling affected stock exposes you to patient harm and licence risk.",
        evidence: ['Cold chain log', 'Refrigeration sensor'],
        severity: 'negative',
      },
    ],
    actions: [
      {
        title: 'Order heatwave stock now — ORS ×800, electrolytes ×400, sunscreen ×200',
        body: 'Last May you ran out of ORS by May 18. Distributor lead time is 5 days. Order by May 8 to have stock before the heatwave peaks. Total outlay ₹24,000, payback in 3 days of June sales.',
        impact: 'Capture ₹38,000 peak demand',
        effort: 'Low',
        confidence: 92,
        urgent: true,
      },
      {
        title: 'Swap Tuesday afternoon shift — move technician from Thursday morning',
        body: 'No extra payroll. Reduces Tuesday wait time from 24 to ~16 min. Directly addresses the top complaint driver this month. Takes 10 minutes to arrange.',
        impact: '-8 min avg wait',
        effort: 'Low',
        confidence: 88,
      },
      {
        title: 'Launch WhatsApp prescription refill reminder this week',
        body: '68% of your regulars are on WhatsApp. A simple "your refill is due" message 3 days before expiry recovers lapsed patients. Similar pharmacies in Ahmedabad report 18% revenue lift within 60 days.',
        impact: '+₹18,000/mo',
        effort: 'Med',
        confidence: 76,
      },
    ],
    automations: [
      { id: 'a1', trigger: 'Refill due in 3 days', action: 'Send WhatsApp reminder to patient', status: 'active', last: 'today' },
      { id: 'a2', trigger: 'Schedule H drug below reorder level', action: 'Alert pharmacist and draft reorder', status: 'active', last: '4 days ago' },
      { id: 'a3', trigger: 'Negative Google review', action: 'Draft empathetic reply for approval', status: 'active', last: '2 days ago' },
    ],
    suggestedAutomations: [
      { trigger: 'Heatwave alert issued by IMD', action: 'Auto-generate purchase order for ORS, electrolytes, and sunscreen' },
      { trigger: 'Patient last refill > 45 days', action: 'Send care check-in WhatsApp message' },
    ],
    spendingMix: [
      { label: 'Medicines',  value: 580000, color: '#15803d' },
      { label: 'Staff',      value: 248000, color: '#a16207' },
      { label: 'Rent',       value: 68000,  color: '#1e40af' },
      { label: 'Other',      value: 32000,  color: '#78716c' },
    ],
  },

  cafe: {
    id: 'cafe',
    name: 'Chai Trunk',
    category: 'Cafe',
    location: 'Bengaluru, Karnataka',
    initials: 'CT',
    color: '#7c2d12',
    owner: 'Arjun',
    peakHours: [
      [55, 90, 82, 68, 72, 60, 42, 30, 20, 14,  8,  5],
      [52, 88, 80, 65, 70, 58, 40, 28, 18, 12,  7,  4],
      [58, 92, 84, 70, 74, 62, 44, 32, 22, 16,  9,  5],
      [60, 94, 86, 72, 76, 64, 46, 34, 24, 18, 10,  6],
      [62, 90, 84, 70, 74, 62, 50, 38, 28, 22, 14,  8],
      [38, 72, 80, 76, 68, 58, 50, 44, 38, 30, 22, 14],
      [28, 60, 72, 68, 60, 50, 42, 36, 28, 22, 16,  9],
    ],
    metrics: {
      revenue:   { value: 264000, delta: 6.2, label: 'Revenue',         unit: '₹' },
      orders:    { value: 5840,   delta: 8.1, label: 'Transactions' },
      conversion:{ value: 38,    delta: 1.8, label: 'Loyalty signups',  unit: '%' },
      inventory: { value: 80,    delta: -1.0,label: 'Inventory health', unit: '%' },
      retention: { value: 62,    delta: 3.2, label: 'Repeat customers', unit: '%' },
      sentiment: { value: 4.5,   delta: 0.2, label: 'Review sentiment', unit: '/5' },
    },
    // 12 months: Jun 2025 – May 2026
    // Cafe: strong growth story, Jan dip (office holidays), summer cold brew surge Apr–May
    revenueSeries: [
      { m: 'Jun', v: 168000 }, { m: 'Jul', v: 182000 }, { m: 'Aug', v: 194000 },
      { m: 'Sep', v: 210000 }, { m: 'Oct', v: 224000 }, { m: 'Nov', v: 198000 },
      { m: 'Dec', v: 172000 }, { m: 'Jan', v: 148000 }, { m: 'Feb', v: 196000 },
      { m: 'Mar', v: 228000 }, { m: 'Apr', v: 248000 }, { m: 'May', v: 264000 },
    ],
    // 30 days: Apr 6 – May 5, 2026
    // Cafe: Mon–Fri office crowd strong, Sat moderate, Sun quiet
    // ~248k/month Apr → ~8,270/day avg; weekday ~9k, Sat ~7k, Sun ~4.5k
    revenueDailySeries: [
      { d: '6 Apr',  v: 5200  }, { d: '7 Apr',  v: 9400  }, { d: '8 Apr',  v: 9800  },
      { d: '9 Apr',  v: 10200 }, { d: '10 Apr', v: 10600 }, { d: '11 Apr', v: 9200  },
      { d: '12 Apr', v: 7400  }, { d: '13 Apr', v: 4800  }, { d: '14 Apr', v: 9600  },
      { d: '15 Apr', v: 10000 }, { d: '16 Apr', v: 10400 }, { d: '17 Apr', v: 10800 },
      { d: '18 Apr', v: 9400  }, { d: '19 Apr', v: 7600  }, { d: '20 Apr', v: 5000  },
      { d: '21 Apr', v: 9800  }, { d: '22 Apr', v: 10200 }, { d: '23 Apr', v: 10600 },
      { d: '24 Apr', v: 11000 }, { d: '25 Apr', v: 9600  }, { d: '26 Apr', v: 7800  },
      { d: '27 Apr', v: 5200  }, { d: '28 Apr', v: 10000 }, { d: '29 Apr', v: 10400 },
      { d: '30 Apr', v: 10800 }, { d: '1 May',  v: 11200 }, { d: '2 May',  v: 9800  },
      { d: '3 May',  v: 8000  }, { d: '4 May',  v: 5400  }, { d: '5 May',  v: 10200 },
    ],
    ordersSeries: [
      { d: 'Mon', v: 920 }, { d: 'Tue', v: 840 }, { d: 'Wed', v: 1080 },
      { d: 'Thu', v: 960 }, { d: 'Fri', v: 1240 }, { d: 'Sat', v: 680 }, { d: 'Sun', v: 420 },
    ],
    customerGrowth: [
      { m: 'Jun', v: 620  }, { m: 'Jul', v: 680  }, { m: 'Aug', v: 740  },
      { m: 'Sep', v: 800  }, { m: 'Oct', v: 860  }, { m: 'Nov', v: 820  },
      { m: 'Dec', v: 740  }, { m: 'Jan', v: 860  }, { m: 'Feb', v: 1080 },
      { m: 'Mar', v: 1320 }, { m: 'Apr', v: 1480 }, { m: 'May', v: 1560 },
    ],
    customerDailySeries: [
      { d: '6 Apr',  v: 62  }, { d: '7 Apr',  v: 112 }, { d: '8 Apr',  v: 118 },
      { d: '9 Apr',  v: 122 }, { d: '10 Apr', v: 126 }, { d: '11 Apr', v: 110 },
      { d: '12 Apr', v: 88  }, { d: '13 Apr', v: 58  }, { d: '14 Apr', v: 114 },
      { d: '15 Apr', v: 120 }, { d: '16 Apr', v: 124 }, { d: '17 Apr', v: 128 },
      { d: '18 Apr', v: 112 }, { d: '19 Apr', v: 90  }, { d: '20 Apr', v: 60  },
      { d: '21 Apr', v: 116 }, { d: '22 Apr', v: 122 }, { d: '23 Apr', v: 126 },
      { d: '24 Apr', v: 130 }, { d: '25 Apr', v: 114 }, { d: '26 Apr', v: 92  },
      { d: '27 Apr', v: 62  }, { d: '28 Apr', v: 118 }, { d: '29 Apr', v: 124 },
      { d: '30 Apr', v: 128 }, { d: '1 May',  v: 132 }, { d: '2 May',  v: 116 },
      { d: '3 May',  v: 94  }, { d: '4 May',  v: 64  }, { d: '5 May',  v: 120 },
    ],
    topMovers: [
      ['Masala chai',      1284, 18],
      ['Filter coffee',     924,  8],
      ['Vada pav',          612, 24],
      ['Samosa (2 pc)',      488, 14],
      ['Cold brew',         224, 56],
    ],
    insights: [
      {
        title: 'Swiggy/Zomato commission eroding ₹28,000 every month',
        body: "Platform orders are 38% of revenue but margin drops to 12% after the 25% commission cut. Your direct counter margin is 58%. Three nearby cafes in Indiranagar switched to WhatsApp ordering in Q1 and report 22% margin improvement.",
        evidence: ['Channel mix', 'Margin by channel'],
        severity: 'warning',
      },
      {
        title: 'Cold brew sales up 56% in April — summer demand accelerating',
        body: "Bengaluru hit 36°C last week. Cold brew went from 4 cups/day in March to 14 cups/day in late April. You're currently making it in small batches. Pre-brewing 20L every 2 days cuts cost by 30% and prevents stockouts.",
        evidence: ['Sales velocity', 'Temperature data'],
        severity: 'positive',
      },
      {
        title: '3 long weekends in May–June will cut Koramangala footfall by 40%',
        body: "May 12 (Mother's Day), June 1 (Sunday), and June 15 (Sunday) are low-traffic days. Your weekday revenue depends 68% on the Koramangala offices nearby. Pre-plan promotions for these dips — last year you lost ₹42,000 unprepared.",
        evidence: ['Transaction timing', 'Calendar data'],
        severity: 'info',
      },
      {
        title: 'Milk wastage at 18 litres/week — ₹3,200 lost every month',
        body: "Your standing milk order is calibrated for peak weekday demand. On Saturdays and Sundays you're discarding an average of 4.5 litres/day. At ₹52/litre that's ₹3,200/month straight to the drain. A dynamic weekend order would fix this in one call to your supplier.",
        evidence: ['Inventory log', 'Supplier invoices'],
        severity: 'negative',
      },
    ],
    actions: [
      {
        title: 'Pre-brew 20L cold brew batches starting this week',
        body: 'Current demand: 14 cups/day and rising. Each 20L batch (₹800 cost) yields 80 cups at ₹120 each = ₹9,600 revenue. Brew every 2 days. Add nimbu pani and aam panna to the cold menu before May 10.',
        impact: '+₹18,000/mo',
        effort: 'Low',
        confidence: 86,
        urgent: true,
      },
      {
        title: 'Launch WhatsApp direct ordering for top 100 loyalty members',
        body: "Give your regulars a direct link — no Swiggy cut. Even shifting 20% of app orders to direct saves ₹5,600/month immediately. Test with your top 100 first, measure for 3 weeks.",
        impact: '+₹18,000/mo margin',
        effort: 'Med',
        confidence: 82,
      },
      {
        title: "Run 'Office Escape' combo on May 12 long weekend",
        body: "Masala chai + vada pav at ₹99 (vs ₹148 separate). Targets walk-in traffic when Koramangala offices are empty. Last Mother's Day you had 30% lower footfall — a combo deal brought it back to 80%.",
        impact: 'Protect ₹14,000 weekend rev',
        effort: 'Low',
        confidence: 74,
      },
    ],
    automations: [
      { id: 'a1', trigger: 'Loyalty member 14 days inactive', action: 'Send WhatsApp "miss you" chai voucher', status: 'active', last: 'today' },
      { id: 'a2', trigger: 'Daily milk pull > 20 litres', action: 'Add to tomorrow standing order', status: 'active', last: 'today' },
      { id: 'a3', trigger: 'Negative review on Swiggy or Google', action: 'Draft empathetic reply for approval', status: 'active', last: '2 days ago' },
    ],
    suggestedAutomations: [
      { trigger: 'Temperature forecast > 34°C tomorrow', action: 'Post cold brew + aam panna promo on Instagram story' },
      { trigger: 'Koramangala holiday next day', action: 'Reduce milk order by 30% and adjust morning staff shift' },
    ],
    spendingMix: [
      { label: 'Tea, coffee & dairy', value: 88000, color: '#7c2d12' },
      { label: 'Snacks & food',       value: 32000, color: '#a16207' },
      { label: 'Staff',               value: 72000, color: '#15803d' },
      { label: 'Rent',                value: 36000, color: '#1e40af' },
      { label: 'Other',               value: 8000,  color: '#78716c' },
    ],
  },

  trade: {
    id: 'trade',
    name: 'Bharat Global Exports',
    category: 'Import/Export',
    location: 'Mumbai, Maharashtra',
    initials: 'BG',
    color: '#1e40af',
    owner: 'Vikram',
    peakHours: [
      [2, 12, 55, 72, 68, 80, 76, 64, 58, 42, 22,  8],
      [2, 10, 52, 68, 64, 76, 72, 60, 54, 38, 20,  6],
      [2, 12, 56, 70, 66, 78, 74, 62, 56, 40, 22,  7],
      [2, 14, 60, 74, 70, 82, 78, 66, 60, 44, 24,  8],
      [2, 12, 54, 68, 64, 74, 70, 58, 52, 36, 18,  5],
      [1,  4, 10, 16, 14, 12, 10,  8,  6,  4,  2,  1],
      [1,  2,  4,  6,  5,  4,  3,  2,  2,  1,  1,  1],
    ],
    metrics: {
      revenue:   { value: 3240000, delta: -1.4, label: 'Revenue',         unit: '₹' },
      orders:    { value: 22,      delta: 12.0, label: 'Shipments' },
      conversion:{ value: 84,     delta: -2.1, label: 'On-time rate',     unit: '%' },
      inventory: { value: 68,     delta: -4.2, label: 'Container util.',  unit: '%' },
      retention: { value: 92,     delta: 0.8,  label: 'Client retention', unit: '%' },
      sentiment: { value: 4.2,    delta: -0.1, label: 'Client NPS',       unit: '/5' },
    },
    // 12 months: Jun 2025 – May 2026
    // Exports: Dec year-end surge (global holiday orders), Q1 slowdown, JNPT disruption dip May
    revenueSeries: [
      { m: 'Jun', v: 3600000 }, { m: 'Jul', v: 3200000 }, { m: 'Aug', v: 3800000 },
      { m: 'Sep', v: 4200000 }, { m: 'Oct', v: 4600000 }, { m: 'Nov', v: 4200000 },
      { m: 'Dec', v: 5800000 }, { m: 'Jan', v: 2640000 }, { m: 'Feb', v: 3480000 },
      { m: 'Mar', v: 4120000 }, { m: 'Apr', v: 3680000 }, { m: 'May', v: 3240000 },
    ],
    // 30 days: Apr 6 – May 5, 2026
    // Exports: lumpy — shipments close on specific days, weekends near-zero
    // ~3.68M/month Apr → ~122k/day avg on working days; Sat/Sun ~10k
    revenueDailySeries: [
      { d: '6 Apr',  v: 28000  }, { d: '7 Apr',  v: 148000 }, { d: '8 Apr',  v: 124000 },
      { d: '9 Apr',  v: 186000 }, { d: '10 Apr', v: 142000 }, { d: '11 Apr', v: 168000 },
      { d: '12 Apr', v: 18000  }, { d: '13 Apr', v: 12000  }, { d: '14 Apr', v: 156000 },
      { d: '15 Apr', v: 132000 }, { d: '16 Apr', v: 198000 }, { d: '17 Apr', v: 144000 },
      { d: '18 Apr', v: 162000 }, { d: '19 Apr', v: 22000  }, { d: '20 Apr', v: 14000  },
      { d: '21 Apr', v: 138000 }, { d: '22 Apr', v: 116000 }, { d: '23 Apr', v: 174000 },
      { d: '24 Apr', v: 128000 }, { d: '25 Apr', v: 152000 }, { d: '26 Apr', v: 20000  },
      { d: '27 Apr', v: 10000  }, { d: '28 Apr', v: 142000 }, { d: '29 Apr', v: 118000 },
      { d: '30 Apr', v: 164000 }, { d: '1 May',  v: 136000 }, { d: '2 May',  v: 158000 },
      { d: '3 May',  v: 18000  }, { d: '4 May',  v: 12000  }, { d: '5 May',  v: 128000 },
    ],
    ordersSeries: [
      { d: 'Mon', v: 8 }, { d: 'Tue', v: 5 }, { d: 'Wed', v: 7 },
      { d: 'Thu', v: 11 }, { d: 'Fri', v: 6 }, { d: 'Sat', v: 2 }, { d: 'Sun', v: 0 },
    ],
    customerGrowth: [
      { m: 'Jun', v: 44 }, { m: 'Jul', v: 42 }, { m: 'Aug', v: 46 },
      { m: 'Sep', v: 50 }, { m: 'Oct', v: 54 }, { m: 'Nov', v: 48 },
      { m: 'Dec', v: 52 }, { m: 'Jan', v: 38 }, { m: 'Feb', v: 42 },
      { m: 'Mar', v: 46 }, { m: 'Apr', v: 44 }, { m: 'May', v: 46 },
    ],
    customerDailySeries: [
      { d: '6 Apr',  v: 2 }, { d: '7 Apr',  v: 4 }, { d: '8 Apr',  v: 3 },
      { d: '9 Apr',  v: 5 }, { d: '10 Apr', v: 4 }, { d: '11 Apr', v: 4 },
      { d: '12 Apr', v: 1 }, { d: '13 Apr', v: 0 }, { d: '14 Apr', v: 4 },
      { d: '15 Apr', v: 3 }, { d: '16 Apr', v: 5 }, { d: '17 Apr', v: 4 },
      { d: '18 Apr', v: 4 }, { d: '19 Apr', v: 1 }, { d: '20 Apr', v: 0 },
      { d: '21 Apr', v: 3 }, { d: '22 Apr', v: 3 }, { d: '23 Apr', v: 5 },
      { d: '24 Apr', v: 3 }, { d: '25 Apr', v: 4 }, { d: '26 Apr', v: 1 },
      { d: '27 Apr', v: 0 }, { d: '28 Apr', v: 4 }, { d: '29 Apr', v: 3 },
      { d: '30 Apr', v: 4 }, { d: '1 May',  v: 3 }, { d: '2 May',  v: 4 },
      { d: '3 May',  v: 1 }, { d: '4 May',  v: 0 }, { d: '5 May',  v: 3 },
    ],
    topMovers: [
      ['Printed cotton fabric (bales)', 8, 22],
      ['Handicraft items (cartons)',   12, -4],
      ['Spice export (MT)',             6, 18],
      ['Garment accessories',          14,  8],
      ['Leather goods',                 4, -16],
    ],
    insights: [
      {
        title: 'JNPT dwell time at 6.2 days — 3 shipments at penalty risk this week',
        body: "Port congestion has been building since April 20. Your three UAE shipments (booked May 2–4) are at risk of missing the 30-day delivery clause. Penalty exposure is ₹2.8L. CHB fast-track filing takes 24 hours.",
        evidence: ['Port data', 'Shipment manifest'],
        severity: 'negative',
      },
      {
        title: 'USD/INR at 84.2 — best rate in 18 months, window closing',
        body: "RBI intervention signals suggest the rate will correct toward 82.5 by June. Your next 60-day receivables of USD 2.14L are unhedged. Locking in today at 84.2 secures ₹6.4L more than the 12-month average.",
        evidence: ['FX log', 'Receivables schedule'],
        severity: 'positive',
      },
      {
        title: 'Al Rashid Trading (Dubai) — order cadence dropped from monthly to quarterly',
        body: "They placed orders in Jan and April. Before that it was every 28 days. This pattern matches competitive pressure from a Rajkot exporter who undercut on garment accessories in March. They represent ₹4.8L/month — worth a direct call this week.",
        evidence: ['Client cadence', 'Order history'],
        severity: 'warning',
      },
      {
        title: 'GST reconciliation gap of ₹1.84L flagged in April filing',
        body: "Your CA flagged a mismatch between GSTR-1 and GSTR-3B for April — ₹1.84L in export invoices weren't reflected in the monthly return. This creates a refund delay and potential scrutiny notice if not corrected before the May 20 deadline.",
        evidence: ['GST portal', 'CA report'],
        severity: 'info',
      },
    ],
    actions: [
      {
        title: 'File CHB fast-track for 3 UAE shipments — deadline today',
        body: 'Custom House Broker fast-track costs ₹18,000 but avoids ₹2.8L in penalty exposure. JNPT congestion is not clearing before May 8. File today — processing takes 24 hours.',
        impact: 'Avoid ₹2.8L penalty',
        effort: 'Med',
        confidence: 90,
        urgent: true,
      },
      {
        title: 'Hedge USD 2.14L receivables at 84.2 — call HDFC trade desk today',
        body: 'Forward contract, 60-day tenor. Locks in ₹6.4L above the 12-month average rate. RBI signals suggest correction by June. This window may not last past this week.',
        impact: '+₹6.4L locked',
        effort: 'Low',
        confidence: 82,
        urgent: true,
      },
      {
        title: 'Call Al Rashid this week — offer Q2 volume commitment discount',
        body: 'A 3% discount on a ₹12L Q2 commitment retains a ₹46L/year account. Churn risk is high — act before they formalise with the Rajkot competitor. A 15-minute call is all it takes.',
        impact: 'Retain ₹46L/yr account',
        effort: 'Low',
        confidence: 74,
      },
    ],
    automations: [
      { id: 'a1', trigger: 'Shipment ETA delayed > 48 hours', action: 'Notify client and draft revised ETA email', status: 'active', last: 'today' },
      { id: 'a2', trigger: 'USD/INR moves > 1.5% in a day', action: 'Alert ops and draft hedging recommendation', status: 'active', last: '3 days ago' },
      { id: 'a3', trigger: 'Client order cadence drops > 30%', action: 'Add to sales follow-up list and draft outreach', status: 'active', last: 'yesterday' },
    ],
    suggestedAutomations: [
      { trigger: 'JNPT dwell time alert > 4 days', action: 'Auto-notify affected clients and draft CHB escalation' },
      { trigger: 'GST filing due in 5 days', action: 'Notify accounts team with checklist and deadline' },
    ],
    spendingMix: [
      { label: 'Goods',           value: 1960000, color: '#1e40af' },
      { label: 'Logistics',       value: 580000,  color: '#a16207' },
      { label: 'Customs & duties',value: 180000,  color: '#15803d' },
      { label: 'Staff',           value: 140000,  color: '#78716c' },
      { label: 'Other',           value: 36000,   color: '#d6d3d1' },
    ],
  },

  service: {
    id: 'service',
    name: 'Skyline Interiors',
    category: 'Service Business',
    location: 'Manali, Himachal Pradesh',
    initials: 'SI',
    color: '#15803d',
    owner: 'Neha',
    peakHours: [
      [2, 18, 58, 72, 74, 68, 62, 70, 66, 48, 22,  6],
      [2, 20, 62, 76, 78, 72, 66, 74, 70, 52, 24,  7],
      [2, 18, 60, 74, 76, 70, 64, 72, 68, 50, 22,  6],
      [2, 22, 66, 80, 82, 76, 70, 78, 74, 56, 26,  8],
      [2, 18, 56, 68, 70, 64, 58, 64, 60, 44, 20,  5],
      [1,  6, 14, 22, 20, 16, 12, 10,  8,  6,  3,  1],
      [1,  2,  3,  4,  3,  3,  2,  2,  1,  1,  1,  1],
    ],
    metrics: {
      revenue:   { value: 496000, delta: 11.8, label: 'Revenue',         unit: '₹' },
      orders:    { value: 11,     delta: 16.0, label: 'Active projects' },
      conversion:{ value: 38,    delta: 4.2,  label: 'Quote close rate', unit: '%' },
      inventory: { value: 91,    delta: 1.4,  label: 'Schedule load',    unit: '%' },
      retention: { value: 72,    delta: 5.4,  label: 'Referral rate',    unit: '%' },
      sentiment: { value: 4.8,   delta: 0.0,  label: 'Review sentiment', unit: '/5' },
    },
    // 12 months: Jun 2025 – May 2026
    // Interiors: winter dead season Nov–Jan (snow, no work), tourist season ramp Mar–May
    revenueSeries: [
      { m: 'Jun', v: 380000 }, { m: 'Jul', v: 420000 }, { m: 'Aug', v: 390000 },
      { m: 'Sep', v: 340000 }, { m: 'Oct', v: 260000 }, { m: 'Nov', v: 180000 },
      { m: 'Dec', v: 96000  }, { m: 'Jan', v: 68000  }, { m: 'Feb', v: 142000 },
      { m: 'Mar', v: 310000 }, { m: 'Apr', v: 428000 }, { m: 'May', v: 496000 },
    ],
    // 30 days: Apr 6 – May 5, 2026
    // Service/interiors: project-based, lumpy payments. Mon–Fri active, weekends off.
    // ~428k/month Apr → ~14,270/day avg on working days; Sat ~4k, Sun ~0
    revenueDailySeries: [
      { d: '6 Apr',  v: 4200  }, { d: '7 Apr',  v: 18400 }, { d: '8 Apr',  v: 22000 },
      { d: '9 Apr',  v: 16800 }, { d: '10 Apr', v: 24000 }, { d: '11 Apr', v: 19600 },
      { d: '12 Apr', v: 5200  }, { d: '13 Apr', v: 0     }, { d: '14 Apr', v: 20400 },
      { d: '15 Apr', v: 24800 }, { d: '16 Apr', v: 18000 }, { d: '17 Apr', v: 26400 },
      { d: '18 Apr', v: 21200 }, { d: '19 Apr', v: 5600  }, { d: '20 Apr', v: 0     },
      { d: '21 Apr', v: 22000 }, { d: '22 Apr', v: 26800 }, { d: '23 Apr', v: 19600 },
      { d: '24 Apr', v: 28400 }, { d: '25 Apr', v: 23200 }, { d: '26 Apr', v: 6000  },
      { d: '27 Apr', v: 0     }, { d: '28 Apr', v: 24000 }, { d: '29 Apr', v: 29200 },
      { d: '30 Apr', v: 21600 }, { d: '1 May',  v: 31200 }, { d: '2 May',  v: 25600 },
      { d: '3 May',  v: 6800  }, { d: '4 May',  v: 0     }, { d: '5 May',  v: 26400 },
    ],
    ordersSeries: [
      { d: 'Mon', v: 5 }, { d: 'Tue', v: 7 }, { d: 'Wed', v: 6 },
      { d: 'Thu', v: 8 }, { d: 'Fri', v: 5 }, { d: 'Sat', v: 2 }, { d: 'Sun', v: 0 },
    ],
    customerGrowth: [
      { m: 'Jun', v: 92  }, { m: 'Jul', v: 104 }, { m: 'Aug', v: 96  },
      { m: 'Sep', v: 82  }, { m: 'Oct', v: 64  }, { m: 'Nov', v: 62  },
      { m: 'Dec', v: 44  }, { m: 'Jan', v: 38  }, { m: 'Feb', v: 58  },
      { m: 'Mar', v: 88  }, { m: 'Apr', v: 114 }, { m: 'May', v: 132 },
    ],
    customerDailySeries: [
      { d: '6 Apr',  v: 1 }, { d: '7 Apr',  v: 4 }, { d: '8 Apr',  v: 5 },
      { d: '9 Apr',  v: 4 }, { d: '10 Apr', v: 6 }, { d: '11 Apr', v: 5 },
      { d: '12 Apr', v: 1 }, { d: '13 Apr', v: 0 }, { d: '14 Apr', v: 5 },
      { d: '15 Apr', v: 6 }, { d: '16 Apr', v: 4 }, { d: '17 Apr', v: 7 },
      { d: '18 Apr', v: 5 }, { d: '19 Apr', v: 1 }, { d: '20 Apr', v: 0 },
      { d: '21 Apr', v: 5 }, { d: '22 Apr', v: 6 }, { d: '23 Apr', v: 5 },
      { d: '24 Apr', v: 7 }, { d: '25 Apr', v: 6 }, { d: '26 Apr', v: 1 },
      { d: '27 Apr', v: 0 }, { d: '28 Apr', v: 6 }, { d: '29 Apr', v: 7 },
      { d: '30 Apr', v: 5 }, { d: '1 May',  v: 8 }, { d: '2 May',  v: 6 },
      { d: '3 May',  v: 2 }, { d: '4 May',  v: 0 }, { d: '5 May',  v: 6 },
    ],
    topMovers: [
      ['Modular kitchen',         4, 22],
      ['Wardrobe fit-out',        6, 18],
      ['Living room renovation',  5,  8],
      ['Master bedroom',          3, -8],
      ['Painting',                8, -24],
    ],
    insights: [
      {
        title: 'Tourist season opens in 3 weeks — 14 homestay leads in pipeline right now',
        body: "Manali tourist season peaks June–September. Homestay owners need renovations completed before June 1. You have 14 active leads, 9 of which haven't been followed up since April 28. Close them this week or lose them to Kullu-based competitors.",
        evidence: ['Lead pipeline', 'Seasonal pattern'],
        severity: 'positive',
      },
      {
        title: 'Crew at 91% utilisation — June overrun risk is real',
        body: "Four projects overlap in the second week of June. Without a 5th carpenter, at least one project will slip by 2 weeks. Labour sourcing in Manali takes 3 weeks minimum. You need to start hiring today.",
        evidence: ['Crew schedule', 'Project timeline'],
        severity: 'warning',
      },
      {
        title: 'Modular kitchen margin at 38% vs 21% for painting — mix is shifting wrong way',
        body: "April had 8 painting jobs and 4 kitchen jobs. That's the reverse of your ideal mix. Painting is filling your calendar with low-margin work and blocking high-value kitchen leads. Raising the painting minimum filters this out.",
        evidence: ['Project margins', 'Job mix'],
        severity: 'info',
      },
      {
        title: 'Client payment overdue — 2 invoices totalling ₹1.12L past 45 days',
        body: "Invoice #SI-2026-031 (₹68,000) and #SI-2026-028 (₹44,000) are both 45+ days overdue. Both clients are Manali homestay owners. At 60 days they become bad debt risk. A direct call today with a payment link recovers cash before the tourist season billing crunch.",
        evidence: ['Invoice log', 'Payment tracker'],
        severity: 'negative',
      },
    ],
    actions: [
      {
        title: 'Follow up on 9 stale homestay leads today — season opens June 1',
        body: "Last contact was April 28 or earlier. Send a WhatsApp with a 'pre-season slot' message — 3 slots left for May completion. Urgency is real: tourist season starts in 4 weeks and they need work done before guests arrive.",
        impact: '+₹1.8L pipeline',
        effort: 'Low',
        confidence: 86,
        urgent: true,
      },
      {
        title: 'Post carpenter job on ITI Manali and local WhatsApp groups today',
        body: 'ITI-trained carpenter rate in Manali is ₹620/day. Hiring takes 3 weeks. If you post today, you can have someone on-site by May 25 — just before the June crunch. Net positive at >₹60,000/mo billed work.',
        impact: 'Capacity for +2 June projects',
        effort: 'Med',
        confidence: 78,
        urgent: true,
      },
      {
        title: 'Raise painting project minimum to ₹60,000 effective May 10',
        body: "Filters low-margin jobs that are blocking your calendar. At current mix, this adds ₹22,000/mo in effective margin without losing any kitchen or wardrobe leads. Update your WhatsApp status and Google Business listing.",
        impact: '+₹22,000/mo',
        effort: 'Low',
        confidence: 80,
      },
    ],
    automations: [
      { id: 'a1', trigger: 'Project marked complete', action: 'Send 1-week follow-up + Google review request', status: 'active', last: '2 days ago' },
      { id: 'a2', trigger: 'Quote sent', action: 'Draft 3-day and 7-day WhatsApp follow-ups', status: 'active', last: 'today' },
      { id: 'a3', trigger: 'Lead inactive > 7 days', action: 'Send "pre-season slot closing" urgency message', status: 'active', last: 'yesterday' },
    ],
    suggestedAutomations: [
      { trigger: 'Crew utilisation > 90% for 5 days', action: 'Alert: begin hiring and pause new quote acceptance' },
      { trigger: 'Tourist season starts (June 1)', action: 'Activate homestay renovation campaign on Instagram and Google' },
    ],
    spendingMix: [
      { label: 'Materials',      value: 192000, color: '#15803d' },
      { label: 'Labour',         value: 148000, color: '#a16207' },
      { label: 'Subcontractors', value: 58000,  color: '#1e40af' },
      { label: 'Transport',      value: 18000,  color: '#78716c' },
      { label: 'Other',          value: 9000,   color: '#d6d3d1' },
    ],
  },
};

const BUSINESS_LIST = [
  { id: 'baker',    name: "Priya's Bakes",        desc: 'Custom cakes & baked goods, Pune',       icon: 'baker'    },
  { id: 'retail',   name: 'Vrindavan Textiles',   desc: 'Textiles & garments, Surat',             icon: 'retail'   },
  { id: 'pharmacy', name: 'Swasthya Medicals',    desc: 'Medical store, Ahmedabad',               icon: 'pharmacy' },
  { id: 'trade',    name: 'Bharat Global Exports', desc: 'Global freight & exports, Mumbai',      icon: 'trade'    },
  { id: 'service',  name: 'Skyline Interiors',    desc: 'Interiors & renovation, Manali',         icon: 'service'  },
  { id: 'cafe',     name: 'Chai Trunk',            desc: 'Chai, filter coffee & snacks, Bengaluru', icon: 'cafe'   },
];

export const ATLAS_BUSINESSES = Object.fromEntries(
  Object.entries(BUSINESSES).map(([id, biz]) => [id, { ...biz, isDemo: true }])
);
export const ATLAS_BUSINESS_LIST = BUSINESS_LIST.map(b => ({ ...b, isDemo: true }));
