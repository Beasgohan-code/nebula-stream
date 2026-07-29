export function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function withFallback(providers, fn, label = 'operation', timeoutMs = 12000) {
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

export async function tryAllParallel(providers, fn, limit = 24) {
  const results = await Promise.allSettled(
    providers.map((p) => withTimeout(fn(p), 15000).catch(() => []))
  );
  const merged = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (Array.isArray(r.value) ? r.value : []));
  const seen = new Set();
  return merged.filter((item) => {
    const key = item.title?.toLowerCase()?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
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
