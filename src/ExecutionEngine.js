const { v4: uuidv4 } = require('uuid');

class ExecutionEngine {
  constructor(reporter) {
    this._reporter = reporter;
  }

  async run(flow, initialInput, options = {}) {
    const execId = uuidv4();
    const steps = flow.getSteps();
    const report = {
      id: execId,
      flow: flow.name,
      trigger: options.trigger || 'manual',
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      initialInput: initialInput !== undefined ? initialInput : null,
      steps: [],
    };

    let currentInput = initialInput;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepReport = {
        index: i,
        action: step.name,
        source: step.source || null,
        input: this._safeClone(currentInput),
        output: null,
        error: null,
        duration: 0,
        status: 'running',
      };

      const start = Date.now();
      try {
        const output = await step.execute(currentInput);
        stepReport.output = this._safeClone(output);
        stepReport.status = 'success';
        stepReport.duration = Date.now() - start;
        currentInput = output;
      } catch (err) {
        stepReport.error = { message: err.message, stack: err.stack };
        stepReport.status = 'error';
        stepReport.duration = Date.now() - start;
        report.steps.push(stepReport);
        report.status = 'error';
        report.completedAt = new Date().toISOString();
        this._reporter.save(flow.name, report);
        throw err;
      }

      report.steps.push(stepReport);
    }

    report.status = 'success';
    report.completedAt = new Date().toISOString();
    this._reporter.save(flow.name, report);

    return report;
  }

  async rerun(flow, report) {
    return this.run(flow, report.initialInput, { trigger: 'rerun' });
  }

  _safeClone(value) {
    if (value === undefined) return null;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
}

module.exports = ExecutionEngine;
