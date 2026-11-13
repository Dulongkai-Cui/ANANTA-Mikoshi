# SBS-0004 子项：Harness 桌面副本绑定修复

日期：2026-10-18。状态：PASS（限定静态绑定检查，待根 SBS 汇总验收）。
依据：用户已授权 Mikoshi 组件整理；根 SBS-0004 为 IN_PROGRESS，主执行者进一步指定本项最小修复。
本项是复制后的本机生成配置修正，不推进 Harness 自身 provider 开发 SBS，不新增产品能力、费用或集成。

## 问题与范围

- 当前 `OpenBP_Harness/apps/openbp-studio/desktop-dist/OpenBP Studio-win32-x64/resources/openbp-workspace.json` 指向工作区外原项目。
- desktop/backend.cjs:16–27 读取该根；main.cjs:24–27 与 backend.cjs:108–111 使用该根下私有状态。
- 允许修改的运行文件只有上述 ignored JSON 的 `workspaceRoot` 字段；目标为 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP_Harness` 的真实路径。
- 保持 Harness 原物理路径，不移动/启动应用，不运行 WSL/引擎/模型，不修改 `.env`、私有 home、用户设置、源码或外部原项目。
- desktop/build.cjs:8–9,33–42 已动态生成绑定，保持原样；无需新检测工具或额外产品代码。

## 执行前基线

- 副本 HEAD：`2c31fa0239c061bf2b711a2b36fdfb7dc82c90e5`；tracked diff 为 0。
- 绑定文件 60 B，SHA256：`21985a011ea1dceb12a737e5fb8278e52455b1bdf1507884f47c38a96d2bc09a`。
- 外部原项目同路径绑定 SHA256 与上相同；只记录哈希，不写外部文件。
- build.cjs SHA256：`63e2cbee3a08cee6bd5a7e8dd958c1734294553e677141889b2c1064528381f2`。
- 当前 app 私有 `.data/codex-home-wsl` 存在且与用户 CODEX_HOME 隔离；其既有生成配置含原根路径。
- 不调用 prepare_runtime。runtime_config.py:261–279,299–367 在下次正常初始化按真实根重生 app 自有配置；本项不把这一未来初始化当已验证。

## 计划

1. 再次检查绑定 hash、JSON 字段、目标实路径在工作区内，逐祖先无 reparse point，目标 server.py 存在。
2. 检查目标是忽略且未跟踪文件、Harness HEAD 与 tracked diff 未改变。
3. 比较并保存外部原项目绑定 hash、build.cjs hash、app 私有 config hash（仅内存；不输出内容）。
4. 只替换 workspaceRoot，保持其他 JSON 字段；写 UTF-8 JSON。
5. 复读并断言绑定解析到当前副本，entry 存在，其他字段未变；再次核对原件/生成器/私有 config 未改变。
6. 回写新 hash、离线检查结果与 Git 状态，供根 SBS 独立审查。不执行产品启动。

## 验收标准

| AC | 条件 |
|---|---|
| AC-01 | 唯一运行文件变化是指定 JSON 的 workspaceRoot；不添加源码 |
| AC-02 | 新绑定解析到当前 Mikoshi Harness 真实根，server.py 存在，路径不越出 workspace |
| AC-03 | 外部原绑定、build.cjs、app 私有 config hash 保持；无凭据内容输出 |
| AC-04 | Harness tracked diff 仍为 0，绑定仍 ignored，不强制入 Git |
| AC-05 | 没有应用/WSL/模型/服务器启动；明确此为静态入口绑定验证 |

## 恢复与重建

恢复前态可用外部原件同路径文件，但恢复前必须核对基线 SHA256；恢复后会重新指向原项目，不能将它作为正常运行配置。
正确重建方式是在当前副本 `apps/openbp-studio/desktop` 关闭应用后运行 `npm run build`，由生成器按真实源码位置生成绑定；需保留现有 Electron/node_modules，网络依赖是否可满足另行验证。
绑定是本机生成的 ignored 文件，不强行纳入子仓；本记录与根组件注册信息负责说明修复与恢复来源。

## 执行结果

已执行：只有上述 ignored JSON 的 workspaceRoot 改为工作区当前 Harness 真实根；新文件 85 B，SHA256 为 `7aa41ce6df6ee456d73d4cbd9c8e9cd450d62386ff4d7ae4cbe1041d875ae2fa`。

- AC-01/02：PASS。复读 JSON 与期望对象一致，目标 resolved 路径位于 workspace，server.py 存在；逐祖先无 reparse point。
- AC-03：PASS。外部原绑定、build.cjs、当前 app 私有 config 的前后 SHA256 一致；私有配置只在内存计算摘要，无内容输出。
- AC-04：PASS。子仓 HEAD 未变，tracked diff=0、非忽略 untracked=0；check-ignore 确认绑定仍被忽略。
- AC-05：PASS。未启动产品、WSL、引擎、模型或服务；没有执行 prepare_runtime。既有私有配置中原路径的下次初始化更新尚未动态验证。

本项不证明模型、历史会话恢复、WSL 或整个桌面产品可用；它修正了明确的本机入口归属错误。
