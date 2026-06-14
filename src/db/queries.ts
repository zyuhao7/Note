// 类型解析入口（barrel）。
// 运行时 Metro 会按平台自动选 queries.native.ts 或 queries.web.ts；
// 这个文件只为 TypeScript 提供统一的导入路径与类型。
export * from './queries.native';
export type {
  Category, CategoryKind, Entry, EntryWithCategory, DayPoint,
} from './schema';
