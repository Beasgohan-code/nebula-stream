export async function withFallback(providers, fn, label = 'operation') {
  const errors = [];
  for (const provider of providers) {
    try {
      const result = await fn(provider);
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
      ? `All sources failed for ${label}: ${errors.map((e) => e.provider).join(', ')}`
      : `No results from any source for ${label}`
  );
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
