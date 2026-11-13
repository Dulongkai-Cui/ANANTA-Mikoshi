# SBS-0019 KOL 来源、保全与运行映射

调查日期：2026-11-07。本文记录实际源码/数据库检查及复制结果，不把原表中的会议指令视为本次执行授权。原件只读，业务解释沿用来源状态，未将草案预算升级为审批事实。

## 1. 两个来源目录

| 来源 | 实际作用 | 发现的规模 |
|---|---|---|
| `D:\工作文档\工作盘点\新-量化KOL筛选系统` | 用户指明的原始业务资料；包含进度、供应商方案、筛选与预算表、会议纪要和参考图，本身不是运行程序 | 26文件、190,902,168字节；14 XLSX、6 DOCX、2 PDF、3 PNG、1 JSON |
| `D:\工作文档\工作盘点\outputs\01_KOL提案与选人\无限大_KOL筛选与创意系统_2026-11-05` | 完整成品；`site/`内为应用、资源与本机SQLite，另有研究记录、历次版本、发布包及说明 | 原调查2037文件、281,137,795字节；排除身份/凭据等后保全2016文件、281,111,290字节 |

源 `site/.git` 在调查时为尚无HEAD的main，不能将它称为已提交的Git备份。原源目录保持原位，不删除、不清空、不修改数据库。

## 2. 实际源目标映射

| 原内容 | 本项目实际位置 | 用途/处理方式 |
|---|---|---|
| 原始业务资料目录全部26文件 | `.local/sbs-0019/source-preservation/business-originals/` | 私有原件副本；不发布到网页 |
| 完整成品目录，除明确排除项 | `.local/sbs-0019/source-preservation/delivered-system/` | 原说明、研究、历史版本、旧发布包与源码的恢复副本 |
| `site/user-data/workspace.sqlite` | `.local/sbs-0019/source-preservation/delivered-system/site/user-data/workspace.sqlite` | SQLite backup API产生的一致性副本；完整保存state和state_history |
| 原成品已有SQLite备份 | 保全目录相同相对路径 `site/user-data/backups/` | 按字节复制；原历史备份继续保留 |
| 保全中的工作库 | `.local/sbs-0019/runtime/workspace.sqlite` | 独立本机运行副本；测试另外使用临时库，不能反向覆盖源库或云库 |
| 原 `site/dist/` | `Components/kol-selection/upstream/dist/` | 完整运行页面及资料资源；从已核对的保全副本复制 |
| 原 `local_server.py`、cloud、team-preview、drizzle、worker/build脚本 | `Components/kol-selection/upstream/`对应路径 | 保留原合同与实现；发布包只选择当前运行实际需要的文件 |
| 新宿主适配 | `Components/kol-selection/integration/` | bridge.js、embedded.css及模拟协议回归测试；不改upstream原件 |
| 新外壳模块与路由 | `frontend/mikoshi-web/src/features/kol-studio/`、`src/app/(app)/kol/studio/` | Mikoshi导航、搜索、登录回跳及长期保留的iframe |
| 改动前Mikoshi前端 | `.local/sbs-0019/frontend-before/` | src、public、package及Next配置的恢复点 |
| 完整复制清单 | `.local/sbs-0019/source-manifest.json` | 每项源/副本SHA256、字节数、复制方式与排除原因 |

计划中的 `Data/kol-selection/` 当前未建立第二份重复档案；实际私有保全位置以上表和manifest为准。不要根据计划路径声称存在另一份备份。

manifest创建于 **2026-11-07T07:15:11.990287+00:00**，共保全 **2042文件、472,013,458字节**。21项原身份、凭据或缓存项未复制，包括 `.git`、`.openai`相关身份元数据、`team-preview-session.key`、`team-preview-grant.json`；原件仍在原目录。不要将旧预览会话带到新站。源码与完整资料的本地副本不是远端Git备份，也不是异地灾备。

独立核查逐一重读2042项，manifest与源/副本相符；见 [独立保全证据](../../../SBS/evidence/SBS-0019/independent-preservation.json)。SQLite在线备份可能改变文件物理布局，因此另校验含历史的完整逻辑内容，不能只用物理文件hash判断丢失。

## 3. 数据库保全基线

工作库保存时间为 `2026-11-06T15:24:18+00:00`，源与副本 `integrity_check=ok`。完整逻辑dump SHA256：

`78e32f21ebc33083b66fe77eba104911f5cfa328b1814f044d5f975410dc2692`

state正文SHA256：

`e85a83a780eef152a3949cf64b0f49363c5aba058c88c36c983478181804c052`

| 内容 | 数量及含义 |
|---|---|
| UP档案 | 963 |
| 中选UP | 25 |
| 创意 | 96，82活跃、14归档；归档没有删除 |
| 预算分类 / 卖点 / 来源 | 10 / 13 / 14 |
| UID / 粉丝信息 / 报价 | 919 / 886 / 671；有值和已核实不是同一结论 |
| planner节点 | 13；ideaIds、matches、events均0，不构造不存在的排期 |
| state_history | 11条已保存历史；原Store继续最多保留12条的既有合同 |
| 手工关系 / 主state关系 | 各0；关系图另加载research证据 |

`dist/data.json`仅含95项创意，不能作为当前工作库替代品；读取服务失败时必须显示错误，不能静默回填旧seed。脑暴工厂功能完整保留，当前基线没有已保存的脑暴组件，不以演示组件冒充业务记录。

## 4. 头像、作品与研究证据

| 内容 | 已核对结果 |
|---|---|
| dist完整资源 | 1948文件、138,302,813字节 |
| 头像目录 | 998文件、127,471,804字节；包含原始资产，不只保留当前引用的部分 |
| 档案实际头像引用 | 937条，全部有对应本地文件，无缺失路径；其余26档案保留缺省状态 |
| avatars.json | 827条映射；不是当前档案全部头像数量，不能据此截断937条实际头像 |
| 作品缓存目录 | 934份JSON、4,449,011字节；全部匹配“主页实采”的UP档案 |
| 缓存记录总数 | 18,622条recent、438条cases、41条coWorks；这些集合可能有交叉，不应简单相加称为去重作品数 |
| 近期作品状态 | 934主页实采、2确认零投稿、24原表未具名、1组合按成员查看、2待核实主页；complete为936，包含确认零投稿 |
| research.json | 308补充档案、59关系边、40独立共同作品、1282历史参考记录；历史资料不冒充最近20条 |

原程序只向同源请求数据与资源，外部B站等地址主要用于主页或证据跳转。头像使用本地资产；本次迁移不重新抓取，也不把既有缓存称为实时更新。

## 5. 十个功能页和宿主对应

| 源view | Mikoshi路径 | 保留的主要内容 |
|---|---|---|
| kols | `/kol/studio#kols` | UP档案、筛选、报价与作品证据 |
| pool | `/kol/studio#pool` | 人选/创意中选池及组合阵容 |
| ideas | `/kol/studio#ideas` | 创意、配图、报价分摊、预算纳入、归档 |
| factory | `/kol/studio#factory` | 底板/标准件、拖放、报价、生成创意 |
| calendar | `/kol/studio#calendar` | 月周日历、日期待定、节点、拖动与详情 |
| overview | `/kol/studio#overview` | 策划工作总览 |
| relations | `/kol/studio#relations` | 合作证据与创意组合建议，分别展示 |
| budgets | `/kol/studio#budgets` | 预算额度、费用与覆盖 |
| selling | `/kol/studio#selling` | 卖点关联与覆盖 |
| sources | `/kol/studio#sources` | 来源、导入导出、历史版本权限入口 |

生产Next使用 `/mikoshi`前缀；例如对外目标为 `/mikoshi/kol/studio#kols`。嵌入的完整组件独立使用同源 `/kol-studio/`，不能错误加上Next前缀。模块与接口白名单继续由服务端鉴权，不通过静态public交付详细档案。

## 6. 云端数据权威和相邻模块边界

现有阿里云KOL入口是 `https://8.218.158.143/kol/`，工作库 `/var/lib/kol-workbench/workspace.sqlite`。本步选择继续使用这份现役工作库，Mikoshi网关与旧KOL共用SQLite事务、乐观版本和历史，不产生两份无人维护的线上分叉。调查时主流程只读比对的云端state正文hash与上述本机基线一致；**最终部署前后仍需重新核对**，不得用一次相等假定后续没有同事编辑。

新的Mikoshi身份库独立位于 `/var/lib/mikoshi-auth/auth.sqlite`，通过邀请码注册。旧脑图、旧KOL登录服务保留，不改其密码或合并账号。组件文件使用稳定静态组 `mikoshi-data`，新网关通过补充组读取，避免DynamicUser重启后的GID变化。

原Mikoshi的KOL七个效果页及四个发布/合作管理页继续存在；UP筛选库未被压扁导入其旧模型。旧发布计划与本次策划排期是不同对象。工作台、三方号和旧KOL管理中的浏览器数据仍按身份保存在本机；新站邀请码并不使这些本机记录自动同步到其他电脑。MIKO也仍是占位入口，本次没有接Agent或模型。

服务器发布包仅含当前运行源码与受保护资源；私有原表、工作数据库、身份库、初始化邀请码、旧密钥及源Git不进入包。备份/恢复与最终运行事实分别参照 [DEPLOY](../../../ops/mikoshi-cloud/DEPLOY.md)、[交付说明](DELIVERY.md)和 [SBS](../../../SBS/SBS-0019-kol-migration-cloud.md)。
