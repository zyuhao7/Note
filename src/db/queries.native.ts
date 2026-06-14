// 原生平台（iOS/Android）存储实现：基于 expo-sqlite。
import * as SQLite from 'expo-sqlite';
import {
  Category, CategoryKind, EntryWithCategory, DayPoint, DEFAULT_CATEGORIES,
} from './schema';

export { today } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('note.db');
  }
  return _db;
}

export function initDb(): void {
  const db = getDb();
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📝',
      kind TEXT NOT NULL DEFAULT 'text',
      sortOrder INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER NOT NULL,
      day TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );
    CREATE INDEX IF NOT EXISTS idx_entries_day ON entries(day);
  `);

  const row = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM categories');
  if (row && row.c === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      db.runSync(
        'INSERT INTO categories (name, icon, kind, sortOrder) VALUES (?, ?, ?, ?)',
        [cat.name, cat.icon, cat.kind, cat.sortOrder]
      );
    }
  }
}

export function listCategories(): Category[] {
  return getDb().getAllSync<Category>(
    'SELECT * FROM categories ORDER BY sortOrder ASC, id ASC'
  );
}

export function addCategory(name: string, icon: string, kind: CategoryKind): number {
  const db = getDb();
  const max = db.getFirstSync<{ m: number | null }>('SELECT MAX(sortOrder) AS m FROM categories');
  const sortOrder = (max?.m ?? -1) + 1;
  const res = db.runSync(
    'INSERT INTO categories (name, icon, kind, sortOrder) VALUES (?, ?, ?, ?)',
    [name, icon, kind, sortOrder]
  );
  return res.lastInsertRowId;
}

export function deleteCategory(id: number): void {
  getDb().runSync('DELETE FROM categories WHERE id = ?', [id]);
}

export function addEntry(categoryId: number, day: string, value: string, note: string): number {
  const res = getDb().runSync(
    'INSERT INTO entries (categoryId, day, value, note, createdAt) VALUES (?, ?, ?, ?, ?)',
    [categoryId, day, value, note, Date.now()]
  );
  return res.lastInsertRowId;
}

export function updateEntry(
  id: number, categoryId: number, day: string, value: string, note: string
): void {
  getDb().runSync(
    'UPDATE entries SET categoryId = ?, day = ?, value = ?, note = ? WHERE id = ?',
    [categoryId, day, value, note, id]
  );
}

export function deleteEntry(id: number): void {
  getDb().runSync('DELETE FROM entries WHERE id = ?', [id]);
}

export function listEntries(): EntryWithCategory[] {
  return getDb().getAllSync<EntryWithCategory>(`
    SELECT e.*, c.name AS categoryName, c.icon AS categoryIcon, c.kind AS categoryKind
    FROM entries e JOIN categories c ON c.id = e.categoryId
    ORDER BY e.day DESC, e.createdAt DESC
  `);
}

export function listEntriesForExport(sinceDay: string, categoryId?: number): EntryWithCategory[] {
  const db = getDb();
  if (categoryId != null) {
    return db.getAllSync<EntryWithCategory>(
      `SELECT e.*, c.name AS categoryName, c.icon AS categoryIcon, c.kind AS categoryKind
       FROM entries e JOIN categories c ON c.id = e.categoryId
       WHERE e.day >= ? AND e.categoryId = ?
       ORDER BY e.day ASC, e.createdAt ASC`,
      [sinceDay, categoryId]
    );
  }
  return db.getAllSync<EntryWithCategory>(
    `SELECT e.*, c.name AS categoryName, c.icon AS categoryIcon, c.kind AS categoryKind
     FROM entries e JOIN categories c ON c.id = e.categoryId
     WHERE e.day >= ?
     ORDER BY e.day ASC, e.createdAt ASC`,
    [sinceDay]
  );
}

export function aggregateByDay(categoryId: number, sinceDay: string): DayPoint[] {
  return getDb().getAllSync<DayPoint>(
    `SELECT day,
            COALESCE(SUM(CAST(REPLACE(REPLACE(value, '¥', ''), '%', '') AS REAL)), 0) AS total,
            COUNT(*) AS count
     FROM entries
     WHERE categoryId = ? AND day >= ?
     GROUP BY day
     ORDER BY day ASC`,
    [categoryId, sinceDay]
  );
}
