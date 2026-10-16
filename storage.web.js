const STORAGE_KEY = 'school-management-v4';

export async function loadSnapshot() {
  if (!globalThis.localStorage) throw new Error('Browser storage is unavailable.');
  const raw = globalThis.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveSnapshot(snapshot) {
  if (!globalThis.localStorage) throw new Error('Browser storage is unavailable.');
  const next = { ...snapshot, updatedAt: new Date().toISOString() };
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
