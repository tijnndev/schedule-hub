const fs = require('fs');
const path = require('path');

class Reporter {
  constructor(reportsDir) {
    this._reportsDir = reportsDir;
  }

  save(flowName, report) {
    const dir = path.join(this._reportsDir, flowName);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${report.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
    return filePath;
  }

  getReport(flowName, execId) {
    const filePath = path.join(this._reportsDir, flowName, `${execId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  listReports(flowName) {
    const dir = path.join(this._reportsDir, flowName);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const report = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        return {
          id: report.id,
          flow: report.flow,
          trigger: report.trigger,
          status: report.status,
          startedAt: report.startedAt,
          completedAt: report.completedAt,
          stepCount: report.steps.length,
        };
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }

  listAllReports() {
    if (!fs.existsSync(this._reportsDir)) return [];
    const flows = fs.readdirSync(this._reportsDir).filter(f =>
      fs.statSync(path.join(this._reportsDir, f)).isDirectory()
    );
    const all = [];
    for (const flow of flows) {
      all.push(...this.listReports(flow));
    }
    return all.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }
}

module.exports = Reporter;
