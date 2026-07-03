// GigVault local database layer.
// Uses expo-sqlite. All data stays on-device — no Firestore, no backend,
// consistent with the Whop-only distribution decision.

import * as SQLite from 'expo-sqlite';

let db;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('gigvault.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS platforms (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      platform_id TEXT,
      amount REAL NOT NULL,
      hours REAL,
      miles REAL,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_entries_platform ON entries(platform_id);
  `);

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized — call initDatabase() first.');
  return db;
}

// ---------- Settings (key/value) ----------

export async function getSetting(key, fallback = null) {
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export async function setSetting(key, value) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, serialized]
  );
}

// ---------- Onboarding completion flag ----------

export async function isOnboardingComplete() {
  return (await getSetting('onboarding_complete', false)) === true;
}

export async function markOnboardingComplete() {
  await setSetting('onboarding_complete', true);
}

// ---------- Platforms ----------

export async function seedPlatforms(selectedPlatforms) {
  // selectedPlatforms: [{ id, name, icon, color }]
  for (const p of selectedPlatforms) {
    await db.runAsync(
      'INSERT INTO platforms (id, name, icon, color, is_active) VALUES (?, ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET is_active = 1',
      [p.id, p.name, p.icon, p.color]
    );
  }
}

export async function getActivePlatforms() {
  return db.getAllAsync('SELECT * FROM platforms WHERE is_active = 1');
}

// ---------- Entries ----------

export async function addEntry({ id, type, platformId, amount, hours, miles, note, createdAt }) {
  await db.runAsync(
    `INSERT INTO entries (id, type, platform_id, amount, hours, miles, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, type, platformId ?? null, amount, hours ?? null, miles ?? null, note ?? '', createdAt]
  );
}

export async function getEntriesBetween(startISO, endISO) {
  return db.getAllAsync(
    `SELECT e.*, p.name as platform_name, p.color as platform_color
     FROM entries e LEFT JOIN platforms p ON e.platform_id = p.id
     WHERE e.created_at >= ? AND e.created_at <= ?
     ORDER BY e.created_at DESC`,
    [startISO, endISO]
  );
}

export async function getAllEntries() {
  return db.getAllAsync(
    `SELECT e.*, p.name as platform_name, p.color as platform_color
     FROM entries e LEFT JOIN platforms p ON e.platform_id = p.id
     ORDER BY e.created_at DESC`
  );
}

export async function getWeekTotals(startISO, endISO) {
  const entries = await getEntriesBetween(startISO, endISO);
  const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  return { income, expense, net: income - expense, entries };
}

export async function getPlatformBreakdown(startISO, endISO) {
  const rows = await db.getAllAsync(
    `SELECT p.name, p.color, e.type, SUM(e.amount) as total
     FROM entries e LEFT JOIN platforms p ON e.platform_id = p.id
     WHERE e.created_at >= ? AND e.created_at <= ?
     GROUP BY e.platform_id, e.type`,
    [startISO, endISO]
  );
  return rows;
}

export async function getMileageTotal(startISO, endISO) {
  const row = await db.getFirstAsync(
    'SELECT SUM(miles) as total FROM entries WHERE created_at >= ? AND created_at <= ? AND miles IS NOT NULL',
    [startISO, endISO]
  );
  return row?.total ?? 0;
}
