const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');

const seed = async () => {
  console.log('🌱 Seeding database...');

  // 1. Create Default User
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('atlas123', salt);

  const user = await prisma.user.upsert({
    where: { email: 'demo@atlas.ai' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@atlas.ai',
      password: hashedPassword,
    },
  });

  console.log('✅ User created');

  // 2. Full Sample Data for 6 Indian Demo Businesses (from src/data.jsx)
  const businesses = [
    {
      id: 'baker',
      name: "Priya's Bakes",
      type: 'Home Baker',
      category: 'Food & Beverage',
      location: 'Pune, Maharashtra',
      initials: 'PB',
      color: '#a16207',
      owner: 'Priya',
      peakHours: JSON.stringify([[5,10,25,38,30,20,14,10,7,5,3,2],[5,12,28,40,32,22,16,12,9,6,4,2],[6,14,30,42,34,24,18,13,10,7,5,3],[8,18,35,46,38,28,20,16,13,10,6,4],[12,26,48,58,50,36,26,20,18,16,12,8],[32,62,82,90,80,66,52,42,30,22,14,8],[22,50,70,76,66,52,38,28,20,14,9,5]]),
      revenueSeries: JSON.stringify([{m:'Nov',v:128000},{m:'Dec',v:104000},{m:'Jan',v:68000},{m:'Feb',v:74000},{m:'Mar',v:86000},{m:'Apr',v:89000},{m:'May',v:94800}]),
      ordersSeries: JSON.stringify([{d:'Mon',v:28},{d:'Tue',v:32},{d:'Wed',v:36},{d:'Thu',v:30},{d:'Fri',v:48},{d:'Sat',v:58},{d:'Sun',v:42}]),
      customerGrowth: JSON.stringify([{m:'Nov',v:180},{m:'Dec',v:210},{m:'Jan',v:234},{m:'Feb',v:258},{m:'Mar',v:284},{m:'Apr',v:318},{m:'May',v:352}]),
      topMovers: JSON.stringify([['Chocolate truffle cake',284,22],['Ladoo box (12 pc)',192,48],['Eggless brownie',168,14],['Custom birthday cake',28,-8],['Cookie hamper',112,16]]),
      spendingMix: JSON.stringify([{label:'Ingredients',value:32400,color:'#a16207'},{label:'Packaging',value:5800,color:'#78716c'},{label:'Delivery',value:4200,color:'#1e40af'},{label:'Marketing',value:2400,color:'#15803d'},{label:'Other',value:1200,color:'#d6d3d1'}]),
      metrics: [
        { key: 'revenue', value: 94800, delta: 8.2, label: 'Revenue', unit: '₹', period: 'this month' },
        { key: 'orders', value: 246, delta: 12.4, label: 'Orders', period: 'this month' },
        { key: 'conversion', value: 4.2, delta: -0.3, label: 'Conversion', unit: '%', period: 'website' },
        { key: 'inventory', value: 87, delta: 2.1, label: 'Inventory health', unit: '%' },
        { key: 'retention', value: 68, delta: 5.0, label: 'Repeat customers', unit: '%' },
        { key: 'sentiment', value: 4.7, delta: 0.1, label: 'Review sentiment', unit: '/5' },
      ],
      insights: [
        { title: 'Diwali orders 3x normal — pre-booking window opens in 8 weeks', body: 'November revenue hit ₹1.28L on gift hamper orders. WhatsApp enquiries started 6 weeks before.', severity: 'positive', evidence: JSON.stringify(['Order history', 'Seasonal pattern']) },
        { title: 'Custom cake margin at 48% — highest in your menu', body: 'Custom celebration cakes average ₹2,400 and take similar effort as a cookie box.', severity: 'info', evidence: JSON.stringify(['Order mix', 'COGS log']) },
        { title: 'Maida and butter costs up 18% since February', body: 'Input costs rose after commodity price hike. Eggless cake margin dropped from 42% to 34%.', severity: 'warning', evidence: JSON.stringify(['COGS log', 'Supplier invoices']) },
      ],
      actions: [
        { title: 'Launch Diwali pre-booking on WhatsApp in July', body: 'Message your repeat customers with a ₹500 advance deposit option.', impact: '+₹52,000', effort: 'Low', confidence: '88%', urgent: false },
        { title: 'Reorder maida and sugar by Thursday', body: 'At current bake rate you will run short before Saturday rush.', impact: 'Avoid stockout', effort: 'Low', confidence: '96%', urgent: true },
      ]
    },
    {
      id: 'retail',
      name: 'Vrindavan Textiles',
      type: 'Retail Shop',
      category: 'Textiles',
      location: 'Surat, Gujarat',
      initials: 'VT',
      color: '#1e40af',
      owner: 'Rajesh',
      peakHours: JSON.stringify([[4,8,22,38,36,28,24,30,38,44,32,18],[4,8,24,40,38,30,26,32,40,46,34,20],[5,10,26,42,40,32,28,34,42,48,36,22],[6,12,28,44,42,34,30,36,44,50,38,24],[8,16,34,50,46,38,34,42,58,75,68,42],[15,30,58,72,66,56,50,56,64,60,46,28],[8,20,42,56,50,40,32,36,40,38,26,14]]),
      revenueSeries: JSON.stringify([{m:'Nov',v:780000},{m:'Dec',v:540000},{m:'Jan',v:480000},{m:'Feb',v:520000},{m:'Mar',v:560000},{m:'Apr',v:560000},{m:'May',v:584000}]),
      ordersSeries: JSON.stringify([{d:'Mon',v:168},{d:'Tue',v:192},{d:'Wed',v:208},{d:'Thu',v:224},{d:'Fri',v:268},{d:'Sat',v:242},{d:'Sun',v:156}]),
      customerGrowth: JSON.stringify([{m:'Nov',v:1640},{m:'Dec',v:1820},{m:'Jan',v:1880},{m:'Feb',v:1960},{m:'Mar',v:2040},{m:'Apr',v:2120},{m:'May',v:2240}]),
      topMovers: JSON.stringify([['Silk saree',284,18],['Cotton salwar set',412,8],['Printed kurti',368,24],['Bridal lehenga',8,-22],['Chanderi dupatta',128,12]]),
      spendingMix: JSON.stringify([{label:'Fabric stock',value:280000,color:'#1e40af'},{label:'Rent',value:42000,color:'#a16207'},{label:'Staff',value:68000,color:'#15803d'},{label:'Marketing',value:18000,color:'#78716c'},{label:'Other',value:8000,color:'#d6d3d1'}]),
      metrics: [
        { key: 'revenue', value: 584000, delta: 4.1, label: 'Revenue', unit: '₹', period: 'this month' },
        { key: 'orders', value: 1480, delta: -2.1, label: 'Orders', period: 'this month' },
        { key: 'inventory', value: 72, delta: -3.0, label: 'Inventory health', unit: '%' },
        { key: 'retention', value: 44, delta: 1.2, label: 'Repeat customers', unit: '%' },
      ],
      insights: [
        { title: 'Navratri and wedding season — 6 weeks away', body: 'Chaniya choli and bridal lehenga orders spike 280% in Sept–Oct in Surat.', severity: 'positive', evidence: JSON.stringify(['Sales history', 'Seasonal pattern']) },
        { title: 'Polyester stock ageing — 18 SKUs unsold for 60+ days', body: 'Holding cost is ₹18,400 per month. Summer buyers prefer cotton.', severity: 'warning', evidence: JSON.stringify(['Inventory age', 'Season data']) },
      ],
      actions: [
        { title: 'Place festive season stock order by 15 July', body: 'Lock in chaniya choli and lehenga fabric before price increase.', impact: '+₹2.4L season', effort: 'Med', confidence: '86%', urgent: false },
      ]
    },
    {
      id: 'pharmacy',
      name: 'Swasthya Medicals',
      type: 'Pharmacy',
      category: 'Healthcare',
      location: 'Ahmedabad, Gujarat',
      initials: 'SM',
      color: '#15803d',
      owner: 'Dr. Anjali',
      peakHours: JSON.stringify([[20,72,88,80,68,58,44,36,28,22,14,8],[18,68,84,76,64,54,40,32,24,18,12,6],[16,64,80,72,60,50,38,30,22,16,10,5],[14,60,76,68,56,46,34,28,20,14,9,4],[18,70,86,78,66,56,42,34,26,20,12,6],[10,38,60,72,64,50,38,28,20,14,8,4],[4,12,24,36,32,24,18,12,8,6,3,2]]),
      revenueSeries: JSON.stringify([{m:'Nov',v:920000},{m:'Dec',v:940000},{m:'Jan',v:920000},{m:'Feb',v:940000},{m:'Mar',v:960000},{m:'Apr',v:960000},{m:'May',v:980000}]),
      ordersSeries: JSON.stringify([{d:'Mon',v:520},{d:'Tue',v:498},{d:'Wed',v:484},{d:'Thu',v:462},{d:'Fri',v:528},{d:'Sat',v:412},{d:'Sun',v:284}]),
      customerGrowth: JSON.stringify([{m:'Nov',v:2680},{m:'Dec',v:2720},{m:'Jan',v:2760},{m:'Feb',v:2800},{m:'Mar',v:2840},{m:'Apr',v:2880},{m:'May',v:2940}]),
      topMovers: JSON.stringify([['Paracetamol 500mg',684,4],['Cetirizine 10mg',520,38],['Vitamin D3 sachet',312,22],['BP monitor (Omron)',18,-6],['Cough syrup',248,14]]),
      spendingMix: JSON.stringify([{label:'Medicines',value:580000,color:'#15803d'},{label:'Staff',value:248000,color:'#a16207'},{label:'Rent',value:68000,color:'#1e40af'},{label:'Other',value:32000,color:'#78716c'}]),
      metrics: [
        { key: 'revenue', value: 980000, delta: 2.8, label: 'Revenue', unit: '₹' },
        { key: 'orders', value: 2840, delta: 1.4, label: 'Prescriptions filled' },
        { key: 'inventory', value: 94, delta: 0.8, label: 'Inventory health', unit: '%' },
      ],
      insights: [
        { title: 'Monsoon medicines — demand surge in 6 weeks', body: 'ORS and paracetamol spike 60–80% in July–August in Ahmedabad.', severity: 'positive', evidence: JSON.stringify(['Rx history', 'Seasonal pattern']) },
        { title: 'Tuesday afternoons understaffed', body: 'Target is 15 minutes wait time. Current average is 24 minutes.', severity: 'warning', evidence: JSON.stringify(['Fill timing', 'Complaint log']) },
      ],
      actions: [
        { title: 'Stock 500 ORS + 200 paracetamol strips by June 15', body: "Prevents stockout during peak monsoon.", impact: 'Prevent ₹42k miss', effort: 'Low', confidence: '90%', urgent: true },
      ]
    },
    {
      id: 'cafe',
      name: 'Chai Trunk',
      type: 'Cafe',
      category: 'Food & Beverage',
      location: 'Bengaluru, Karnataka',
      initials: 'CT',
      color: '#7c2d12',
      owner: 'Arjun',
      peakHours: JSON.stringify([[55,90,82,68,72,60,42,30,20,14,8,5],[52,88,80,65,70,58,40,28,18,12,7,4],[58,92,84,70,74,62,44,32,22,16,9,5],[60,94,86,72,76,64,46,34,24,18,10,6],[62,90,84,70,74,62,50,38,28,22,14,8],[38,72,80,76,68,58,50,44,38,30,22,14],[28,60,72,68,60,50,42,36,28,22,16,9]]),
      revenueSeries: JSON.stringify([{m:'Nov',v:224000},{m:'Dec',v:240000},{m:'Jan',v:218000},{m:'Feb',v:234000},{m:'Mar',v:248000},{m:'Apr',v:256000},{m:'May',v:264000}]),
      ordersSeries: JSON.stringify([{d:'Mon',v:840},{d:'Tue',v:812},{d:'Wed',v:868},{d:'Thu',v:892},{d:'Fri',v:964},{d:'Sat',v:724},{d:'Sun',v:588}]),
      customerGrowth: JSON.stringify([{m:'Nov',v:920},{m:'Dec',v:980},{m:'Jan',v:1060},{m:'Feb',v:1160},{m:'Mar',v:1280},{m:'Apr',v:1420},{m:'May',v:1560}]),
      topMovers: JSON.stringify([['Masala chai',1284,18],['Filter coffee',924,8],['Vada pav',612,24],['Samosa',488,14],['Cold brew',224,56]]),
      spendingMix: JSON.stringify([{label:'Dairy',value:88000,color:'#7c2d12'},{label:'Snacks',value:32000,color:'#a16207'},{label:'Staff',value:72000,color:'#15803d'},{label:'Rent',value:36000,color:'#1e40af'},{label:'Other',value:8000,color:'#78716c'}]),
      metrics: [
        { key: 'revenue', value: 264000, delta: 6.2, label: 'Revenue', unit: '₹' },
        { key: 'orders', value: 5840, delta: 8.1, label: 'Transactions' },
        { key: 'retention', value: 62, delta: 3.2, label: 'Repeat customers', unit: '%' },
      ],
      insights: [
        { title: 'Swiggy/Zomato commission eroding ₹28k/mo', body: 'Platform orders are 38% of revenue but margin drops to 12%.', severity: 'warning', evidence: JSON.stringify(['Channel mix', 'Margin']) },
      ],
      actions: [
        { title: 'Add QR + WhatsApp ordering for direct delivery', body: 'Remove Swiggy for nearby delivery under 1km.', impact: '+₹18,000/mo', effort: 'Med', confidence: '84%', urgent: false },
      ]
    },
    {
      id: 'trade',
      name: 'Bharat Global Exports',
      type: 'Import/Export',
      category: 'Trade',
      location: 'Mumbai, Maharashtra',
      initials: 'BG',
      color: '#1e40af',
      owner: 'Vikram',
      peakHours: JSON.stringify([[2,12,55,72,68,80,76,64,58,42,22,8],[2,10,52,68,64,76,72,60,54,38,20,6],[2,12,56,70,66,78,74,62,56,40,22,7],[2,14,60,74,70,82,78,66,60,44,24,8],[2,12,54,68,64,74,70,58,52,36,18,5],[1,4,10,16,14,12,10,8,6,4,2,1],[1,2,4,6,5,4,3,2,2,1,1,1]]),
      revenueSeries: JSON.stringify([{m:'Nov',v:3200000},{m:'Dec',v:3480000},{m:'Jan',v:3120000},{m:'Feb',v:3280000},{m:'Mar',v:3360000},{m:'Apr',v:3280000},{m:'May',v:3240000}]),
      ordersSeries: JSON.stringify([{d:'Mon',v:6},{d:'Tue',v:4},{d:'Wed',v:5},{d:'Thu',v:7},{d:'Fri',v:4},{d:'Sat',v:1},{d:'Sun',v:1}]),
      customerGrowth: JSON.stringify([{m:'Nov',v:34},{m:'Dec',v:36},{m:'Jan',v:38},{m:'Feb',v:40},{m:'Mar',v:42},{m:'Apr',v:44},{m:'May',v:46}]),
      topMovers: JSON.stringify([['Cotton fabric',8,22],['Handicraft',12,-4],['Spices',6,18],['Garments',14,8],['Leather',4,-16]]),
      spendingMix: JSON.stringify([{label:'Goods',value:1960000,color:'#1e40af'},{label:'Logistics',value:580000,color:'#a16207'},{label:'Customs',value:180000,color:'#15803d'},{label:'Staff',value:140000,color:'#78716c'}]),
      metrics: [
        { key: 'revenue', value: 3240000, delta: -1.4, label: 'Revenue', unit: '₹' },
        { key: 'orders', value: 22, delta: 12.0, label: 'Shipments' },
      ],
      insights: [
        { title: 'JNPT congestion adding 5–7 days to May shipments', body: 'Three UAE shipments risk ₹2.8L penalty exposure.', severity: 'warning', evidence: JSON.stringify(['Port data', 'Manifest']) },
      ],
      actions: [
        { title: 'Pre-clear May UAE shipments via CHB', body: 'Fast-track costs ₹18,000 but avoids ₹2.8L penalty.', impact: 'Avoid ₹2.8L penalty', effort: 'Med', confidence: '88%', urgent: true },
      ]
    },
    {
      id: 'service',
      name: 'Skyline Interiors',
      type: 'Service Business',
      category: 'Real Estate',
      location: 'Gurugram, Haryana',
      initials: 'SI',
      color: '#15803d',
      owner: 'Neha',
      peakHours: JSON.stringify([[2,18,58,72,74,68,62,70,66,48,22,6],[2,20,62,76,78,72,66,74,70,52,24,7],[2,18,60,74,76,70,64,72,68,50,22,6],[2,22,66,80,82,76,70,78,74,56,26,8],[2,18,56,68,70,64,58,64,60,44,20,5],[1,6,14,22,20,16,12,10,8,6,3,1],[1,2,3,4,3,3,2,2,1,1,1,1]]),
      revenueSeries: JSON.stringify([{m:'Nov',v:340000},{m:'Dec',v:300000},{m:'Jan',v:280000},{m:'Feb',v:380000},{m:'Mar',v:420000},{m:'Apr',v:448000},{m:'May',v:496000}]),
      ordersSeries: JSON.stringify([{d:'Mon',v:4},{d:'Tue',v:5},{d:'Wed',v:5},{d:'Thu',v:6},{d:'Fri',v:4},{d:'Sat',v:1},{d:'Sun',v:0}]),
      customerGrowth: JSON.stringify([{m:'Nov',v:78},{m:'Dec',v:82},{m:'Jan',v:88},{m:'Feb',v:96},{m:'Mar',v:106},{m:'Apr',v:118},{m:'May',v:132}]),
      topMovers: JSON.stringify([['Modular kitchen',4,22],['Wardrobe fit-out',6,18],['Renovation',5,8]]),
      spendingMix: JSON.stringify([{label:'Materials',value:192000,color:'#15803d'},{label:'Labour',value:148000,color:'#a16207'},{label:'Sub-contractors',value:58000,color:'#1e40af'}]),
      metrics: [
        { key: 'revenue', value: 496000, delta: 11.8, label: 'Revenue', unit: '₹' },
        { key: 'orders', value: 11, delta: 16.0, label: 'Active projects' },
      ],
      insights: [
        { title: 'Modular kitchen jobs at 38% margin', body: 'Kitchen projects contribute 80% of gross profit.', severity: 'info', evidence: JSON.stringify(['Margins', 'Job mix']) },
      ],
      actions: [
        { title: 'Raise painting project minimum to ₹60,000', body: 'Filters low-margin jobs.', impact: '+₹22k/mo', effort: 'Low', confidence: '80%', urgent: false },
      ]
    }
  ];

  for (const bData of businesses) {
    const { metrics, insights, actions, ...bizFields } = bData;
    
    const biz = await prisma.business.upsert({
      where: { id: bizFields.id },
      update: bizFields,
      create: {
        ...bizFields,
        userId: user.id
      }
    });

    // Create metrics
    for (const m of metrics) {
      await prisma.metric.upsert({
        where: { businessId_key: { businessId: biz.id, key: m.key } },
        update: m,
        create: { ...m, businessId: biz.id }
      });
    }

    // Create insights (use title as unique-ish identifier for seed)
    for (const i of insights) {
      await prisma.insight.create({
        data: { ...i, businessId: biz.id }
      });
    }

    // Create actions
    for (const a of actions) {
      await prisma.action.create({
        data: { ...a, businessId: biz.id }
      });
    }
    
    console.log(`✅ Seeded ${bizFields.name}`);
  }

  console.log('🚀 Seeding complete!');
};

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
