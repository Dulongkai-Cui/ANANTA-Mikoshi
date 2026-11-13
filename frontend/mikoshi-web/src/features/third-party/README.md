# 三方号管理组件

本模块是SBS-0012的本地可编辑前端，与`features/legacy`只读历史工作台共存。没有发布接口、定时抓取、AI审核或服务端数据库。

SBS-0013已追加初始化：默认catalog为空，旧账号/作品资料在根Data/third-party归档。取消状态cancelled仍可见；撤下状态withdrawn默认从计划列表/月格/当天栏隐藏，仅显式筛选已撤下可见。恢复到planned须通过原账号与时刻冲突校验；取消/撤下不要求已失效的账号重新可用，不会撤回外站帖子。操作确认冻结版本，失败不覆盖；编辑窗口直接操作时明确放弃本窗口未保存修改。

| 文件 | 职责 |
|---|---|
| model.ts | 账号/排期/历史合同、UID/日期/档期验证、上海时间、历史与人工资料合并 |
| repository.ts | 身份隔离的schema/revision读写、损坏/配额/版本冲突、Web Locks串行写 |
| publication-provider.tsx | 身份级共享状态、目录加载、跨标签更新、保存、可恢复草稿和离页确认 |
| accounts-page.tsx / account-editor.tsx | 账号目录、归属/状态筛选、入库/资料编辑、最新3条历史作品 |
| plans-page.tsx | 同源发布计划表与分页 |
| calendar-page.tsx / calendar-dates.ts | 42格月历、日期键盘操作、日侧栏、排期/历史详情 |
| schedule-editor.tsx | 排期表单、取消恢复确认、状态与保存反馈 |

`scripts/thirdparty-library.js`仅增强旧账号/作品布局。`scripts/sync-legacy.mjs`从只读原HTML生成`public/legacy/thirdparty-catalog.json`；源hash、UID、供应商、最新3条作品保留事实，null不是0。运行时验证完整JSON；异常目录显示错误，不覆写本机数据。

活动仓储key为`mikoshi:third-party:initial-20261019:<encodedUserId>`，schema仍为1，数据代次与结构版本独立。旧`mikoshi:third-party:v1:<encodedUserId>`原串原位保留且不再读取，不在每次加载时重置新代次。新账号用`local:<uuid>`；关联原目录用`snapshot:<原profile.id>`。缺UID账号从“补充入库”进入会携带sourceAccountId，补足后仍保留原ID/作品/排期。不能用昵称合并账号。已入库UID不可换；供应商与蘑菇/伏羲归属分别记录。历史未给运营状态时显示“待确认”，内部允许排期不代表已确认运营正常。

每条排期独立ID，同账号同日多条互不覆盖。状态仅planned/cancelled，人工确认只是管理标签。逾期由上海时间派生，不生成已发布/播放数据。取消保留记录且可恢复；恢复也检查停用账号及时间冲突。停用不会删除旧计划，留待人工核对。

保存成功才更新已保存资料；失败/损坏/版本冲突均有反馈，原串保留，不seed重置。草稿在身份级内存，正常导航/换身份/关闭表单先确认，Back可返回继续，刷新关闭使用原生提示。草稿不自动落盘。

跨标签storage同步，保存带编辑起点revision。Web Locks可用时串行化读改写；不支持时只有写前版本检查，不是服务器并发保证。冲突保留输入供查看/复制，关闭重开最新记录后再应用，不提供一键强制覆盖。

选填手机号等只存当前演示身份的本机浏览器，清理站点数据会丢失，无跨端共享或生产权限。未来接后端须保留稳定ID、expectedRevision/服务端版本、真实失败回执及计划/实际分离；另建适配器与迁移流程，不能静默抹掉本地资料。

验收以根[SBS-0012](../../../../../SBS/SBS-0012-third-party-publishing.md)为准。
