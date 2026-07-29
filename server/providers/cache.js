const store = new Map();
const MAX_ENTRIES = 500;

export function getCache(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function setCache(key, value, ttlMs = 60000) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export async function cached(key, ttlMs, fn) {
  const hit = getCache(key);
  if (hit !== undefined) return hit;

  const pendingKey = `pending:${key}`;
  const pending = getCache(pendingKey);
  if (pending) return pending;

  const promise = Promise.resolve()
    .then(fn)
    .then((value) => {
      setCache(key, value, ttlMs);
      store.delete(pendingKey);
      return value;
    })
    .catch((err) => {
      store.delete(pendingKey);
      throw err;
    });

  store.set(pendingKey, { value: promise, expires: Date.now() + 30000 });
  return promise;
}

export function cacheKey(...parts) {
  return parts.map((p) => String(p)).join(':');
}
