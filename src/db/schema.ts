import * as SQLite from 'expo-sqlite';

// 本地优先存储：所有记录存在设备本地 SQLite。
// 记录 = 日期 + 类别 + 类型 + 值 + 备注 + 时间戳。

export type CategoryKind = 'money' | 'number' | 'rating' | 'text';

export interface Category {
  id: number;
  name: string;
  icon: string; // emoji
  kind: CategoryKind;
  sortOrder: number;
}

export interface Entry {
  id: number;
  categoryId: number;
  day: string; // YYYY-MM-DD，记录归属的日期
  value: string; // 统一存字符串，按 kind 解释
  note: string;
  createdAt: number; // epoch ms，写入时刻，用于软锁判断
}

// 列表查询用：记录 join 上类别信息
export interface EntryWithCategory extends Entry {
  categoryName: string;
  categoryIcon: string;
  categoryKind: CategoryKind;
}

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('note.db');
  }
  return _db;
}

// 预设类别，对应需求里的「基金、地铁、早饭、晚饭」。
const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '基金', icon: '📈', kind: 'rating', sortOrder: 0 },
  { name: '地铁', icon: '🚇', kind: 'money', sortOrder: 1 },
  { name: '早饭', icon: '🍚', kind: 'money', sortOrder: 2 },
  { name: '晚饭', icon: '🍜', kind: 'money', sortOrder: 3 },
];

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

  // 首次启动播种默认类别
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
