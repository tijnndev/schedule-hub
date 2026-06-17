const cron = require('node-cron');

class Scheduler {
  constructor() {
    this._jobs = [];
  }

  scheduleCron(expression, fn) {
    const job = cron.schedule(expression, fn, { scheduled: false });
    this._jobs.push(job);
    return job;
  }

  scheduleInterval(ms, fn) {
    const id = setInterval(fn, ms);
    this._jobs.push({ id, stop: () => clearInterval(id), start: () => {} });
    return id;
  }

  startAll() {
    for (const job of this._jobs) {
      if (typeof job.start === 'function') {
        job.start();
      }
    }
  }

  stopAll() {
    for (const job of this._jobs) {
      if (typeof job.stop === 'function') {
        job.stop();
      }
    }
    this._jobs = [];
  }
}

module.exports = Scheduler;
