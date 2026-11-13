# GitHub 协作交接（2026-11-13）

当前源码已整理为独立私有协作仓库；运行入口见根 README，范围见 docs/SOURCE_SCOPE.md。本仓库不包含历史私有验收截图/日志或数据库；下列链接为原工作区追溯记录。SBS-0023 的云端验收仍为 VERIFYING。

# 当前交接

2026-11-08 [SBS-0023](../../SBS/SBS-0023-invitation-registration-check.md) **VERIFYING**：已证实用户原码为已领取的首管理员单次码；按追加授权实现长期可多人注册/可撤销editor码与20秒身份请求期限。源码独立审查、隔离SQLite23、前端身份27和真实本机HTTP16项通过。现役原管理员账号登录200，新协议存在，正式团队邀请创建201且active/reusable/永不过期；原码仅在Git忽略、仅当前Windows用户与SYSTEM可读的私有文件，见[非敏感交付证据](../../SBS/evidence/SBS-0023/DELIVERY.md)。未创建生产测试成员，未消费用户码。昨晚发布任务t-hk072e8d9jlrzls结果未读取，不能据此断言exit0/双库备份保全均完成；阿里云登录已过期且CUA连续超时，已请求用户登录。不要重复生成团队码、重跑发行或恢复旧数据库。既有最高管理员和用户新数据保留。无commit/push。

2026-11-07 [SBS-0022](../../SBS/SBS-0022-kol-overview-label.md) **ACCEPTED，独立AC1–AC3 PASS**：KOL“首页”已改为“发布效果总览”，原地址和12项平铺不变。阿里云f1c88f9ee47ccf7cd060于20:28:59上线；双库备份 `/var/backups/mikoshi/deploy-20261107T122855387131Z` 完整性通过。[证据](../../SBS/evidence/SBS-0022/DELIVERY.md)。用户随后要求检查指定邀请码不能注册，不把本步文案验收扩展为注册已复验。

2026-11-07 最新 [SBS-0021](../../SBS/SBS-0021-kol-navigation-trim.md) **ACCEPTED，独立AC1–AC5 PASS**：KOL收敛为12项平铺，撤下指定旧页和分组。阿里云已上线3389e84bb2cc62d4b6ec，桌面/390、旧链和搜索通过。数据库最终保全核验通过；发布期间脑暴组件12→15，旧数据完全保留，按原12条上限轮转的历史仍在before备份。最新state90043cbbc24d3ad204330e6e1a691d525204927386831ce40e0db1363dfb2fa0；不能沿用0020/本步before旧hash。两库最终备份 /var/backups/mikoshi/sbs0021-final-20261107T111059452867Z。[交付与真实限制](../../SBS/evidence/SBS-0021/DELIVERY.md)。

2026-11-07 最新 [SBS-0020](../../SBS/SBS-0020-retire-unused-boards.md) **ACCEPTED**：备份数据库并撤下联动管理/创意管理独立板块，KOL内部创意保留。云备份 `/var/backups/mikoshi/sbs0020-before-20261107T101714659449Z` 两库完整性PASS，最新963 UP / 98创意 / 12历史；更新前后state和完整业务库逻辑dump、用户记录相同。阿里云已上线23bd9fa557ac985eca35，四入口、搜索/旧链及KOL十页实测通过，独立AC1–AC5 PASS。[交付、备份与限制](../../SBS/evidence/SBS-0020/DELIVERY.md)。下文0019的96创意及旧hash是历史验收，不可覆盖此后用户编辑。

2026-11-07 当前工作为 [SBS-0019](../../SBS/SBS-0019-kol-migration-cloud.md) **ACCEPTED**。用户明确要求完整复制KOL系统、将整个Mikoshi部署阿里云、邀请码注册。源2042文件/472,013,458字节保全；本机与云端现有KOL state hash一致，963 UP / 96创意。十模块嵌入、真实身份网关及邀请管理已实现；252前端+4桥接+33身份/网关独立通过，TS/lint/production构建通过。本机浏览器十页、详情、保存跨刷新、未保存保护、390/1440检查见[记录](../../SBS/evidence/SBS-0019/browser-verification.md)。

**阿里云已实际部署**：[团队入口](https://8.218.158.143/mikoshi/login)，release `3f56e5a25ec9ed7c09a1`，2026-11-07 16:30:03上线。2100项严格清单通过；新服务开机启动、每日备份启用，新服务重启前后HTTPS鉴权检查通过，旧脑图及KOL运行。云端现役state SHA仍为原值，963 UP / 96创意 / 11历史完整。部署前恢复点 `/var/backups/mikoshi/deploy-20261107T082959323428Z`。[云端证据](../../SBS/evidence/SBS-0019/cloud-deployment.md)保留初次失败与自动回滚；临时上传key已撤销。

**最高权限账号已就绪**：按用户明确指定，`pipikaikaichu@gmail.com`已通过生产HTTPS API和一次性bootstrap邀请注册为admin（当前最高权限）。密码只在进程内使用。真实注册、登录、邀请创建/撤销、注销后重新登录通过；Chrome十页、泛式20条作品及共创明细、管理员设置、实际退出/重登录通过，控制台无error。浏览器保留已登录工作区。见[身份验收](../../SBS/evidence/SBS-0019/cloud-owner-account.json)与[云端浏览器验收](../../SBS/evidence/SBS-0019/cloud-browser-verification.json)。独立AC1–AC6已全部PASS，见[最终报告](../../SBS/evidence/SBS-0019/independent-review.md)。

当前本机3119为临时测试库；旧3108/Windows计划任务未恢复验证，不能沿用下方历史记录声称仍可用。其他业务仍为浏览器存储，KOL工作室才是本步已迁入的团队共享数据。

## 历史记录（SBS-0018及以前，不代表当前SBS-0019验收）

2026-10-22 19:44例行恢复：原自启动任务曾运行后退出，退出原因未确认；已重新运行Mikoshi-Preview-AtLogon，任务Running、Node PID21996，仅127.0.0.1:3108。本机与原公网/login均200，BUILD_ID仍qeil5n2-jXfFUSNRKAkiL；日志及恢复记录见SBS-0018末尾。未改业务代码/数据或启动机制。后续业务修改等待用户具体需求。

2026-10-20最新：[SBS-0018](../../SBS/SBS-0018-preview-autostart.md) ACCEPTED，[独立AC1–AC4 PASS](../../SBS/evidence/SBS-0018/independent-review.md)。用户已选登录Windows自启动；专属任务Mikoshi-Preview-AtLogon已注册并运行，普通权限、当前用户登录后延迟15秒，Node PID15488，仅127.0.0.1:3108。本机及既有公网login均200；重复启动、停止释放端口、重新启动已实测。127项业务资产指纹不变。[使用/启停说明](SBS-0018/DELIVERY.md)。下方未设置自启动和手动PID为历史记录，已由本步替代；未实际注销或重启电脑。

2026-10-20 22:03再次恢复：系统21:26重启，cpolar自动启动但Mikoshi未自启，造成3108拒绝连接和公网502。已启动现有构建PID50716，本机及原公网/login均HTTP200。根因及日志见SBS-0017末尾；未设置登录自启动，偏好待用户回复。下方16:24恢复为历史记录，PID20800已随重启结束。

2026-10-20例行恢复：cpolar原隧道在线，3108应用进程停止；已后台启动现有构建（PID20800），本机/公网登录HTTP200且Chrome登录页实测恢复。分享链接仍为 https://49a01cfd.r39.cpolar.top/login 。未改源码、业务资料或隧道配置；未设置开机自启动。恢复过程见SBS-0017末尾。

更新日期：2026-10-19。当前[SBS-0017](../../SBS/SBS-0017-cpolar-preview.md) **ACCEPTED**：用户确认公开演示范围后，已通过 cpolar Web UI 配置同事预览入口 https://49a01cfd.r39.cpolar.top/login ，隧道 mikoshi-preview 仅 HTTPS → 127.0.0.1:3108。公网登录、工作台和 KOL/三方加载已实测，[独立 AC1–3 PASS](../../SBS/evidence/SBS-0017/independent-review.md)；保留一次 KOL 首次超时后恢复的限制。[使用、启动和停止说明](SBS-0017/DELIVERY.md)。资料仍各自浏览器保存；未改业务源码，未形成正式多人部署。

前序[SBS-0016](../../SBS/SBS-0016-marketing-workbench.md) **ACCEPTED**：用户指定PM原型的核心组件已融合到“我的工作台”。使用方法与版本边界见[交付说明](SBS-0016/DELIVERY.md)，完整原型研究见[来源映射](SBS-0016/SOURCE_MAP.md)，验收见[独立报告](../../SBS/evidence/SBS-0016/independent-review.md)。

## 当前交付

/dashboard为营销项目总览，下设任务看板/表格、任务甘特与事件线、人员进度、KOL协作概览。项目设置可维护成员/模块及首页区块显隐和顺序。任务与节点可新增、编辑、删除；线删除保留节点。包含本机提醒、CSV导出、JSON备份追加导入、明确的只读示例。

新工作区独立身份命名空间，旧dashboard布局原串不读写。KOL协作概览消费既有KOL合同，没有第二份名册。默认零态，示例不落盘。不接原型API、外站发布、多设备/多人云端同步或权限服务。原HTML、KOL/三方资产和资料保持。

r2构建/TS/lint与242单测、112/112全量浏览器通过；r3仅极窄屏共用顶栏修复，构建/TS/定点lint与11/11定向浏览器通过。独立验证包含主流程、存储边界、200任务/30节点以及桌面/320深色/真实文字200%；不能声称40人服务器并发已验证。最终BUILD_ID为qeil5n2-jXfFUSNRKAkiL。

## 接续入口

- 本机预览：http://127.0.0.1:3108/dashboard。SBS-0018起由登录任务后台启动，手动启停用[最新说明](SBS-0018/DELIVERY.md)中的任务命令。只有源码更新才先构建，不因重启重装依赖。
- 前端规范[Frontend v0.6](../../Constitution/Frontend/README.md)按DEC-025替代“工作台暂空”；品牌、配色和顶栏尺度继续沿用。MIKO仍静态占位，VPC仍归创意，整体业务中台未恢复。
- [SBS-0015 KOL交付](SBS-0015/DELIVERY.md)与[数据恢复入口](../../Data/kol/README.md)仍有效；三方初始化/取消撤下/完整零图继续沿用SBS-0013/0014。
- 模块边界见[workbench README](../../frontend/mikoshi-web/src/features/workbench/README.md)。总体设计提案仍PROPOSED，本地界面实施不代表整体方案或部署已批准。

## 保全与Git

根main/HEAD仍为5d888802504073bfa1f52f000848c6c18baabba4，暂存为空。本步不commit/push/deploy，不清理已有未提交成果。151个旧文件及PM原HTML的本地恢复点为.local/sbs-0016-before；最终171文件指纹及30项差异在SBS/evidence/SBS-0016。历史HTML、public和业务恢复档案各有保全记录，不能把本地恢复点称为远端备份。

本步已独立AC1–AC6全部PASS；下一项工作继续依据用户新需求先保存SBS计划与验收标准；不自动展开云端同步、跨业务深度引用或Agent接入。

## 已知接手注意事项

- 根目录负责治理；六个子项目拥有独立Git历史，顶层提交不会替它们备份。
- OpenBP已退役未接入运行的Claude/chili参考副本，恢复位置和许可见其RETIRED_REFERENCE_SOURCES；当前主仓e8576db已同步。主产品源码、生产包、依赖和真实运行资料保留。
- Harness生成包已修正副本绑定；Torpedo因虚拟环境绝对路径保留原位；CF1移动后Doctor通过，真实采集仍须后续专项验收。不要把目录整理当成统一服务器已经上线。
- VCPAI已完成历史清理、三个分支同步及原工作目录接续。209个未跟踪产物和7个大文件保留在本地，未上传；接续前看[仓库说明](../../REPOSITORIES.md)。
- 工作盘点三个索引文件有上一轮阅读登记改动，不能误当本轮业务实现提交。
- CF1完整包与独立技能已整体迁入Components，Business Map和B站快照迁入References；运行包与Business Map原件保留本地，不纳入根Git。以[组件手册](../../COMPONENTS.md)和[注册表](../../components.json)查当前路径。CF1-MIGRATION是根目录保留的原接口合同。
- 用户已提出长期服务器和约40人、多Agent目标；具体架构、部署拓扑、组件取舍与首个业务闭环仍为待审方案。
