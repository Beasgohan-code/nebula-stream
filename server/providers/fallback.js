export function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function timeBudget(ms = 25000) {
  const deadline = Date.now() + ms;
  return {
    expired: () => Date.now() >= deadline,
    remaining: () => Math.max(0, deadline - Date.now()),
  };
}

export async function withFallback(providers, fn, label = 'operation', timeoutMs = 8000) {
  const errors = [];
  for (const provider of providers) {
    try {
      const result = await withTimeout(fn(provider), timeoutMs);
      if (result !== null && result !== undefined) {
        if (Array.isArray(result) && result.length === 0) continue;
        return { result, provider, errors };
      }
    } catch (err) {
      errors.push({ provider, error: err.message });
    }
  }
  throw new Error(
    errors.length
      ? `All ${errors.length} sources failed for ${label}`
      : `No results from any source for ${label}`
  );
}

export async function mergeResultsConcurrent(factories, limit = 24, concurrency = 2) {
  const merged = [];
  const seen = new Set();

  for (let i = 0; i < factories.length; i += concurrency) {
    const batch = factories.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map((fn) => fn()));
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const items = Array.isArray(r.value) ? r.value : [];
      for (const item of items) {
        const key = item.title?.toLowerCase()?.trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
        if (merged.length >= limit) return merged;
      }
    }
  }
  return merged;
}

export async function mergeResults(tasks, limit = 24) {
  const results = await Promise.allSettled(tasks);
  const merged = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value || []);
  const seen = new Set();
  return merged.filter((item) => {
    const key = item.title?.toLowerCase()?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

export async function runPool(items, fn, concurrency = 2) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((item) => fn(item)));
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value != null) results.push(r.value);
    }
  }
  return results;
}

export function safe(fn, fallback = null) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch {
      return fallback;
    }
  };
}

function normalizeTitle(t) {
  return t?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
}

export function titleMatch(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  return na.includes(nb) || nb.includes(na) || na === nb;
}
