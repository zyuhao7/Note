// Web 平台存储实现：基于浏览器 localStorage（expo-sqlite 在 web 需 wasm，太重）。
// API 与 queries.native.ts 完全一致，靠 Metro 的 .web/.native 后缀自动选择。
import {
  Category, CategoryKind, Entry, EntryWithCategory, DayPoint,
  DEFAULT_CATEGORIES, parseNumeric,
} from './schema';

export { today } from './schema';

const CAT_KEY = 'note.categories';
const ENT_KEY = 'note.entries';

interface Store {
  categories: Category[];
  entries: Entry[];
  catSeq: number;
  entSeq: number;
}

function read(): Store {
  try {
    const cats = JSON.parse(localStorage.getItem(CAT_KEY) || '[]') as Category[];
    const ents = JSON.parse(localStorage.getItem(ENT_KEY) || '[]') as Entry[];
    return {
      categories: cats,
      entries: ents,
      catSeq: cats.reduce((m, c) => Math.max(m, c.id), 0),
      entSeq: ents.reduce((m, e) => Math.max(m, e.id), 0),
    };
  } catch {
    return { categories: [], entries: [], catSeq: 0, entSeq: 0 };
  }
}

function writeCats(cats: Category[]): void {
  localStorage.setItem(CAT_KEY, JSON.stringify(cats));
}
function writeEnts(ents: Entry[]): void {
  localStorage.setItem(ENT_KEY, JSON.stringify(ents));
}

export function initDb(): void {
  const { categories } = read();
  if (categories.length === 0) {
    const seeded: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: i + 1 }));
    writeCats(seeded);
  }
}

export function listCategories(): Category[] {
  return read().categories.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export function addCategory(name: string, icon: string, kind: CategoryKind): number {
  const s = read();
  const id = s.catSeq + 1;
  const sortOrder = s.categories.reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1;
  s.categories.push({ id, name, icon, kind, sortOrder });
  writeCats(s.categories);
  return id;
}

export function deleteCategory(id: number): void {
  const s = read();
  writeCats(s.categories.filter((c) => c.id !== id));
}

export function addEntry(categoryId: number, day: string, value: string, note: string): number {
  const s = read();
  const id = s.entSeq + 1;
  s.entries.push({ id, categoryId, day, value, note, createdAt: Date.now() });
  writeEnts(s.entries);
  return id;
}

export function updateEntry(
  id: number, categoryId: number, day: string, value: string, note: string
): void {
  const s = read();
  const e = s.entries.find((x) => x.id === id);
  if (e) {
    e.categoryId = categoryId;
    e.day = day;
    e.value = value;
    e.note = note;
    writeEnts(s.entries);
  }
}

export function deleteEntry(id: number): void {
  const s = read();
  writeEnts(s.entries.filter((e) => e.id !== id));
}

function join(s: Store, e: Entry): EntryWithCategory {
  const c = s.categories.find((x) => x.id === e.categoryId);
  return {
    ...e,
    categoryName: c?.name ?? '已删除',
    categoryIcon: c?.icon ?? '❓',
    categoryKind: c?.kind ?? 'text',
  };
}

export function listEntries(): EntryWithCategory[] {
  const s = read();
  return s.entries
    .map((e) => join(s, e))
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : b.createdAt - a.createdAt));
}

export function listEntriesForExport(sinceDay: string, categoryId?: number): EntryWithCategory[] {
  const s = read();
  return s.entries
    .filter((e) => e.day >= sinceDay && (categoryId == null || e.categoryId === categoryId))
    .map((e) => join(s, e))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.createdAt - b.createdAt));
}

export function aggregateByDay(categoryId: number, sinceDay: string): DayPoint[] {
  const s = read();
  const map = new Map<string, DayPoint>();
  for (const e of s.entries) {
    if (e.categoryId !== categoryId || e.day < sinceDay) continue;
    const p = map.get(e.day) ?? { day: e.day, total: 0, count: 0 };
    p.total += parseNumeric(e.value);
    p.count += 1;
    map.set(e.day, p);
  }
  return Array.from(map.values()).sort((a, b) => (a.day < b.day ? -1 : 1));
}
