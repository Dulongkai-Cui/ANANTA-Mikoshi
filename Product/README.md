# 产品研究与 Claude 交接

这里由Codex作为产品经理维护，Claude通过这些文档理解目标、取得执行范围并提交结果。产品文档应足够详细，使实施者不用猜业务语义；同时不替尚未讨论的事项作决定。

## 从哪里开始

1. [BRIEF.md](BRIEF.md)：用户已经确认的目标与本阶段边界。
2. [COMPONENT_MAP.md](COMPONENT_MAP.md)：现有业务与组件、真实状态、候选作用。
3. [RESEARCH_BACKLOG.md](RESEARCH_BACKLOG.md)：接下来共同研究的问题。
4. [DECISIONS.md](DECISIONS.md)：已采纳或待决定的取舍及依据。
5. [HANDOFF.md](HANDOFF.md)：如何把需求写成Claude可执行的任务。
6. [当前交接入口](handoffs/CURRENT.md)与[活动SBS](../SBS/INDEX.md)：现在可以做什么。

当前重点：[v0.2易读版](../Constitution/Proposals/2026-10-18-MIKOSHI/BRIEF.md)、[详细提案](../Constitution/Proposals/2026-10-18-MIKOSHI/DESIGN_PROPOSAL.md)及[调查基线](research/2026-10-18-mikoshi/SOURCE_INDEX.md)。新版按用户要求设计可定制数据首页和六业务板块；具体方案仍待审，研究完成不自动授权Claude实施。

## 文档分工

| 内容 | 存放方式 | 何时创建 |
|---|---|---|
| 产品需求 | `requirements/PRD-编号-主题.md` | 需要独立讨论或验收的业务形成后 |
| 研究记录 | `research/R-编号-主题.md`，综合调查可使用日期专题目录 | 真正开始调查一个问题时 |
| 产品决定 | 先记DECISIONS，复杂决定再分文件 | 发生有依据的取舍时 |
| Claude执行包 | `handoffs/SBS-编号/SPEC.md` | 当前SBS已经可以裁定实施边界时 |
| Claude实现回执 | 同目录 `IMPLEMENTATION.md` | 实现者提交自测与实际改动时 |
| 独立验收 | 同目录 `ACCEPTANCE.md` | Codex核查指定版本时 |

表中的路径是未来命名约定，不代表那些交付已经存在。当前只创建本阶段有内容的入口与模板。

## 模板

- [产品需求模板](templates/PRD_TEMPLATE.md)
- [Claude执行包模板](templates/EXECUTION_PACKET_TEMPLATE.md)
- [实现回执模板](templates/DELIVERY_REPORT_TEMPLATE.md)
- [独立验收模板](templates/ACCEPTANCE_REVIEW_TEMPLATE.md)

追溯关系放在每个执行包与验收表中：来源/REQ → SPEC版本 → SBS/AC → 实现版本 → 证据 → 结论。无需再复制一张永远不同步的全局大表。
