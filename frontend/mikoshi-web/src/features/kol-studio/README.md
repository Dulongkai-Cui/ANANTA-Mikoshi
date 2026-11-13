# KOL 筛选与创意工作室

2026-11-07 当前范围以 SBS-0021 / DEC-029 为准：工作室允许九个视图，撤下 sources（资料与数据）；侧栏平铺这九页、合作进度以及发布效果首页/全局透视，共12项，不再折叠。旧发布计划/日历/KOL入库独立页撤下，必要资料和已有排期在合作进度同页管理；策划排期保留。原件和所有资料保全。下面十视图及折叠分组为SBS-0019历史说明，不能据此恢复旧入口。

SBS-0019：完整复用已有工作台，不把 UP 的详细资料压缩为旧 KOL 入库模型。

- 宿主入口 `/kol/studio#kols`，十个允许的视图由 `modules.ts` 登记，参与侧栏、搜索与登录回跳白名单。
- `KolStudioProvider` 与 `KolStudioStage` 在 AppShell 中保留实例。切换业务不卸载筛选状态与表单；退出后由身份边界清理。
- iframe 的 `/kol-studio/` 始终使用同源独立服务路径，不受 Next 的 `/mikoshi` 部署前缀影响。全部静态资料及 API 的认证由服务端负责，演示会话不提供资料权限。
- 源码位于 `Components/kol-selection/upstream/dist`，适配仅位于 `Components/kol-selection/integration`；后端为 HTML 追加 `embedded.css` 与 `bridge.js`。原件不直接写回。
- 桥接双方验证精确 origin 和窗口 source；只接受登记视图。宿主维护导航历史，内页维护查询、筛选、日历和图谱状态。
- 离开前先等待进行中的保存，再确认是否存在未保存表单。放弃仅关闭表单；导航不调用无条件 flush，避免制造空修订或覆盖别人的保存。浏览器返回保留实例，刷新/关闭有未保存提示。
- 服务未就绪显示可重试的错误；读取失败不能以初始 seed 覆盖真实工作库。
- 旧 `/kol#…` 效果页与 `/kol/progress|plans|calendar|accounts` 保留在折叠分组，数据合同没有合并。策划排期与原发布日历是不同业务对象。

适配协议为 `mikoshi-kol-studio-v1`：宿主发送 `navigate / environment / prepare-leave / discard-draft / focus-editor`，工作室发送 `ready / view / dirty / leave-result / navigation-blocked / error`。

桥接契约测试：`node --test Components/kol-selection/integration/bridge.test.mjs`（从仓库根运行）。模拟 DOM 只验证消息与草稿边界，不代替实际浏览器、真实权限和云端验收。
