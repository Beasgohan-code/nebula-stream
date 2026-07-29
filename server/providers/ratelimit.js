class RateLimiter {
  constructor(minIntervalMs = 500) {
    this.minInterval = minIntervalMs;
    this.last = 0;
    this.queue = [];
    this.running = false;
  }

  async schedule(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.pump();
    });
  }

  async pump() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const wait = Math.max(0, this.minInterval - (Date.now() - this.last));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      const job = this.queue.shift();
      if (!job) break;
      this.last = Date.now();
      try {
        job.resolve(await job.fn());
      } catch (err) {
        job.reject(err);
      }
    }
    this.running = false;
  }
}

export const anilistLimiter = new RateLimiter(650);
export const mangadexLimiter = new RateLimiter(450);
export const consumetLimiter = new RateLimiter(300);

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
