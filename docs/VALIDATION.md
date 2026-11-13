# 协作源码验证记录

日期：2026-11-13；环境：Windows、Node22.17.0、锁文件安装依赖、Python3.12.14。验证在独立导出目录运行，没有连接生产服务或操作生产数据库。

| 检查 | 结果 |
|---|---|
| npm ci | 470依赖安装成功 |
| Next类型生成、TypeScript、ESLint | PASS |
| 前端 Vitest | 12文件、262测试 PASS |
| 身份/团队邀请码 SQLite测试 | 18+5 PASS |
| 新克隆开发库初始化、拒绝覆盖、真实本机HTTP注册及资源访问 | 3 PASS |
| KOL宿主bridge | 5 PASS；另有独立审查者复跑 |
| Webpack正式构建 | PASS，25静态页面生成，含完整TypeScript检查 |
| 源清单核对 | 2251源文件；2246原件字节一致，5文档/示例配置更新有记录 |
| 凭据/禁止路径检查 | 无生产凭据命中；4处特征为演示或隔离测试常量，已独立复核 |

失败记录保留：首次回环HTTP测试受沙箱WinError10013阻断，在普通本机权限重跑通过。默认Turbopack在本机沙箱内外均遇到CSS子进程连接错误；随后直接运行 `node node_modules/next/dist/bin/next build --webpack` 通过，README提供兼容命令。曾有一次npm.ps1参数转发未生效，该次仍实际运行Turbopack，不算Webpack验证。

未在此步骤重新验证生产页面/云数据库；原SBS-0023云端补验仍未完成。`test_server.py`依赖未分发的受控迁移库，不计入本次通过数。这里没有把缺失fixture改成假数据，也没有关闭测试或类型检查。

GitHub Actions结果以实际工作流运行页为准；本记录描述上传前的本机验证。运行CI不会自动部署生产。
