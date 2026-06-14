import { EntryWithCategory, CategoryKind } from '../db/schema';

// 按类别类型给值加上单位/前缀，让 AI 一眼看懂含义。
function formatValue(value: string, kind: CategoryKind): string {
  switch (kind) {
    case 'money':
      return `¥${value}`;
    case 'rating':
      return `${value}`;
    case 'number':
      return value;
    default:
      return value;
  }
}

const PROMPT_PREFIX =
  '以下是我最近的个人记录数据，请帮我分析趋势、找出值得注意的地方，并给出实用建议：\n\n';

// 导出成 Markdown 表格，适合直接粘进 ChatGPT / DeepSeek。
export function toMarkdown(entries: EntryWithCategory[]): string {
  if (entries.length === 0) return PROMPT_PREFIX + '（暂无记录）';
  const header = '| 日期 | 类别 | 值 | 备注 |\n|---|---|---|---|';
  const rows = entries.map((e) => {
    const v = formatValue(e.value, e.categoryKind);
    const note = e.note.replace(/\|/g, '\\|') || '-';
    return `| ${e.day} | ${e.categoryIcon} ${e.categoryName} | ${v} | ${note} |`;
  });
  return PROMPT_PREFIX + header + '\n' + rows.join('\n');
}

// 导出成 JSON，适合需要结构化输入的场景。
export function toJson(entries: EntryWithCategory[]): string {
  const data = entries.map((e) => ({
    day: e.day,
    category: e.categoryName,
    kind: e.categoryKind,
    value: e.value,
    note: e.note,
  }));
  return PROMPT_PREFIX + '```json\n' + JSON.stringify(data, null, 2) + '\n```';
}
