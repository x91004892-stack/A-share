# A股短线主线选股看板 Pro

模块：
1. 大盘详细复盘与后续走势推演
2. 多板块强度评分与预测
3. 个股实时抓取、K线、支撑压力、买点/放弃条件
4. 快拉候选池
5. 持仓监控

部署：
- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

说明：
行情通过 Vercel serverless API 调用东方财富公开行情接口。若接口短暂不可用，页面会显示空数据或示例数据。
