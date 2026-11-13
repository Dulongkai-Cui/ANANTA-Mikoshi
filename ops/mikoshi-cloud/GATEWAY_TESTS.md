# KOL 网关集成验证

日期：2026-11-07。对应 SBS-0019。实现者自测，独立验收仍由主任务安排。

当前修复后结果：认证18项 + 网关15项，**33/33通过，31.511秒**。独立审查发现首轮跨站/缺Origin/缺CSRF大正文拒绝路径会出现 WinError10053；下文11/11仅是首轮观察，不能作为该问题已排除的证据。修复与新增场景见本文末尾，独立复验待审查者运行。

`test_server.py` 通过真实 `http.client` 请求 `make_server(port=0)` 创建的回环 HTTP 服务，未用 mock 代替认证、HTTP 或 SQLite。每例独立身份库，KOL 输入先以只读连接和 SQLite online backup 生成一致性副本，再复制为一次性测试库。全部注册、编辑、历史和注销仅发生在这些临时库。

输入为 `.local/sbs-0019/runtime/workspace.sqlite`，前后 SHA256 一致：`d607ff4e3c789ed1d8d645adb772ab79d577902823236ceb96d25a59a9c712f9`。数据库副本 integrity_check=ok。测试读取实际 963 UP / 96 创意及完整资产；没有启动源库 Store 或改写真实工作库。

## 运行结果

```text
python -B -m unittest -v test_server.py
Ran 11 tests in 13.181s
OK
```

| 检查 | 实测结果 |
|---|---|
| 匿名 GET/HEAD：HTML、JS/CSS、桥接样式、头像、作品、研究JSON、工作状态和历史；匿名 PUT | 全部401 |
| 已登录管理员请求SQLite、源码、.git、.openai和普通/编码/双编码目录穿越 | 全部404 |
| 经HTTP邀请注册 admin/editor/viewer；角色读取 | 与邀请角色一致 |
| viewer写入，viewer/editor读取历史和管理邀请 | 全部403 |
| editor修改临时状态 | 200，新版本已持久化；旧版本历史可由admin下载 |
| 旧version再次写入 | 409，已保存的新状态/版本保持 |
| 缺失/外站Origin、缺失CSRF的业务写入；外站登录 | 403，工作库版本不变 |
| 伪造会话与注销后访问业务资料 | 401 |
| 嵌入HTML引用的全部直接JS/CSS，静态白名单，bridge/embedded资源 | 200；viewer正确加载read.js；CSP同源frame；no-store |
| API路径改编 | read.js读取 `/kol-studio/api/state`；planner历史接口使用 `/kol-studio/api/history` |
| 全部本地素材及清单引用 | 全部符合白名单；实际头像/作品请求内容与本地文件一致；未发现引用缺文件 |
| gzip、viewer敏感来源字段过滤、非法JSON/content-type/过大身份请求 | gzip可解码且内容完整；过滤有效；错误400/415/413且版本不变 |

第一次执行因沙箱不允许Python回环连接（WinError10013）而全部未运行；经工具审批允许仅回环测试后，以上11项全部通过。没有通过缩减标准或mock网络绕过该失败。

## 运维与证据边界

- 网关与认证模块合同兼容：`AuthContext.role`、`csrf`、`AuthResponse.status/body/headers`均经HTTP用例覆盖。
- 生产代理必须覆盖 `X-Real-IP`，不能透传公网自行填写的值；网关只应监听回环。本轮直接HTTP测试不替代实际Nginx配置核对。
- HTTPS Secure Cookie标志由认证模块测试覆盖；本轮服务为临时HTTP回环，不代表TLS证书、systemd重启、实际公网可用或浏览器交互均已验收。
- 测试目录限定 `.local/sbs-0019/gateway-tests/<本轮UUID>`，关闭服务后校验绝对父路径并清理，仅删除本次一次性测试资料。

## R1 修复：大正文拒绝与读取界限

独立审查完整回归为11项中1项ERROR，单跑3个CSRF/Origin拒绝子场景均复现 WinError10053。根因是服务器在读取多MB上传正文之前发送403并关闭连接，客户端仍在发送时收到TCP重置，无法稳定取得预期JSON错误。首次实现者测试恰好通过不足以排除此传输时序问题；保留两种观察，不隐去失败。

`server.py` 现在对 POST/PUT 先完成**有界字节读取**，再执行身份/角色/Origin/CSRF，最后才解析业务JSON及调用 Store.save。身份请求最大8192字节；业务最大18,000,000字节。Content-Length只允许一个1至10位十进制值，拒绝Transfer-Encoding；正文按最大64KB分块读取，并设15秒总截止时间，不能靠持续滴流无限延长。超限413、上传超时408、截断或歧义长度400。只接收正文不代表授权，匿名、只读和跨站路径均不会保存。

增强旧CSRF用例为16KB分块持续发送完整真实工作状态，使拒绝发生时确实仍有上传在途；新增2MB匿名/只读流式请求，验证得到401/403 JSON而非连接异常且版本不变。新增不发送超限声明正文仍立即413、持续滴流总期限408、截断/重复Content-Length/Transfer-Encoding 400，均核对临时库未保存。

```text
python -B -m unittest -v test_auth.py test_server.py
Ran 33 tests in 31.511s
OK
```

本轮测试仍只用一次性副本；输入工作库前后SHA256未变。修复后的真实部署与独立复验由主任务记录。

R2文档同步：`AUTH.md`首位管理员指令已改为实际 `/var/lib/mikoshi-auth/auth.sqlite`，私有邀请路径同目录；过期且尚无用户时使用新的输出文件名生成24小时邀请，不覆盖旧文件，不重置账号或身份库。
