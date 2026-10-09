# Contributing / 贡献指南

Use Node.js 22+ and npm. Keep changes focused, preserve real-data accuracy and never silently substitute demo data for failed lookups.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

Run `npm run format` to format source. Add meaningful tests when changing statistics, thresholds, Steam input validation, privacy handling or caching. UI fixes should include desktop and mobile verification.

Do not commit API keys, `.env.local`, account cookies or private libraries. Report security issues privately to the repository maintainer rather than attaching sensitive data to a public issue. Sanitized errors and minimal reproduction steps are sufficient.

修改计算逻辑时同步更新 `docs/DATA.md`、界面说明与测试。提交 UI 修改时检查中英文、深浅色与减弱动画模式。Demo 样例始终必须显式标注。
