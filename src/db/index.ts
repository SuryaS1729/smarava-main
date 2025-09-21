import * as SQLite from "expo-sqlite";

export type WordRow = {
  id: number; 
  text: string; 
  source_url?: string | null; 
  source_app?: string | null;
  created_at: string; 
  updated_at: string; 
  deleted_at?: string | null;
};

export const db = SQLite.openDatabaseSync("smara.db");

export function initDb() {
  // Log the database path for debugging
  console.log('JavaScript database info:', {
    // @ts-ignore - accessing internal property for debugging
    databaseName: db._name || 'unknown',
    // Try to get more info about the database
  });
  
  db.execSync(`
    CREATE TABLE IF NOT EXISTS words(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      source_url TEXT,
      source_app TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at DESC);
  `);
}

export function insertWord(text: string, opts?: { url?: string; app?: string }) {
  const now = new Date().toISOString();
  console.log('insertWord called with:', text, 'at', now);
  
  const result = db.runSync(
    `INSERT INTO words(text, source_url, source_app, created_at, updated_at)
     VALUES(?, ?, ?, ?, ?)`,
    [text.trim(), opts?.url ?? null, opts?.app ?? null, now, now]
  );
  
  console.log('insertWord result:', result);
}

export function getRecentWords(limit = 200): WordRow[] {
  // Add debugging
  const words = db.getAllSync<WordRow>(`
    SELECT * FROM words WHERE deleted_at IS NULL
    ORDER BY created_at DESC LIMIT ?`, [limit]);
  
  console.log(`Found ${words.length} words in database`);
  if (words.length > 0) {
    console.log('Latest 3 words:', words.slice(0, 3));
  }
  
  return words;
}

export function softDeleteWord(id: number) {
  db.runSync(`UPDATE words SET deleted_at=? WHERE id=?`, [new Date().toISOString(), id]);
}

// Add a function to check all words (including the latest)
export function getAllWordsDebug(): WordRow[] {
  const allWords = db.getAllSync<WordRow>(`
    SELECT * FROM words 
    ORDER BY id DESC LIMIT 10`);
  
  console.log('getAllWordsDebug - Total words in DB:', allWords.length);
  
  return allWords;
}