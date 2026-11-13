# KOL历史资料与恢复入口

2026-10-19，SBS-0015初始化前完成保全。默认界面从零开始，原资料留在本地，未自动导入管理名册。

本地档案目录：`archives/2026-10-19-initialization/`（被Git忽略，不在public）。

- `profile-index.html`：浏览器可看的47条达人档案索引。
- `profiles.json`、`videos.json`：原47档案与65作品，保留原标识和字段，可供将来逐条核对导入。65作品覆盖46位发布达人，不能把两个人数混称。
- `complete-data.json`：完整14段DATA，含财务、节点报告、评论、竞品等，不删减为只有账号。
- `original-system.html.gz`、`original-kol.html.gz`：原整体系统及嵌入KOL文档，gzip解压可恢复原字节；原HTML仍在References。
- `before-*.gz`：变更前五份公开产物的恢复副本；`manifest.json`含原件映射、长度与SHA-256。

归档后已逐文件读回，并解压核对SHA。证据见[SBS-0015归档清单](../../SBS/evidence/SBS-0015/archive-manifest.json)。浏览器既有KOL缓存原串保留原位，新的管理仓储采用独立按身份隔离的key，不读取历史效果缓存。此档案不包含一次全浏览器存储导出。

需要查看历史分析时，在应用目录运行 `node scripts/sync-legacy.mjs --kol-mode=snapshot --out-dir=../../.local/kol-recovery-preview`，只生成隔离目录。不能把该目录直接作为本轮生产public发布；默认生成始终empty。gzip可用支持gzip的解压工具打开，或Node zlib.gunzipSync还原并对照manifest校验。

未来导入应映射平台+UID并复核缺失值、参考价口径、来源时间；不能仅凭昵称合并，也不能将历史效果、候选意见转换成已签约合作。当前没有批量导入UI或云端备份。
