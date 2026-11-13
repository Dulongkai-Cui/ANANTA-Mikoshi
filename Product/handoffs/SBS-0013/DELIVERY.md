# SBS-0013 三方号初始化与计划撤下

日期：2026-10-19。状态：**ACCEPTED**，全部AC[独立PASS](../../../SBS/evidence/SBS-0013/independent-review.md)。当前范围以[本步SBS](../../../SBS/SBS-0013-third-party-initialization.md)为准。

## 交付内容

三方号运行区恢复空白初始状态：账号、作品、计划和日历不再加载清零前记录。七个原页面及账号入库、发布计划、发布日历保留；新录入账号和新建计划正常保存，刷新不会再次清空。KOL历史工作区与其他业务保持原状。

清零前85个历史账号、374条作品完整保全，账号可维护表格入口见[资料索引](../../../Data/third-party/README.md)。XLSX/CSV/JSON三种形式均可追溯原ID与UID；42个超过15位的UID按文本保留，1个缺UID不补造。完整原DATA含头像、作品全部字段和来源，未局限于目录最近3条视频。

浏览器实测保全仅覆盖Chrome及Codex应用内浏览器的 `http://127.0.0.1:3108`。Chrome有2个三方号存储键：0个人工账号、1条已取消排期及布局；应用内浏览器无三方号键。原旧键保持不变，未访问的localhost/其他端口不能称为已导出。导出为只读操作，首次下载等待超时后通过可见备份原文保存，非伪称下载成功。临时public保全页已移除。

## 取消、撤下与恢复

计划表、日历右侧详情、计划编辑窗口均可操作：

- **取消计划**：保留可见记录，标为已取消，可恢复或继续撤下。
- **撤下计划**：从默认计划表、日历和当天列表移走，状态筛选“已撤下”中仍可查看。
- **恢复计划**：从已取消或已撤下恢复为已计划；账号不可用或同时间冲突时拒绝，并保留原记录。

每次操作先确认，返回不写入；操作只影响指定排期，同日其他记录不变。编辑窗口内操作会明确说明未保存修改不保存。存储失败/跨窗口冲突不冒充成功；撤下是本机计划状态，不撤回任何B站帖子。

## 实现与恢复边界

生成策略 `scripts/legacy-data-policy.json` 默认empty，强制生成和缺失/损坏修复后也不重种历史。public三方HTML仅含空态模板，catalog为空，summary计数0、日期null；KOL HTML与两个原始HTML hash不变。历史功能保留在原件和显式snapshot生成模式，可在独立目录验证，不污染默认运行区。

本机schema仍为1，活动数据代次换为 `mikoshi:third-party:initial-20261019:<encodedUserId>`。旧v1键和旧legacy个人数据原位保留但不参加活动视图；没有调用全站clear、删除认证或清理偏好。若未来恢复，应按浏览器/origin/身份校验迁移，不能直接覆盖初始化后新资料。

批量导入UI、服务端同步、真实发布/撤稿、采集、AI及部署本轮未实现。CSV在Excel应从文本导入且ID/UID列设为文本，优先直接使用XLSX。

## 验证入口

- [账号表核对](../../../SBS/evidence/SBS-0013/archive-saved-file-validation.json)：85账号、374关系、全部UID、CSV/JSON及原DATA一致；3张工作表已渲染检查，未启动桌面Excel。
- [生成侧报告](../../../SBS/evidence/SBS-0013/legacy-delivery.md)：30相关单测、七页桥接与7图、持久empty和KOL保全。
- [浏览器保全](../../../SBS/evidence/SBS-0013/browser-preservation.json)：实际覆盖、原串hash与方法。
- `SBS/evidence/SBS-0013/build-r2.log`、`lint-r2.log`：最终r2生产构建含TypeScript及lint通过；`unit.log`记录203/203单测通过。
- [浏览器测试](../../../SBS/evidence/SBS-0013/browser-tests.md)：r1完整85项中82通过、3失败，原75项全部通过。三处新测试的等待/规范化地址问题修正后，r2定向9/9通过；未改变业务预期、未删除失败证据，不能称作单次85/85。r1至r2实现仅修改登录、顶栏提示与侧栏页脚三处文案。
- [测试修改映射](../../../SBS/evidence/SBS-0013/test-change-map.md)：8个历史专用场景显式使用隔离snapshot夹具，实际初始化场景不拦截生产数据；历史夹具不覆盖public。
- `source-sha256.json` / `source-changes.json`记录最终源码与SBS-0012基线差异，独立报告统一复算；构建前后KOL及原资料指纹保持一致。
- 手机深色截图等待抽屉卸载后单项补采1/1通过，原无效采样保留；[最终9图](../../../SBS/evidence/SBS-0013/final-visual-index.md)均独立目视通过。132源码指纹复算零差异，初始化说明问题R13-01已闭环。

## Git与资料位置

根main，HEAD `5d888802504073bfa1f52f000848c6c18baabba4`，本轮未暂存/提交/推送/部署。既有未提交成果保留；子仓未改。

账号与恢复包保存在 `Data/third-party/archives/2026-10-19-initialization/`，该目录已Git忽略，包含可能存在的人工管理信息，未上传或放入public。原始需求/HTML/品牌仍在原位；根Git提交不等于这些本地归档已同步。
