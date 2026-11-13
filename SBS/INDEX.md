# SBS 步骤索引

更新日期：2026-11-07。状态权威在对应SBS正文，本文件同步导航。

2026-10-22例行恢复：沿用SBS-0018既有启动任务恢复服务，Node PID21996，本机及原公网login200；无新增业务开发或启动机制修改。恢复事实见SBS-0018末尾。

2026-10-20运维补记：按已验收启动流程恢复3108后台进程，原cpolar隧道和URL不变；公网登录页已验证。无新增业务实现，记录见SBS-0017末尾。

22:03历史续记：确认系统21:26重启导致应用未自启，已恢复3108（PID50716）。随后用户选择登录自启动，由SBS-0018完成并替代手动启动。

## 当前步骤

SBS-0023：原码为已领取bootstrap；长期团队码协议已在线并实际生成editor长期码，原账号HTTPS登录200。当前VERIFYING，云端部署/备份回执与浏览器实证待恢复连接后补齐。[计划](SBS-0023-invitation-registration-check.md)。

SBS-0022：将KOL侧栏首页改为发布效果总览；当前ACCEPTED，阿里云f1c88f9ee47ccf7cd060已上线，独立AC1–AC3 PASS。[计划](SBS-0022-kol-overview-label.md)。

SBS-0021：KOL撤下指定冗余页、发布效果仅留首页/全局透视、侧栏全部平铺；当前ACCEPTED，阿里云3389e84bb2cc62d4b6ec已上线，独立AC1–AC5 PASS。[计划](SBS-0021-kol-navigation-trim.md)。

SBS-0020：按用户要求备份云端数据库后撤下联动管理、创意管理独立板块；KOL内部创意与所有资料保留。当前ACCEPTED；阿里云已上线23bd9fa557ac985eca35，独立AC1–AC5全部PASS，见[计划和验收](SBS-0020-retire-unused-boards.md)。

SBS-0019：阿里云release `3f56e5a25ec9ed7c09a1`已上线，HTTPS/重启/数据与旧站回归通过；指定管理员账号、实际云端十页/邀请/退出重登录均已通过，独立AC1–AC6全部PASS，本步ACCEPTED。[实际交付](../Product/handoffs/SBS-0019/DELIVERY.md)。

| ID | 目标 | 状态 | 负责人 |
|---|---|---|---|
| [SBS-0022](SBS-0022-kol-overview-label.md) | KOL发布效果导航名称统一 | ACCEPTED | Codex / 独立审查 |
| [SBS-0021](SBS-0021-kol-navigation-trim.md) | KOL页面收敛与侧栏平铺、数据库保全 | ACCEPTED | Codex / 独立审查 |
| [SBS-0020](SBS-0020-retire-unused-boards.md) | 保存数据库并撤下联动/创意独立板块 | ACCEPTED | Codex / 独立审查 |
| [SBS-0019](SBS-0019-kol-migration-cloud.md) | 完整 KOL 迁入、邀请码身份与阿里云团队部署 | ACCEPTED | Codex / 独立审查 |
| [SBS-0018](SBS-0018-preview-autostart.md) | 当前用户登录 Windows 后自动启动 Mikoshi | ACCEPTED | Codex / 独立审查 |

用户已明确选择登录Windows自启动，专属任务已配置并实际验证启动、重复运行、停止及恢复；[独立AC1–AC4 PASS](evidence/SBS-0018/independent-review.md)，[使用说明](../Product/handoffs/SBS-0018/DELIVERY.md)。未实际注销或重启电脑，未改变分享范围或业务数据。

## 历史

[SBS-0017](SBS-0017-cpolar-preview.md) cpolar预览已ACCEPTED。既有HTTPS隧道及[使用说明](../Product/handoffs/SBS-0017/DELIVERY.md)继续有效；自动启动的新增范围由SBS-0018验收。

[SBS-0016](SBS-0016-marketing-workbench.md) 五页营销工作台已 ACCEPTED，[独立 AC1–6 PASS](evidence/SBS-0016/independent-review.md)。r2 全量112/112、r3 定向11/11，242单测及构建/TS/lint通过；[使用说明](../Product/handoffs/SBS-0016/DELIVERY.md)。

[SBS-0015](SBS-0015-kol-workspace.md) KOL七个完整零态页与四个管理页已ACCEPTED，[独立AC1–6 PASS](evidence/SBS-0015/independent-review.md)。历史保全与分轮验证见[交付说明](../Product/handoffs/SBS-0015/DELIVERY.md)。

[SBS-0014](SBS-0014-third-party-zero-dashboard.md) 三方号零数据完整图表与账号作品占位已ACCEPTED。最终r3构建、lint、203单测及完整88浏览器回归通过；[独立AC1–5 PASS](evidence/SBS-0014/independent-review.md)，19张生产截图和原件/档案保全已核对。

[SBS-0013](SBS-0013-third-party-initialization.md) 85账号/374作品及本机资料保全、初始化与取消/撤下已ACCEPTED，全部AC[独立PASS](evidence/SBS-0013/independent-review.md)。本步改进其空态展示，不回填历史数据。

[SBS-0012](SBS-0012-third-party-publishing.md) 账号入库、计划日历与布局切换已ACCEPTED，六AC[独立PASS](evidence/SBS-0012/independent-review.md)。本步初始化替代其历史数据默认加载范围，功能保留。

[SBS-0011](SBS-0011-compact-topbar.md) 顶栏高度与按钮留白收紧已ACCEPTED。

[SBS-0010](SBS-0010-miko-and-navigation-trim.md) MIKO占位、VPC归属创意、空白工作台与按钮导航已ACCEPTED，见[独立报告](evidence/SBS-0010/independent-review.md)。

[SBS-0009](SBS-0009-context-navigation.md) 顶部业务切换、上下文侧栏与次级ANANTA标识已ACCEPTED，见[独立验收](evidence/SBS-0009/independent-review.md)。六业务平级与首页编辑的当前适用性由SBS-0010的新需求替代。

[SBS-0008](SBS-0008-data-system-redesign.md) 深蓝数据系统视觉与历史工作台复用已ACCEPTED，见[交付回执](../Product/handoffs/SBS-0008/DELIVERY.md)。

[SBS-0007](SBS-0007-login-saas-shell.md) 本地演示登录、可定制首页与SaaS骨架已ACCEPTED，见[旧回执](../Product/handoffs/SBS-0007/DELIVERY.md)。旧证据只适用于当时版本，不覆盖后续改版。

[SBS-0006](SBS-0006-frontend-design-standard.md)前端规范与技能手册已验收，见[证据](evidence/SBS-0006/acceptance.md)；相关文件未提交。

[SBS-0005](SBS-0005-frontend-resource-library.md)六个前端资源库准备已验收，见[证据](evidence/SBS-0005/acceptance.md)；本轮开始时相关根文档仍未提交。

[SBS-0004](SBS-0004-component-curation.md)组件精细整理已验收，根仓 `5d88880` 已同步；见[验收](evidence/SBS-0004/acceptance.md)。

[SBS-0001](SBS-0001-foundation.md)已于2026-10-18验收，见[验收记录](evidence/SBS-0001/acceptance.md)。子项目历史SBS仍位于各自仓库，不迁移、不重编号。

[SBS-0002](SBS-0002-platform-design-proposal.md)的v0.1调查与提案交付已验收，见[原版验收](evidence/SBS-0002/acceptance.md)。其hash/结论仅适用于`1dc6760`中的v0.1；当前提案修订由SBS-0003另验。

[SBS-0003](SBS-0003-business-board-redesign.md)的v0.2设计交付已验收，根仓`9653fb1`已同步；新增可定制首页与六业务分区。

## 后续

当前步骤未ACCEPTED前不创建下一份编号SBS。SBS-0019 已由用户明确授权完整KOL迁入、邀请码注册及阿里云部署；其他业务的跨设备数据同步和Agent接入仍在研究池。
