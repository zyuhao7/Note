// 纯类型与常量，无副作用、跨平台共享。
// 实际存储实现见 queries.native.ts（SQLite）与 queries.web.ts（localStorage）。

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
  createdAt: number; // epoch ms，写入时刻，用于同日记录排序
}

// 列表查询用：记录 join 上类别信息
export interface EntryWithCategory extends Entry {
  categoryName: string;
  categoryIcon: string;
  categoryKind: CategoryKind;
}

// 趋势聚合：按天汇总某类别的数值
export interface DayPoint {
  day: string;
  total: number;
  count: number;
}

// 预设类别，对应需求里的「基金、地铁、早饭、晚饭」。
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '基金', icon: '📈', kind: 'rating', sortOrder: 0 },
  { name: '地铁', icon: '🚇', kind: 'money', sortOrder: 1 },
  { name: '早饭', icon: '🍚', kind: 'money', sortOrder: 2 },
  { name: '晚饭', icon: '🍜', kind: 'money', sortOrder: 3 },
];

// 本地日期（不依赖时区偏移），返回 YYYY-MM-DD。
export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 把存储的值解析成数值，用于聚合（去掉 ¥ 和 %）。
export function parseNumeric(value: string): number {
  const n = parseFloat(value.replace(/[¥%,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
