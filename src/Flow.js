const Action = require('./Action');

class Flow {
  constructor(name, craft) {
    this.name = name;
    this._craft = craft;
    this._steps = [];
    this._cronExpr = null;
    this._intervalMs = null;
  }

  cron(expression) {
    this._cronExpr = expression;
    return this;
  }

  interval(value) {
    if (typeof value === 'string') {
      this._intervalMs = Flow.parseInterval(value);
    } else {
      this._intervalMs = value;
    }
    return this;
  }

  step(nameOrFn, fn) {
    if (typeof nameOrFn === 'function') {
      const autoName = `step-${this._steps.length + 1}`;
      this._steps.push(new Action(autoName, nameOrFn));
    } else if (typeof nameOrFn === 'string' && typeof fn === 'function') {
      this._steps.push(new Action(nameOrFn, fn));
    } else if (typeof nameOrFn === 'string' && fn === undefined) {
      const registered = this._craft._actions.get(nameOrFn);
      if (!registered) {
        throw new Error(`Action "${nameOrFn}" is not registered. Register it with craft.action("${nameOrFn}", fn) first.`);
      }
      this._steps.push(registered);
    }
    return this;
  }

  getSteps() {
    return this._steps;
  }

  toGraph() {
    const nodes = this._steps.map((step, i) => ({
      id: `${this.name}-step-${i}`,
      label: step.name,
      index: i,
      source: step.source,
    }));

    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
      });
    }

    return {
      flow: this.name,
      schedule: this._cronExpr
        ? { type: 'cron', value: this._cronExpr }
        : this._intervalMs
          ? { type: 'interval', value: this._intervalMs }
          : null,
      nodes,
      edges,
    };
  }

  static parseInterval(str) {
    const match = str.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) throw new Error(`Invalid interval format: "${str}". Use e.g. "5m", "30s", "2h".`);
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return num * multipliers[unit];
  }
}

module.exports = Flow;
