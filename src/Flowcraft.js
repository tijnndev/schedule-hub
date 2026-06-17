const path = require('path');
const Flow = require('./Flow');
const Action = require('./Action');
const Scheduler = require('./Scheduler');
const Reporter = require('./Reporter');
const ExecutionEngine = require('./ExecutionEngine');

class Flowcraft {
  constructor(options = {}) {
    const reportsDir = options.reportsDir || './reports';
    this._flows = new Map();
    this._actions = new Map();
    this._reporter = new Reporter(reportsDir);
    this._engine = new ExecutionEngine(this._reporter);
    this._scheduler = new Scheduler();
    this._basePath = options.basePath || '/flowcraft';
  }

  action(name, fn) {
    const action = new Action(name, fn);
    this._actions.set(name, action);
    return this;
  }

  flow(name) {
    const flow = new Flow(name, this);
    this._flows.set(name, flow);
    return flow;
  }

  async run(name, initialInput) {
    const flow = this._flows.get(name);
    if (!flow) throw new Error(`Flow "${name}" not found.`);
    return this._engine.run(flow, initialInput, { trigger: 'manual' });
  }

  async rerun(name, execId) {
    const flow = this._flows.get(name);
    if (!flow) throw new Error(`Flow "${name}" not found.`);
    const report = this._reporter.getReport(name, execId);
    if (!report) throw new Error(`Report "${execId}" not found for flow "${name}".`);
    return this._engine.rerun(flow, report);
  }

  start() {
    for (const [, flow] of this._flows) {
      if (flow._cronExpr) {
        this._scheduler.scheduleCron(flow._cronExpr, () => {
          this._engine.run(flow, undefined, { trigger: 'cron' }).catch(console.error);
        });
      }
      if (flow._intervalMs) {
        this._scheduler.scheduleInterval(flow._intervalMs, () => {
          this._engine.run(flow, undefined, { trigger: 'interval' }).catch(console.error);
        });
      }
    }
    this._scheduler.startAll();
  }

  stop() {
    this._scheduler.stopAll();
  }

  getFlows() {
    const result = [];
    for (const [, flow] of this._flows) {
      result.push(flow.toGraph());
    }
    return result;
  }

  getReports(flowName) {
    if (flowName) return this._reporter.listReports(flowName);
    return this._reporter.listAllReports();
  }

  getReport(flowName, execId) {
    return this._reporter.getReport(flowName, execId);
  }

  router() {
    let express;
    try {
      express = require('express');
    } catch {
      throw new Error('express is required as a peer dependency. Install it with: npm install express');
    }

    const router = express.Router();
    const craft = this;

    router.use(express.json());

    // Serve dashboard
    router.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboard.html'));
    });

    // API: list flows
    router.get('/api/flows', (req, res) => {
      res.json(craft.getFlows());
    });

    // API: list reports for a flow
    router.get('/api/flows/:name/reports', (req, res) => {
      res.json(craft.getReports(req.params.name));
    });

    // API: get specific report
    router.get('/api/flows/:name/reports/:execId', (req, res) => {
      const report = craft.getReport(req.params.name, req.params.execId);
      if (!report) return res.status(404).json({ error: 'Report not found' });
      res.json(report);
    });

    // API: run a flow
    router.post('/api/flows/:name/run', async (req, res) => {
      try {
        const report = await craft.run(req.params.name, req.body.input);
        res.json(report);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // API: rerun a flow
    router.post('/api/flows/:name/rerun/:execId', async (req, res) => {
      try {
        const report = await craft.rerun(req.params.name, req.params.execId);
        res.json(report);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // API: all reports
    router.get('/api/reports', (req, res) => {
      res.json(craft.getReports());
    });

    // Auto-start schedules when router is mounted
    craft.start();

    return router;
  }
}

module.exports = Flowcraft;
