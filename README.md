# schedule-hub

A Power Automate-like workflow automation package for Node.js. Define, visualize, execute, and monitor data flows with a beautiful web dashboard.

## Features

- **Visual Flow Builder** - Chain actions together with a clean, intuitive API
- **Execution Reports** - Every run is saved with full input/output per step and timing
- **Scheduling** - Cron expressions and interval-based triggers
- **Rerun Capability** - Re-execute past flows with exact same inputs
- **Source Code Inspection** - View the JavaScript source for each step
- **Professional Dashboard** - Clean, minimalist UI inspired by Power Automate
- **Express Integration** - Mount as a middleware, serves dashboard + API + scheduling

## Installation

### As a Package

```bash
npm install schedule-hub
```

schedule-hub requires `express` as a peer dependency:

```bash
npm install express
```

### For Development / Demo

Clone this repo and install:

```bash
npm install
cd demo && npm install
npm start
```

Visit `http://localhost:3000/schedule-hub`

## Quick Start

```js
const express = require('express');
const { schedule-hub } = require('schedule-hub');

const app = express();
const craft = new schedule-hub({ reportsDir: './reports' });

// Define a flow
craft.flow('my-pipeline')
  .step('fetch-data', async () => {
    return { items: [1, 2, 3, 4, 5] };
  })
  .step('filter-even', async (input) => {
    return input.items.filter(n => n % 2 === 0);
  })
  .step('sum', async (input) => {
    return { total: input.reduce((a, b) => a + b, 0) };
  });

// Mount schedule-hub (serves dashboard + API + schedules)
app.use('/schedule-hub', craft.router());

app.listen(3000, () => {
  console.log('Dashboard: http://localhost:3000/schedule-hub');
});
```

## API

### Creating Flows

```js
craft.flow(name)
  .cron('0 9 * * *')           // or .interval('5m')
  .step(name, async (input) => {
    // input = output of previous step
    return { /* output */ };
  })
  .step(name2, async (input) => {
    // ...
  });
```

### Running Flows

```js
// Manual run
const report = await craft.run('my-flow', { initialData: 'value' });

// Rerun with exact same inputs
const report = await craft.rerun('my-flow', 'execution-id');

// Start all scheduled flows
craft.start();
```

### Reusable Actions

```js
craft.action('log-result', async (input) => {
  console.log(input);
  return input;
});

craft.flow('another-flow')
  .step('do-stuff', async () => { /* ... */ })
  .step('log-result');  // Reference by name
```

## Dashboard

The dashboard is accessible at the mount path (default: `/schedule-hub`). It provides:

- **Flow Graph** - Visual representation of each flow's steps
- **Flow Source** - Click any step to view its JavaScript code
- **Execution History** - Browse all past runs with filtering
- **Detailed Reports** - See input/output/errors for each step
- **Manual Triggers** - Run flows on-demand
- **Rerun Capability** - Re-execute past flows

## Report Format

Each execution is saved as JSON in `reportsDir/<flow-name>/<exec-id>.json`:

```json
{
  "id": "exec-abc123",
  "flow": "my-pipeline",
  "trigger": "manual",
  "status": "success",
  "startedAt": "2026-06-17T10:30:00Z",
  "completedAt": "2026-06-17T10:30:01Z",
  "initialInput": null,
  "steps": [
    {
      "action": "fetch-data",
      "source": "async () => { ... }",
      "input": null,
      "output": { "items": [1, 2, 3, 4, 5] },
      "duration": 45,
      "status": "success"
    }
  ]
}
```

## API Endpoints

- `GET /` - Dashboard HTML
- `GET /api/flows` - List all flows with their structure
- `GET /api/flows/:name/reports` - List execution reports for a flow
- `GET /api/flows/:name/reports/:execId` - Get a specific report
- `POST /api/flows/:name/run` - Manually trigger a flow
- `POST /api/flows/:name/rerun/:execId` - Rerun a past execution
- `GET /api/reports` - List all reports across all flows

## Examples

### Health Check with Scheduling

```js
craft.flow('health-check')
  .interval('30s')
  .step('check-services', async () => {
    const services = ['api', 'db', 'cache'];
    return {
      services: services.map(s => ({
        name: s,
        status: Math.random() > 0.1 ? 'ok' : 'down'
      }))
    };
  })
  .step('alert-if-down', async (input) => {
    const down = input.services.filter(s => s.status === 'down');
    if (down.length > 0) {
      console.warn('Services down:', down);
    }
    return { alerted: down.length };
  });
```

### Data Processing Pipeline

```js
craft.flow('import-users')
  .step('read-csv', async () => {
    return { rows: [ /* ... */ ] };
  })
  .step('validate', async (input) => {
    const invalid = input.rows.filter(r => !r.email);
    if (invalid.length > 0) {
      throw new Error(`${invalid.length} rows missing email`);
    }
    return input;
  })
  .step('transform', async (input) => {
    return input.rows.map(r => ({
      ...r,
      importedAt: new Date().toISOString()
    }));
  })
  .step('save', async (input) => {
    // Save to database
    return { saved: input.length };
  });
```

## Configuration

```js
const craft = new schedule-hub({
  reportsDir: './reports',  // Where to store execution reports
  basePath: '/schedule-hub'     // Base path for router
});
```

## Project Structure

```
powerautomate-package/
  src/
    index.js              # Main export
    schedule-hub.js          # Orchestrator
    Flow.js               # Flow builder
    Action.js             # Action wrapper
    ExecutionEngine.js    # Executes flows & saves reports
    Scheduler.js          # Cron/interval scheduling
    Reporter.js           # Report I/O
    dashboard.html        # Web UI
  demo/
    server.js             # Express demo app
    package.json
  package.json
  README.md
```

## Error Handling

If a step throws, the flow stops and the error is captured in the report:

```js
craft.flow('with-error')
  .step('might-fail', async () => {
    throw new Error('Something went wrong');
  })
  .step('never-runs', async () => {
    // This won't execute
  });

// Run it
try {
  await craft.run('with-error');
} catch (err) {
  // Error from step 1
  console.error(err.message);
}
```

The report will show the error in step 1 with status `"error"`.

## Limitations

- Functions must be serializable via `.toString()` - avoid closures that depend on external scope
- Reports are stored as JSON - very large outputs may impact file size
- No built-in persistence for flow definitions (define them in code)

## License

MIT
