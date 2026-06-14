# Note · 结构化记录 App

一个本地优先的记录 App：快速记录日常数据，一键导出成 ChatGPT / DeepSeek 能分析的格式。

## 三大功能

1. **一键导出给 AI** — 按时间范围把记录转成 Markdown 表格或 JSON，自带提示词，复制或分享后直接粘进 ChatGPT / DeepSeek。
2. **快捷记录 + 可选日期** — 点右下角 `+`，选预设类别（基金 / 地铁 / 早饭 / 晚饭）只填一个值即可，免手打；日期默认今天、可改成任意一天，旧记录也能编辑。
3. **可自定义类别** — 每个类别带类型（金额 / 数字 / 评分 / 文字），输入与展示更贴合。

## 进阶功能

- **趋势图** — 「趋势」标签按类别 + 时间范围（近7/30天）画折线，显示合计与记录数，纯 SVG 自绘。
- **App 内直连 AI** — 「设置」填入 DeepSeek / OpenAI 的 API Key（存设备安全存储，不上传），「分析」标签一键让 AI 直接读最近30天记录给建议。

## 运行

基于 **Expo SDK 54**，需 **Node ≥ 20.19**（本机已用 nvm 装好 Node 20）。手机端用 **Expo Go** 跑，无需安装 Android Studio：

```bash
# 每次新开终端先激活 Node 20
nvm use 20

# WSL / 跨网络环境用隧道模式，手机电脑不必同一 WiFi
npx expo start --tunnel
```

1. 手机应用商店装 **Expo Go**（需支持 SDK 54 的版本）。
2. 跑上面命令，终端会出二维码。
3. 打开 Expo Go，用里面的 **Scan QR code** 扫码（安卓别用系统相机），等十几秒即载入，改代码自动热更新。

> 同一局域网时可省去 `--tunnel`，直接 `npx expo start` 更快。
> `npm run web` 可在浏览器预览（数据走 localStorage，仅供看 UI）。

## 结构

```
App.tsx                  入口 + 导航 + 数据库初始化
src/db/schema.ts         SQLite 表结构 + 预设类别播种
src/db/queries.ts        增删改查
src/lib/exporter.ts      导出成 Markdown / JSON
src/screens/
  HomeScreen.tsx         记录列表 + 悬浮 + 按钮 + 日期分组
  EntryScreen.tsx        类别选择 + 日期选择 + 填值
  ExportScreen.tsx       导出预览 + 复制 / 分享
  TrendScreen.tsx        趋势折线图
  AnalyzeScreen.tsx      AI 一键分析
  SettingsScreen.tsx     AI 服务 / API Key 配置
src/components/
  LineChart.tsx          纯 SVG 折线图
src/lib/
  exporter.ts            导出成 Markdown / JSON
  ai.ts                  AI 配置存储 + Chat Completions 调用
docs/requirements.md     原始需求
```

## 已知边界

- **本地存储** — 数据只在本机，换设备需手动导出迁移。
- **日期可改** — 已取消当日锁定，可补填任意日期，不防造假。

## 后续可加

- 数据备份 / 跨设备同步
- 更多图表维度（频次、占比）
