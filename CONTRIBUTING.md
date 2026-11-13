# 协作开发

先读根目录 `README.md`、`AGENTS.md`、`Constitution/README.md`、`SBS/INDEX.md` 与 `Product/handoffs/CURRENT.md`，然后读对应业务的文档。前端遵循 `Constitution/Frontend` 的视觉、交互与验收规范。

1. 从最新 `main` 创建 `feat/简短名称`、`fix/简短名称` 或代理分支 `codex/简短名称`。
2. 动手前记录目标、受影响目录和验收标准；沿用当前步骤，不自行跳过未完成的验收。
3. 用本机独立开发库，运行受影响检查；不连接生产数据库进行开发测试。
4. 提交明确文件范围，发 Pull Request，说明变化、验证与数据影响；由未参与实现者审查。
5. 合并前同步最新 main，解决冲突并重新验证受影响部分；不强推共享分支，不直接覆盖别人的改动。

首次协作仓库是当前工作树快照，原治理仓和独立 OpenBP 产品仓的历史均保留在原位置。原根仓 main 的大量未提交成果没有被这里的初始化提交清理或回写。

不要提交 `.env.local`、`.local`、任何数据库、邀请码、Cookie、密钥、备份、日志、node_modules 或构建目录。真实账号和云端数据由负责人单独授权。新增依赖更新 package-lock；新增接口明确角色、错误和并发行为。

仓库管理员在 GitHub **Settings → Collaborators → Add people** 添加同事 GitHub 账号；站内 Mikoshi 邀请码与 GitHub 仓库权限是两件事。没有指定收件账号前，不自动给任何人仓库访问权。
