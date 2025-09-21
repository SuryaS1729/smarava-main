import * as SQLite from 'expo-sqlite';

export type WordRow = {
  id: number;
  text: string;
  source_url?: string | null;
  source_app?: string | null;
  created_at: string;  // ISO
  updated_at: string;  // ISO
  deleted_at?: string | null;
};

const db = SQLite.openDatabaseSync("smara.db");

export function initDb() {
  db.execSync("PRAGMA journal_mode = WAL;");
  db.execSync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      source_url TEXT,
      source_app TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_words_created_at
      ON words (created_at DESC);
  `);
}

// CRUD helpers
export function insertWord(text: string, opts?: { url?: string; app?: string }) {
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO words (text, source_url, source_app, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [text.trim(), opts?.url ?? null, opts?.app ?? null, now, now]
  );
}

export function getRecentWords(limit = 200): WordRow[] {
  return db.getAllSync<WordRow>(
    `SELECT * FROM words
     WHERE deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );
}

export function softDeleteWord(id: number) {
  const now = new Date().toISOString();
  db.runSync(`UPDATE words SET deleted_at=? WHERE id=?`, [now, id]);
}
