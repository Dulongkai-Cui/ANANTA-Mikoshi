# 三方号资料保全索引

当前运行工作区已按SBS-0013初始化，历史账号、作品及浏览器资料独立保存在本机，不会自动回填。

## 初始化前档案

路径：[2026-10-19 初始化档案](archives/2026-10-19-initialization/README.md)。此目录被Git忽略，不能将根仓提交视为已备份这些文件。

- [账号保全表](archives/2026-10-19-initialization/三方号账号保全表.xlsx)：85个账号、374条作品关系、字段说明。
- [CSV导入底稿](archives/2026-10-19-initialization/accounts-import.csv)与[结构化账号资料](archives/2026-10-19-initialization/accounts-import.json)：UID保持文本，1个缺UID账号仍按原ID保留。
- [完整历史JSON](archives/2026-10-19-initialization/historical-data.json)：原DATA全部字段及媒体、来源关系。
- `browser/`与`manual-accounts.json`：实际导出的Chrome和应用内浏览器127.0.0.1:3108资料；0个人工账号、1条取消排期。其他origin未冒充已导出，旧存储键仍保留。
- `runtime-before/`：初始化前生成产物与hash记录。

## 维护与恢复

优先查看/维护XLSX；CSV通过Excel“从文本/CSV”导入并将ID/UID设为文本。不要用数值格式保存长UID。历史供应商与人工归属分别维护，不把财义改成伏羲，不按昵称合并账号。

本轮没有批量导入UI。未来导入从上述底稿映射，先校验UID/稳定ID、人工归属与运营状态，再导入选定账号；不应把374条历史作品自动视为新发布。恢复本机资料须选择浏览器、origin、身份，校验后合并，避免覆盖初始化后新资料。

生成策略为 `frontend/mikoshi-web/scripts/legacy-data-policy.json` 的 `thirdparty: empty`；本机活动仓储为 `mikoshi:third-party:initial-20261019:<encodedUserId>`，旧 `v1` 原串保留且不读取。不再使用旧三方个人透视/布局作为初始状态；KOL与认证/个人偏好不变。

证据与范围见[SBS-0013](../../SBS/SBS-0013-third-party-initialization.md)。归档留本机，尚未提交或上传。
