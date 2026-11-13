# ANANTA Mikoshi

无限大业务工作中枢。当前包含 MIKO 入口、营销工作台、三方号和 KOL；采用深蓝导航、浅色数据区和 MIKOSHI 小狐狸品牌。

这是 **2026-11-13 当前工作源码的独立公开协作仓库**，包含此前尚未提交到旧治理仓的实现。前端、身份服务、KOL 工作室、资源、测试和部署代码在同一仓库，可完整克隆。仓库所有者已明确确认连同现有历史业务资料一起公开；生产数据库、账号、邀请码、备份和机器私有配置仍不入库。

## 开始开发

需要 Git、Node.js **22.12 或更高的 22.x**、npm、Python **3.12+**（后端只使用标准库）。

```sh
git clone https://github.com/Dulongkai-Cui/ANANTA-Mikoshi.git
cd ANANTA-Mikoshi/frontend/mikoshi-web
npm ci
npm run dev
```

打开 <http://127.0.0.1:3100/login>。默认演示模式可查看营销工作台、三方号和发布效果页面；演示身份不能访问要求真实登录的 KOL 工作室。

## 启动完整前后端

在仓库根目录初始化 **新的本机开发库**，默认空白，重复执行会拒绝覆盖：

```sh
python ops/mikoshi-cloud/init_dev.py
```

如希望基于随组件保留的历史资料开发，首次初始化改用 `python ops/mikoshi-cloud/init_dev.py --reference-snapshot`。这是历史 963 UP / 95 创意参考，**不是云端最新工作状态**。不要将它导入生产覆盖新资料。

终端一，在仓库根启动网关：

```sh
python ops/mikoshi-cloud/server.py --port 8878 --database .local/dev/workspace.sqlite --auth-database .local/dev/auth.sqlite --origin http://127.0.0.1:3100
```

终端二，创建 `frontend/mikoshi-web/.env.local`：

```dotenv
NEXT_PUBLIC_MIKOSHI_AUTH_MODE=production
MIKOSHI_GATEWAY_ORIGIN=http://127.0.0.1:8878
```

然后在 `frontend/mikoshi-web` 运行 `npm run dev`（已启动的进程需要重启）。在登录页选择“有邀请码？创建账号”，从自己电脑的 `.local/dev/bootstrap-invite.txt` 读取初始管理员邀请，24 小时内设置自己的开发账号。该邀请只用一次，后续通过个人设置管理团队邀请。

前后端均只绑定本机；本机 HTTP 仅供开发。正式环境继续使用 HTTPS、真实身份和网关权限。更换前端端口时同步修改网关 `--origin`。不要使用线上密码或把 `.local` 分享给同事。

## 目录

| 路径 | 职责 |
|---|---|
| `frontend/mikoshi-web/src` | Next 页面、设计 tokens、组件、业务合同及适配器 |
| `frontend/mikoshi-web/scripts` | 三方号/KOL 发布效果页面生成及 iframe 适配 |
| `Components/kol-selection/upstream` | KOL 原生页面源码、静态参考资料、头像/作品缓存、SQLite Store |
| `Components/kol-selection/integration` | 宿主导航、样式、消息与未保存保护 |
| `ops/mikoshi-cloud` | 身份、邀请码、KOL 网关、发布/备份/回滚、开发初始化 |
| `References/BilibiliDashboard` | 页面生成所需的历史 HTML 原件，默认生成零数据页面 |
| `Constitution` | 项目原则、设计语言与反屎山规则 |
| `Product`、`SBS` | 需求、决定、执行计划与历史状态；历史私有证据不随仓库分发 |
| `frontend/fronted-skill` | 六套设计参考的来源和固定版本；源码克隆按索引自行恢复 |

## 验证

在 `frontend/mikoshi-web`：

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

类型检查若提示缺少 Next 生成类型，先 `npx next typegen`。

Windows 如果出现 Turbopack 的“node process exited before we could connect”错误，在前端目录依次运行 `npm run sync:legacy` 和 `node node_modules/next/dist/bin/next build --webpack`；开发可用 `node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3100`。直接调用 Next CLI 可避开部分 PowerShell 环境的 npm 参数转发问题。使用相同业务源码和类型检查，实际结果见 `docs/VALIDATION.md`。

在根目录验证鉴权和新克隆启动：

```sh
python -m unittest discover -s ops/mikoshi-cloud -p test_auth.py
python -m unittest discover -s ops/mikoshi-cloud -p test_team_invites.py
python -m unittest discover -s ops/mikoshi-cloud -p test_dev_setup.py
node --test Components/kol-selection/integration/bridge.test.mjs
```

CI 执行上述前后端检查。`test_server.py` 是历史迁移专项测试，要求未入库的受控 96 创意数据库副本，不能直接在新克隆上执行或改用 95 创意旧 seed 假装通过。浏览器 E2E 还需 `npx playwright install chromium`、演示构建和空闲端口，详见前端配置；不把当前源码检查等同于完整云端 UI 验收。

## 当前能力与边界

- KOL 工作室及邀请码身份使用服务器 SQLite，支持管理员/编辑/只读及保存冲突保护。
- 三方号、营销工作台等部分业务仍使用浏览器本机存储，尚未全部实现多人云同步。
- MIKO 是 AI 入口占位，尚未接入长期 Agent。
- SBS-0023 的长期团队邀请码实现和测试已完成、线上 API 曾验证；云端发布/备份回执和浏览器补验仍待完成。GitHub 上传不改变这一状态。
- 本仓库含按所有者授权公开的历史业务资料及品牌。第三方依赖仍遵循其原许可，详见 `frontend/mikoshi-web/THIRD_PARTY_NOTICES.md`。

协作流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，来源与排除范围见 [SOURCE_SCOPE](docs/SOURCE_SCOPE.md)，部署限制见 [DEPLOY](ops/mikoshi-cloud/DEPLOY.md)。生产安装器针对既有阿里云环境，不是任意新服务器的一键安装器。CI 不自动部署。
