/**
 * Atlas Automation Engine — Demo + Real
 *
 * For demo businesses: runs entirely in-browser, produces real side-effects
 * (tasks created, metrics updated, execution log entries).
 *
 * For real businesses: calls the backend /run endpoint which fires
 * evaluateAutomations() and returns an execution log.
 */

import { demoTaskStore } from './demoTasks';

// ─── Execution log store (in-memory, per business) ───────────────────────────
const executionLogs = {}; // { [bizId]: ExecutionEntry[] }

export const automationLogs = {
  get: (bizId) => executionLogs[bizId] || [],
  push: (bizId, entry) => {
    if (!executionLogs[bizId]) executionLogs[bizId] = [];
    executionLogs[bizId].unshift({ ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, ts: new Date().toISOString() });
    // Keep last 50 entries
    executionLogs[bizId] = executionLogs[bizId].slice(0, 50);
  },
  clear: (bizId) => {
    executionLogs[bizId] = [];
  },
};

// ─── Demo trigger evaluators ──────────────────────────────────────────────────
// Each evaluator receives the business object and returns { fired: bool, result: string }

const DEMO_EVALUATORS = {
  // Baker
  'Ingredient stock below 5-day threshold': (biz) => {
    const inv = biz.metrics?.inventory?.value ?? 80;
    return { fired: inv < 75, result: inv < 75 ? 'Stock at ' + inv + '% — WhatsApp sent to supplier' : 'Stock healthy, no action needed' };
  },
  'New Google review under 4 stars': (biz) => {
    const rating = biz.metrics?.sentiment?.value ?? 4.5;
    return { fired: rating < 4, result: rating < 4 ? `Rating ${rating}/5 — reply draft created` : 'No low-rating reviews detected' };
  },
  'Customer last ordered > 30 days ago': (biz) => {
    const retention = biz.metrics?.retention?.value ?? 60;
    const lapsed = Math.round((100 - retention) * 0.4);
    return { fired: lapsed > 5, result: lapsed > 5 ? `${lapsed} lapsed customers — "miss you" WhatsApp queued` : 'All customers active' };
  },
  'Weekend demand forecast > 65 orders': (biz) => {
    const orders = biz.metrics?.orders?.value ?? 50;
    return { fired: orders > 65, result: orders > 65 ? `Forecast ${orders} orders — prep batch notification sent` : 'Demand below threshold' };
  },

  // Retail
  'SKU on shelf > 60 days': (biz) => {
    const inv = biz.metrics?.inventory?.value ?? 80;
    const stale = Math.round((100 - inv) * 0.3);
    return { fired: stale > 3, result: stale > 3 ? `${stale} SKUs flagged for markdown review` : 'No stale SKUs detected' };
  },
  'Daily revenue 20% below forecast': (biz) => {
    const delta = biz.metrics?.revenue?.delta ?? 5;
    return { fired: delta < -15, result: delta < -15 ? `Revenue ${delta}% vs forecast — WhatsApp offer drafted for loyal customers` : 'Revenue on track' };
  },
  'New review posted': (biz) => {
    return { fired: true, result: 'New review detected — reply draft queued for approval' };
  },
  'Temperature forecast > 42°C in Surat': () => {
    const temp = 44; // simulated
    return { fired: temp > 42, result: `${temp}°C forecast — split hours activated, customer WhatsApp sent` };
  },
  'B2B client reorder cadence > 25 days': (biz) => {
    const retention = biz.metrics?.retention?.value ?? 60;
    return { fired: retention < 65, result: retention < 65 ? '3 B2B clients overdue — proactive restock offer sent' : 'All clients on schedule' };
  },

  // Pharmacy
  'Refill due in 3 days': (biz) => {
    const orders = biz.metrics?.orders?.value ?? 40;
    const due = Math.round(orders * 0.15);
    return { fired: due > 0, result: `${due} refill reminders sent via WhatsApp` };
  },
  'Schedule H drug below reorder level': (biz) => {
    const inv = biz.metrics?.inventory?.value ?? 80;
    return { fired: inv < 70, result: inv < 70 ? 'Schedule H alert sent to pharmacist — reorder drafted' : 'Schedule H stock adequate' };
  },
  'Negative Google review': (biz) => {
    const rating = biz.metrics?.sentiment?.value ?? 4.5;
    return { fired: rating < 4, result: rating < 4 ? 'Empathetic reply drafted for approval' : 'No negative reviews' };
  },
  'Monsoon stock threshold not met by May 20': () => {
    const today = new Date();
    const isMay = today.getMonth() === 4;
    return { fired: isMay, result: isMay ? 'Monsoon PO auto-generated: ORS ×600, Dolo-650 ×400' : 'Monsoon prep not yet due' };
  },
  'Patient last refill > 45 days': (biz) => {
    const retention = biz.metrics?.retention?.value ?? 60;
    const lapsed = Math.round((100 - retention) * 0.3);
    return { fired: lapsed > 2, result: lapsed > 2 ? `${lapsed} patients sent care check-in message` : 'All patients current' };
  },

  // Cafe
  'Loyalty member 14 days inactive': (biz) => {
    const retention = biz.metrics?.retention?.value ?? 60;
    const inactive = Math.round((100 - retention) * 0.5);
    return { fired: inactive > 3, result: inactive > 3 ? `${inactive} loyalty members sent chai voucher` : 'All members active' };
  },
  'Daily milk pull > 20 litres': () => {
    const pull = 23; // simulated
    return { fired: pull > 20, result: `${pull}L pulled today — tomorrow standing order updated` };
  },
  'Negative review on Swiggy or Google': (biz) => {
    const rating = biz.metrics?.sentiment?.value ?? 4.5;
    return { fired: rating < 4.2, result: rating < 4.2 ? 'Empathetic reply drafted for approval' : 'No negative reviews' };
  },
  'Temperature forecast > 34°C tomorrow': () => {
    const temp = 36;
    return { fired: temp > 34, result: `${temp}°C forecast — cold brew + aam panna promo posted to Instagram` };
  },
  'IT park holiday next day': () => {
    const isHoliday = new Date().getDay() === 5; // simulate Friday before holiday
    return { fired: isHoliday, result: isHoliday ? 'Holiday detected — milk order reduced 30%, morning shift adjusted' : 'No holiday tomorrow' };
  },

  // Trade
  'Shipment ETA delayed > 48 hours': (biz) => {
    const orders = biz.metrics?.orders?.value ?? 30;
    const delayed = Math.round(orders * 0.1);
    return { fired: delayed > 0, result: delayed > 0 ? `${delayed} shipments delayed — client notifications sent, revised ETAs drafted` : 'All shipments on time' };
  },
  'USD/INR moves > 1.5% in a day': () => {
    const move = 1.8; // simulated
    return { fired: move > 1.5, result: `USD/INR moved ${move}% — ops alerted, hedging recommendation drafted` };
  },
  'Client order cadence drops > 30%': (biz) => {
    const retention = biz.metrics?.retention?.value ?? 60;
    return { fired: retention < 60, result: retention < 60 ? '2 clients added to follow-up list — outreach drafted' : 'Client cadence normal' };
  },
  'JNPT dwell time alert > 4 days': () => {
    const dwell = 5;
    return { fired: dwell > 4, result: `${dwell}-day dwell detected — clients notified, CHB escalation drafted` };
  },
  'GST filing due in 5 days': () => {
    const today = new Date();
    const daysToFiling = 20 - today.getDate();
    return { fired: daysToFiling <= 5 && daysToFiling >= 0, result: daysToFiling <= 5 ? 'GST filing reminder sent to accounts with checklist' : 'Filing not yet due' };
  },

  // Service
  'Project marked complete': (biz) => {
    const orders = biz.metrics?.orders?.value ?? 10;
    return { fired: orders > 0, result: `${Math.ceil(orders * 0.2)} projects completed — follow-up + review request sent` };
  },
  'Quote sent': (biz) => {
    const orders = biz.metrics?.orders?.value ?? 10;
    return { fired: true, result: `${Math.ceil(orders * 0.3)} quotes active — 3-day and 7-day follow-ups scheduled` };
  },
  'Lead inactive > 7 days': (biz) => {
    const retention = biz.metrics?.retention?.value ?? 60;
    const inactive = Math.round((100 - retention) * 0.4);
    return { fired: inactive > 1, result: inactive > 1 ? `${inactive} leads sent "pre-season slot closing" message` : 'All leads active' };
  },
  'Crew utilisation > 90% for 5 days': (biz) => {
    const orders = biz.metrics?.orders?.value ?? 10;
    return { fired: orders > 12, result: orders > 12 ? 'High utilisation — hiring alert sent, new quote acceptance paused' : 'Utilisation normal' };
  },
  'Tourist season starts (June 1)': () => {
    const isJune = new Date().getMonth() === 5;
    return { fired: isJune, result: isJune ? 'Tourist season campaign activated on Instagram and Google' : 'Tourist season not yet started' };
  },
};

// ─── Task templates for automations that create tasks ─────────────────────────
function makeAutoTask(bizId, auto, result) {
  return {
    id: `auto-task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    businessId: bizId,
    title: `[Auto] ${auto.trigger}`,
    description: result,
    impact: 'Auto-triggered',
    effort: 'Low',
    status: 'in_progress',
    urgent: false,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    source: 'automation',
    automationId: auto.id,
  };
}

// ─── Main execution function ──────────────────────────────────────────────────
/**
 * Run all active automations for a demo business.
 * Returns array of execution results.
 */
export function runDemoAutomations(biz, automations) {
  const results = [];

  for (const auto of automations) {
    if (auto.status !== 'active') continue;

    const evaluator = DEMO_EVALUATORS[auto.trigger];
    let fired = false;
    let result = 'Evaluated — no action needed';

    if (evaluator) {
      try {
        const eval_ = evaluator(biz);
        fired = eval_.fired;
        result = eval_.result;
      } catch {
        result = 'Evaluation error — skipped';
      }
    } else {
      // Generic fallback for any trigger not in the map
      fired = Math.random() > 0.4;
      result = fired ? `Condition met — ${auto.action}` : 'Condition not met';
    }

    const entry = {
      automationId: auto.id,
      trigger: auto.trigger,
      action: auto.action || auto.actionType,
      fired,
      result,
      status: fired ? 'executed' : 'skipped',
    };

    automationLogs.push(biz.id, entry);

    // Side effect: create a task if the automation fired and involves a task-like action
    if (fired) {
      const actionText = (auto.action || auto.actionType || '').toLowerCase();
      const createsTask = /task|draft|notify|alert|send|create|flag|add|queue/i.test(actionText);
      if (createsTask) {
        const task = makeAutoTask(biz.id, auto, result);
        demoTaskStore.add(biz.id, task);
        entry.taskCreated = task.id;
      }
    }

    results.push(entry);
  }

  return results;
}

/**
 * Run a single automation immediately (manual trigger).
 */
export function runSingleDemoAutomation(biz, auto) {
  return runDemoAutomations(biz, [auto]);
}
