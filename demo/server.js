const express = require('express');
const path = require('path');
const { scheduleHub } = require('../src/index');

const app = express();
const PORT = 3000;

// --- Initialize schedule-hub ---
const craft = new schedule-hub({ reportsDir: path.join(__dirname, 'reports') });

// --- Register some reusable actions ---
craft.action('log-result', async (input) => {
  console.log('[log-result]', JSON.stringify(input, null, 2));
  return input;
});

// --- Flow 1: Data Processing Pipeline ---
craft.flow('data-processing')
  .step('generate-data', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.round(Math.random() * 100),
      active: Math.random() > 0.3,
    }));
    return { items };
  })
  .step('filter-active', async (input) => {
    const active = input.items.filter(item => item.active);
    return { items: active, totalFiltered: input.items.length - active.length };
  })
  .step('calculate-stats', async (input) => {
    const values = input.items.map(i => i.value);
    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      filtered: input.totalFiltered,
    };
  })
  .step('log-result');

// --- Flow 2: User Sync ---
craft.flow('user-sync')
  .step('fetch-users', async () => {
    return {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
        { id: 4, name: 'Diana', email: 'diana@example.com', role: 'admin' },
      ],
    };
  })
  .step('enrich-users', async (input) => {
    return {
      users: input.users.map(u => ({
        ...u,
        lastSync: new Date().toISOString(),
        status: 'synced',
      })),
    };
  })
  .step('generate-report', async (input) => {
    return {
      totalUsers: input.users.length,
      admins: input.users.filter(u => u.role === 'admin').length,
      regularUsers: input.users.filter(u => u.role === 'user').length,
      syncedAt: new Date().toISOString(),
    };
  });

// --- Flow 3: Scheduled Health Check ---
craft.flow('health-check')
  .interval('30s')
  .step('check-services', async () => {
    const services = ['database', 'cache', 'api', 'storage'];
    return {
      services: services.map(s => ({
        name: s,
        status: Math.random() > 0.1 ? 'healthy' : 'degraded',
        responseTime: Math.round(Math.random() * 200),
        checkedAt: new Date().toISOString(),
      })),
    };
  })
  .step('evaluate-health', async (input) => {
    const unhealthy = input.services.filter(s => s.status !== 'healthy');
    return {
      overall: unhealthy.length === 0 ? 'healthy' : 'degraded',
      services: input.services,
      issues: unhealthy.map(s => s.name),
      avgResponseTime: Math.round(
        input.services.reduce((a, b) => a + b.responseTime, 0) / input.services.length
      ),
    };
  });

// --- Flow 4: Failing Import Pipeline ---
craft.flow('csv-import')
  .step('read-file', async () => {
    return {
      rows: [
        { id: 1, name: 'Widget A', price: 19.99 },
        { id: 2, name: 'Widget B', price: -5.00 },
        { id: 3, name: 'Widget C', price: 29.99 },
      ],
    };
  })
  .step('validate-rows', async (input) => {
    const invalid = input.rows.filter(r => r.price < 0);
    if (invalid.length > 0) {
      throw new Error(`Validation failed: ${invalid.length} row(s) have negative prices (ids: ${invalid.map(r => r.id).join(', ')})`);
    }
    return { validRows: input.rows };
  })
  .step('save-to-database', async (input) => {
    return { saved: input.validRows.length };
  });

// --- Mount schedule-hub (dashboard + API + schedules) ---
app.use('/schedule-hub', craft.router());

// --- Your own routes work alongside it ---
app.get('/', (req, res) => {
  res.json({ message: 'Demo API', dashboard: '/schedule-hub' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`schedule-hub dashboard: http://localhost:${PORT}/schedule-hub`);
});
    