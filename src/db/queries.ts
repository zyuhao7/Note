import { getDb, Category, CategoryKind, EntryWithCategory } from './schema';

// 本地日期（不依赖时区偏移），返回 YYYY-MM-DD。
export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ----- 类别 -----

export function listCategories(): Category[] {
  return getDb().getAllSync<Category>(
    'SELECT * FROM categories ORDER BY sortOrder ASC, id ASC'
  );
}

export function addCategory(name: string, icon: string, kind: CategoryKind): number {
  const db = getDb();
  const max = db.getFirstSync<{ m: number | null }>(
    'SELECT MAX(sortOrder) AS m FROM categories'
  );
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

// ----- 记录 -----

export function addEntry(categoryId: number, day: string, value: string, note: string): number {
  const res = getDb().runSync(
    'INSERT INTO entries (categoryId, day, value, note, createdAt) VALUES (?, ?, ?, ?, ?)',
    [categoryId, day, value, note, Date.now()]
  );
  return res.lastInsertRowId;
}

export function updateEntry(id: number, value: string, note: string): void {
  getDb().runSync('UPDATE entries SET value = ?, note = ? WHERE id = ?', [value, note, id]);
}

export function deleteEntry(id: number): void {
  getDb().runSync('DELETE FROM entries WHERE id = ?', [id]);
}

// 按日期倒序拉全部记录，带类别信息，供主列表使用。
export function listEntries(): EntryWithCategory[] {
  return getDb().getAllSync<EntryWithCategory>(`
    SELECT e.*, c.name AS categoryName, c.icon AS categoryIcon, c.kind AS categoryKind
    FROM entries e
    JOIN categories c ON c.id = e.categoryId
    ORDER BY e.day DESC, e.createdAt DESC
  `);
}

// 导出用：可按起始日期与类别过滤。
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

// 趋势聚合：按天汇总某类别的数值（money/number/rating 取数值求和）。
export interface DayPoint {
  day: string;
  total: number;
  count: number;
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
