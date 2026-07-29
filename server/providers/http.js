import axios from 'axios';
import { sleep } from './ratelimit.js';

function parseRetryAfter(headers) {
  const raw = headers?.['retry-after'];
  if (!raw) return null;
  const secs = parseInt(raw, 10);
  if (!Number.isNaN(secs)) return secs * 1000;
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

export function isRateLimitError(err) {
  const status = err?.response?.status;
  const msg = err?.message || '';
  return status === 429 || /429|rate.?limit|too many/i.test(msg);
}

export async function axiosRetry(config, opts = {}) {
  const {
    retries = 2,
    baseDelayMs = 1200,
    maxDelayMs = 8000,
    timeout = 10000,
  } = opts;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios({ timeout, ...config });
      if (res.status === 429) {
        const wait = parseRetryAfter(res.headers) || Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
        if (attempt < retries) {
          await sleep(wait);
          continue;
        }
        const err = new Error('Rate limited — try again in a moment');
        err.response = res;
        throw err;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries && isRateLimitError(err)) {
        const wait =
          parseRetryAfter(err.response?.headers) ||
          Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
