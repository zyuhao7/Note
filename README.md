# Note · 结构化记录 App

一个本地优先的记录 App：快速记录日常数据，一键导出成 ChatGPT / DeepSeek 能分析的格式。

## 三大功能

1. **一键导出给 AI** — 按时间范围把记录转成 Markdown 表格或 JSON，自带提示词，复制或分享后直接粘进 ChatGPT / DeepSeek。
2. **快捷记录 + 当日锁定** — 点右下角 `+`，选预设类别（基金 / 地铁 / 早饭 / 晚饭）只填一个值即可，免手打；新记录只能归属当天，旧记录只读（软锁防手滑）。
3. **可自定义类别** — 每个类别带类型（金额 / 数字 / 评分 / 文字），输入与展示更贴合。

## 运行

需要 **Node ≥ 20.19**（本机已用 nvm 装好 Node 20）：

```bash
# 每次新开终端先激活 Node 20
nvm use 20

npm start          # 启动打包器，手机装 Expo Go 扫码即可预览
npm run android    # 连真机/模拟器跑安卓
npm run web        # 浏览器预览
```

## 结构

```
App.tsx                  入口 + 导航 + 数据库初始化
src/db/schema.ts         SQLite 表结构 + 预设类别播种
src/db/queries.ts        增删改查
src/lib/exporter.ts      导出成 Markdown / JSON
src/screens/
  HomeScreen.tsx         记录列表 + 悬浮 + 按钮 + 日期分组软锁
  EntryScreen.tsx        类别选择 + 填值
  ExportScreen.tsx       导出预览 + 复制 / 分享
docs/requirements.md     原始需求
```

## 已知边界

- **软锁不防改时钟** — 锁定只挡误改旧账，改设备时间仍可造假；要真防篡改需服务器时间戳。
- **本地存储** — 数据只在本机，换设备需手动导出迁移。

## 后续可加

- 趋势图（花销 / 频次可视化）
- App 内直接调 AI API 出建议
- 数据备份 / 跨设备同步
