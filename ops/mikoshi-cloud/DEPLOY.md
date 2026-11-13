# Mikoshi 阿里云部署

适用 SBS-0019，仅部署到现有 Ubuntu 24.04 x86_64 团队服务器 `8.218.158.143`，保留根脑图和 `/kol/`。脚本存在不代表已上线，以当前交付与服务器实际验收为准。

## 发布包

在仓库根用 Python 运行 `ops/mikoshi-cloud/bundle.py --output <一个新的压缩包路径>`。包保留目录结构、所有生成好的 `public/legacy`、完整 KOL 资源和逐文件 SHA256 清单；不含 node_modules、.next、数据库、session.key、原始业务表或 Git。打包前由主流程完成前端验证与旧资源生成；服务器不会再次运行 sync-legacy。

将压缩包传到服务器私有目录，核对传输前后压缩包 SHA256，再解压。发布包为 `mikoshi-release/`，执行：

```sh
sudo python3 mikoshi-release/ops/mikoshi-cloud/install.py mikoshi-release --verify-only
sudo python3 mikoshi-release/ops/mikoshi-cloud/install.py mikoshi-release
```

安装程序核对清单、原站、端口和磁盘，然后以普通 `mikoshi-web` 用户运行 `npm ci` 和 Next 构建。Node固定为22.23.4，使用官方压缩包与固定SHA256，独立放在 `/opt/mikoshi/node`；已有同版本直接复用，不改变系统Node。构建单CPU，Node堆768MB，日志位于权限0600的 `/var/backups/mikoshi/build-*.log`。失败构建目录也保留。

安装器自身关闭Python字节码写入，严格清单验证不会因导入bundle.py产生额外`__pycache__`。即使维护者使用`umask 077`，也明确设置`/opt/mikoshi`、`releases`及Node运行目录的可遍历权限；npm和Next子进程单独使用`umask 022`。发布前再次将前端代码目录规范为0755、普通文件0644，保留必要执行位，再交由root拥有；不跟随缓存symlink修改其目标，缓存仍由前端服务用户拥有。私有数据库、备份和日志不应用这套公开代码权限。

生产构建使用 `NEXT_PUBLIC_MIKOSHI_AUTH_MODE=production`、`NEXT_PUBLIC_MIKOSHI_BASE_PATH=/mikoshi`。按项目附带的Next文档，standalone不自动包含public与.next/static，安装程序明确复制两者；运行缓存单独放 `/var/cache/mikoshi-web/<release>`，通过symlink提供 `.next/cache` 写权限。当前页面没有新增ISR；以后若增加服务端增量再生，应重新核对缓存合同。

## 运行与认证

- 前端：`mikoshi-web.service`，仅 `127.0.0.1:3118`。
- 账号及KOL网关：`mikoshi-gateway.service`，仅 `127.0.0.1:8878`。
- 新入口：`https://8.218.158.143/mikoshi/login`，注册也在此页。
- 公共路径仅登录页、其静态构建资源和品牌资源；其他Mikoshi页面通过Nginx `auth_request`真实会话验证。`/mikoshi-api/`与`/kol-studio/`由网关逐请求鉴权，不能仅凭cookie存在通过。
- 网关与旧KOL服务复用 `kol-workbench` 系统身份和 `/var/lib/kol-workbench/workspace.sqlite`，保留同一个乐观锁和历史记录；从不回填本机seed，不修改旧脑图或旧KOL身份体系。
- 完整组件文件使用稳定的系统组 `mikoshi-data`：目录root:mikoshi-data 0750、文件0640。安装时幂等创建组，仅新网关通过 `SupplementaryGroups=mikoshi-data` 获得读取权限；不依赖 `DynamicUser` 重启后可能改变的主GID，不修改旧服务。
- Mikoshi账号库为 `/var/lib/mikoshi-auth/auth.sqlite`。第一次需要的管理员邀请写在 `/var/lib/mikoshi-auth/bootstrap-invite.txt`，0600、网关用户拥有。脚本不打印邀请码；由负责人私下领取，在24小时内注册。邀请不会通过HTTP提供。之后由已登录管理员在界面发放和撤销邀请。
- 首位邀请的离线初始化由root操作已经建好的身份库，结束后按该库实际宿主uid/gid恢复邀请、数据库及本次可能生成的SQLite sidecar为0600。它不使用脱离systemd命名空间的`runuser`来访问StateDirectory，也不放宽`/var/lib/private`；这兼容DynamicUser的私有目录和id-mapped所有权。
- 不把其他既有浏览器本机模块宣称为已实现多人云端同步。

检查与重启：

```sh
sudo systemctl status mikoshi-web mikoshi-gateway mikoshi-backup.timer
sudo systemctl restart mikoshi-gateway mikoshi-web
sudo journalctl -u mikoshi-web -u mikoshi-gateway -n 60 --no-pager
```

成功安装后两个服务与备份timer均设置开机启动。保留新旧独立服务，不停掉脑图或旧KOL服务。

## 备份与回滚

切换前通过SQLite backup API分别获得事务一致的工作库和已有账号库副本，连同原Nginx配置、unit配置、旧current指向及校验信息保存在 `/var/backups/mikoshi/deploy-<时间>/`。数据文件0600、目录0700。每日04:50再做两库备份，**不自动删除旧备份或旧版本**。两库分别一致，但不是跨库业务事务；这两个库没有联合事务合同。

代码按清单hash安装到 `/opt/mikoshi/releases/<hash>`，`current`原子切换。配置校验或健康检查失败自动回退新服务、指向和Nginx配置，保留生成的账号与业务数据，不把旧库恢复覆盖到现库。所有旧release保留。

Nginx reload是异步换worker：安装程序最多等待20秒，确认新登录路径返回200后，才重新执行整套严格HTTPS检查。等待只针对登录路径就绪，不放宽匿名资料401、受保护页面302或旧站健康标准；超时或任一后续检查失败仍回滚。

手动代码回滚（使用实际部署记录目录）：

```sh
sudo python3 /opt/mikoshi/current/ops/mikoshi-cloud/install.py --rollback /var/backups/mikoshi/deploy-<实际时间>
```

回滚前检查当前配置仍与该次发布一致；发现其他人后改配置会停止，避免覆盖。首次部署回滚仅撤下新入口和新服务，保留原服务与资料。数据库恢复是另一个明确的数据操作，不能把代码回滚当成数据恢复。建议由负责人定期复制私有备份至另一个受控位置；本机快照不等于异地备份。

发布程序检查匿名保护与旧站基础存活，不创建业务数据。账号注册、角色、完整页面、浏览器操作及真实云端数据核对仍由本次统一验收完成。
