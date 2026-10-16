import * as SQLite from 'expo-sqlite';

const DB_NAME = 'school-management.db';
let dbPromise;

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL);');
      return db;
    })();
  }
  return dbPromise;
}

export async function loadSnapshot() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT payload FROM app_state WHERE id = 1');
  return row ? JSON.parse(row.payload) : null;
}

export async function saveSnapshot(snapshot) {
  const next = { ...snapshot, updatedAt: new Date().toISOString() };
  const serialized = JSON.stringify(next);
  const db = await getDb();
  await db.runAsync('INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at', serialized, next.updatedAt);
  return next;
}
