# Mikoshi 邀请身份服务

对应 SBS-0019。`auth.py` 是独立身份边界，Python 标准库与 SQLite；业务资料仍由 KOL Store 管理。不得将身份库、初始化邀请文件或会话放进发布包、Git、Next public。

2026-11-07 SBS-0023：用户新增长期团队码。POST `/auth/invites` 可传 `reusable:true`，仅editor/viewer；默认省略仍为原单次邀请。长期码无自动到期、可多人注册，管理员可撤销阻止后续注册，已有账号保留。返回新增 `reusable:boolean`、`useCount:number`；长期 `expiresAt:null`、`usedAt` 表最近领取时间。数据库仅增 `reusable`/`use_count` 列，旧行回填0和历史领取次数，原字段不改；长期expires_at=0，其他邀请继续原1–7天（bootstrap24小时）。迁移事务化且幂等，仍兼容原身份元版本1。回滚旧代码后长期码无法继续注册，但旧单次邀请和账号可用；不能通过恢复旧数据库回滚用户新资料。

前端身份请求含响应正文读取最长20秒，超时不自动重放注册；如提交可能已经成功，提示先用该邮箱登录。服务不可达和提交后会话未确认明确提示，不用无限转圈表示成功。团队设置默认长期编辑邀请，可切换单次；原管理员邀请仅单次。

## 网关合同

```python
store = AuthStore(private_database_path)
response = handle_auth(
    store, method, path, headers, body_bytes,
    trusted_peer_address, configured_external_origin,
    secure_cookie=True,
)
# AuthResponse: status, body（可 JSON 序列化）, headers（保留重复 Header 能力）
```

`path` 是去除 `/mikoshi-api` 后的 `/auth/...`。请求体须由网关在读取前限制到 8192 字节；不要将请求体、Cookie、CSRF 或邀请码输出到访问/错误日志。只监听回环地址，由 HTTPS Nginx 代理；网关不能从未验证的 Host 动态选择 `configured_external_origin`，不能信任公网直接传来的 X-Forwarded-For。Nginx 应覆盖实际客户端地址标头。认证服务还持久化每动作/来源 60 次、每动作/账号 10 次/15分钟的限速，重启不会清空计数。

| 方法及路径 | 合同 |
|---|---|
| GET `/auth/session`、`/auth/check` | 成功 `{session:{version:1,mode:"production",user:{id,displayName,email,roleLabel,initials,role}},csrf}`；匿名 401 |
| POST `/auth/login` | `{email,password}`；成功同 session，设置 Cookie |
| POST `/auth/register` | `{email,password,displayName,inviteCode}`；角色只来自邀请，不能提交 role；成功同 session |
| POST `/auth/logout` | `{}` + Cookie/CSRF；成功清除服务端会话和 Cookie |
| GET `/auth/invites` | 仅管理员，返回 `{items:[{id,role,label,status,createdAt,expiresAt,usedAt}]}`，最多最新200条 |
| POST `/auth/invites` | 仅管理员，`{role,label?,expiresInDays?:1..7,reusable?:boolean}`；201 返回 `{invite,code}`，code只展示这次。省略reusable为默认7天单次；true为长期editor/viewer团队码，忽略有效天数但仍验证其类型 |
| POST `/auth/invites/{id}/revoke` | 仅管理员；撤销未领取单次邀请或长期团队码；不能撤销已建立的账号 |

错误统一 `{error:中文说明,code:稳定错误码}`。常见 400 输入/邀请错误、401 未登录/密码错误、403 权限/CSRF、409 邀请状态、429 限速（Retry-After:900）、503 数据库不可用。错误不会打印异常中的凭据或 SQL 参数。

## KOL 资料与写入权限

每个业务请求重新 `authenticate(store, cookie_header)`，得到 `AuthContext | None`。`context.user` 为当前数据库的用户资料，`context.role` 是 admin/editor/viewer，`context.csrf` 为当前会话校验值。匿名必须在读取任何业务文件前返回401；不能只检查 Cookie 是否存在。

所有写入调用 `require_write(context, headers, configured_external_origin)`，然后额外核对业务角色。它会抛出 `AuthError(status,code,message)`。只读成员不能写 KOL；只有管理员可以管理邀请。`require_write` 不替代业务角色规则。

所有 POST（包括登录/注册）要求精确同源 Origin 和 JSON；已登录写入还要求 `X-CSRF-Token`。Cookie 为 HttpOnly / SameSite=Lax / Path=/，生产 Secure，7天绝对到期，不因为访问无限续期。原始会话和邀请码仅存在于用户侧，数据库存 SHA256；密码使用每用户随机盐的 scrypt (N=32768,r=8,p=1)。密码12至128字符。哈希运算限制最多4个并发，SQLite 注册事务保证重复领取同一邀请只有一个成功。

## 首位管理员

仅服务器命令行执行：

```text
python3 /opt/mikoshi/current/ops/mikoshi-cloud/auth.py bootstrap --database /var/lib/mikoshi-auth/auth.sqlite --output /var/lib/mikoshi-auth/bootstrap-invite.txt
```

文件必须在私有目录，Linux 创建权限0600；不覆盖现有文件。只允许尚无用户的身份库，存在有效初始化邀请时拒绝再次生成。邀请24小时过期、仅使用一次；负责人用它在正常注册页填写自己的邮箱、姓名和密码。控制台不输出邀请码，不存在 HTTP bootstrap、默认账户或默认密码。首管理员创建后，再从管理员页面发邀请。

若首个邀请过期且仍没有任何用户，使用同一身份数据库、指定一个**新的私有输出文件名**再次执行，例如 `--output /var/lib/mikoshi-auth/bootstrap-invite-20261108.txt`。不要覆盖原文件、删除身份库或重置已有账号。已有有效初始化邀请时继续使用原邀请；已建立用户时通过现有管理员的邀请页面管理，不再运行初始化。命令需由拥有该私有身份目录权限的服务器维护者执行；不要把文件内容输出到公开日志。

本模块没有邮件验证/邮件发送、密码找回、用户禁用管理UI或跨系统账号合并。邮箱仅作登录标识；不要声称已验证邮箱归属。数据库 disabled 字段会立即阻止该用户会话和登录，但正常运维应另做有审计的管理入口。

## 已运行测试

2026-11-07：`python -B -m unittest -v test_auth.py`，18项通过，12.176秒；真实临时SQLite，包含并发单次领取、失效/撤销邀请、事务回滚、角色提权拒绝、会话持久化/伪造/到期/注销、同源/CSRF、持久限速、凭据非明文存储和离线bootstrap约束。测试仅在 `.local/sbs-0019/auth-tests` 创建自有一次性测试目录，并校验范围后清理。

首次 Windows 沙箱默认 TEMP 目录 ACL 导致 SQLite 打开失败，改用明确的 workspace 临时目录后通过；没有放宽业务权限。当前是模块集成测试证据，不能替代真实 HTTPS/Nginx、部署系统账户权限和浏览器注册的最终验收。
