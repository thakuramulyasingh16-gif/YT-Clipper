const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
  }

  createJob(params) {
    const id = uuidv4().substring(0, 8);
    const job = {
      id,
      status: 'queued',
      progress: 0,
      step: 'Initialized',
      message: 'Job queued for processing',
      logs: [`[${new Date().toLocaleTimeString()}] Job ${id} created`],
      clips: [],
      error: null,
      params,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(id) {
    return this.jobs.get(id) || null;
  }

  updateJob(id, updates) {
    const job = this.jobs.get(id);
    if (!job) return null;

    Object.assign(job, updates, { updatedAt: new Date() });
    this.emit(`job:${id}`, job);
    return job;
  }

  addLog(id, message) {
    const job = this.jobs.get(id);
    if (!job) return;

    const time = new Date().toLocaleTimeString();
    const logLine = `[${time}] ${message}`;
    job.logs.push(logLine);
    if (job.logs.length > 200) {
      job.logs.shift();
    }
    this.emit(`job:${id}`, job);
  }

  subscribe(id, callback) {
    const listener = (job) => callback(job);
    this.on(`job:${id}`, listener);
    return () => this.off(`job:${id}`, listener);
  }
}

module.exports = new JobQueue();
