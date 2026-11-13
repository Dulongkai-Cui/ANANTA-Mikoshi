# SBS-0004：采集组件搬迁后离线验证

日期：2026-10-18。在父任务整树移动与 SHA256 核验 PASS 后执行。未启动服务、安装器、浏览器、登录、采集或模型。

## Doctor 与内存解析

- Doctor 退出码 `0`；状态 `ready`；耗时 24.3 秒（含后续检查）。
- Scrapling 内存 HTML 解析退出码 `0`；输出 `offline parser PASS`；解析探针用 Python audit hook 禁止网络与子进程。
- Doctor 由包内 base Python 使用 `-I -B crawler_platform.py doctor` 调用；随后使用独立 scrapling-venv 的 `python.exe -I -B -c` 解析常量 HTML。
- Doctor 成功只证明依赖导入、schema、离线探针和许可证校验支持；不证明激活、真实账号、平台登录、Browser Garage 或采集可用。

```json
{
  "status": "ready",
  "checks": [
    {
      "name": "pydantic",
      "status": "ok",
      "imported": true
    },
    {
      "name": "mcp",
      "status": "ok",
      "imported": true
    },
    {
      "name": "scrapling",
      "status": "ok",
      "imported": true
    },
    {
      "name": "playwright",
      "status": "ok",
      "imported": true
    },
    {
      "name": "official_tool_schemas",
      "status": "ok"
    },
    {
      "name": "capability_registry",
      "status": "ok"
    },
    {
      "name": "isolated_scrapling_runtime",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "isolated_mediacrawler_runtime",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "bundled_node",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "bundled_git",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "isolated_scrapling_fetcher_import",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "isolated_scrapling_dynamic_fetcher_import",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "isolated_scrapling_stealthy_fetcher_import",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "isolated_scrapling_spider_import",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "isolated_scrapling_shell_import",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "isolated_scrapling_mcp_import",
      "status": "ok",
      "returncode": 0
    },
    {
      "name": "license_verification_support",
      "status": "ok"
    }
  ],
  "readiness_scope": "bundled_imports_schemas_and_offline_runtime_probes",
  "tool_count": 17,
  "platform_tools_invoked": false,
  "browser_checked": false,
  "login_checked": false,
  "live_collection_started": false,
  "note": "Offline runtime checks only. No browser, login, collection or activation is started. Use CrawlerF1.exe for its existing activation and account workflow; live tools retain their official preflight and human confirmations.",
  "portable": true,
  "external_network_used": false,
  "license_activation_checked": false,
  "account_scope_configured": false,
  "venv_relocation": "package_local_cfg_only"
}
```

## 文件变化

- 执行前 48,774 文件的大小/mtime 与已通过全 SHA256 校验的移动清单一致；缺失/额外 0。
- 执行后新增文件 0、删除文件 0、元数据变化文件 4；新增目录 0、删除目录 0。
- 下面列出所有检测到的变化；随后追加全文件 SHA256 复核。

```json
{
  "added_files": [],
  "deleted_files": [],
  "changed_files": [
    {
      "path": "resources/app/workspace/vendor/MediaCrawler/.venv/pyvenv.cfg",
      "before": {
        "path": "resources/app/workspace/vendor/MediaCrawler/.venv/pyvenv.cfg",
        "bytes": 122,
        "mtime_ns": 1792255510000000000,
        "sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      },
      "after": {
        "bytes": 183,
        "mtime_ns": 1792267576245237600,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb"
      }
    },
    {
      "path": "resources/runtime/hermes-venv/pyvenv.cfg",
      "before": {
        "path": "resources/runtime/hermes-venv/pyvenv.cfg",
        "bytes": 122,
        "mtime_ns": 1792255510000000000,
        "sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      },
      "after": {
        "bytes": 183,
        "mtime_ns": 1792267576245237600,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb"
      }
    },
    {
      "path": "resources/runtime/pitwall-venv/pyvenv.cfg",
      "before": {
        "path": "resources/runtime/pitwall-venv/pyvenv.cfg",
        "bytes": 122,
        "mtime_ns": 1792255510000000000,
        "sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      },
      "after": {
        "bytes": 183,
        "mtime_ns": 1792267576244232800,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb"
      }
    },
    {
      "path": "resources/runtime/scrapling-venv/pyvenv.cfg",
      "before": {
        "path": "resources/runtime/scrapling-venv/pyvenv.cfg",
        "bytes": 122,
        "mtime_ns": 1792255510000000000,
        "sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      },
      "after": {
        "bytes": 183,
        "mtime_ns": 1792267576245237600,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb"
      }
    }
  ],
  "added_directories": [],
  "deleted_directories": []
}
```

## VCPAI 删减后保全复核

- 216 个保护文件共 6,648,435,532 B 全量重新计算 SHA256，与本次 before JSON 比较：差异 0。
- HEAD `8f186ce5198d98adb50fb998ab04861a0d7acb17`；分支 `codex/player-upgrade-positioning-20261007`；跟踪工作树状态 `clean`；未跟踪研究文件 209 个。
- 以下 latest installer 的内嵌 payload 与删减前同 SHA256；原有全压缩完整性测试结果因此仍适用于保留内容。没有运行安装器。

```json
{
  "bytes": 3999065591,
  "sha256": "3155202ae124d1b5d90b5d8f4217b3a3cd2b00957a830ef157a984443b2b9281",
  "payload_bytes": 3996412726,
  "payload_sha256": "eb1f6ffb1db65c746b681c3966ade9795129b3ad2450c5aa1e0fa455b83b0d8a",
  "payload_matches_before": true
}
```

- vendor 全树按审计前清单逐路径/大小/mtime 核对，结果如下；这里不声称进行了 vendor 全文件 SHA256 重算。

```json
{
  "files": 20216,
  "bytes": 1185709526,
  "missing": [],
  "extra": [],
  "metadata_changed": []
}
```

- 构建源码、前后端锁文件及本机依赖保留检查：

```json
{
  "FrontAll/package.json": true,
  "FrontAll/package-lock.json": true,
  "FrontAll/backend/package.json": true,
  "FrontAll/backend/package-lock.json": true,
  "release/windows-native/Build-WindowsInstaller.ps1": true,
  "release/windows-native/bootstrapper/VpcAiSetupBootstrapper.cs": true,
  "release/windows-native/scripts/Start-VPC-AI.ps1": true,
  "release/windows-native/scripts/Stop-VPC-AI.ps1": true,
  "release/windows-native/scripts/Install-VPC-AI.ps1": true,
  "FrontAll/node_modules": true,
  "FrontAll/backend/node_modules": true
}
```

## 全文件 SHA256 最终复核

对照已通过搬迁核验的 components-move.json，重新读取两个组件的每个文件计算 SHA256；不只依赖 mtime。

```json
[
  {
    "component": "Components/CrawlerF1",
    "files": 48774,
    "bytes": 2464029167,
    "unchanged_sha256": 48770,
    "changes": [
      {
        "path": "resources/app/workspace/vendor/MediaCrawler/.venv/pyvenv.cfg",
        "bytes": 183,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb",
        "previous_sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      },
      {
        "path": "resources/runtime/hermes-venv/pyvenv.cfg",
        "bytes": 183,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb",
        "previous_sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      },
      {
        "path": "resources/runtime/pitwall-venv/pyvenv.cfg",
        "bytes": 183,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb",
        "previous_sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      },
      {
        "path": "resources/runtime/scrapling-venv/pyvenv.cfg",
        "bytes": 183,
        "sha256": "5110aaa0abb4a17320b94a75d61d7336253e73cb353e9bc58d5d4ad62a0804fb",
        "previous_sha256": "f564055b9de73f515361e0d2ff776101c95d01e2f7cdf81c8bc1ca15018e9e7d"
      }
    ],
    "missing": [],
    "added": [],
    "unexpected_changed": [],
    "expected_cfg_not_changed": [],
    "cfg_semantics": [
      {
        "path": "resources/runtime/scrapling-venv/pyvenv.cfg",
        "home_is_current_bundled_python": true,
        "system_site_packages_disabled": true
      },
      {
        "path": "resources/app/workspace/vendor/MediaCrawler/.venv/pyvenv.cfg",
        "home_is_current_bundled_python": true,
        "system_site_packages_disabled": true
      },
      {
        "path": "resources/runtime/hermes-venv/pyvenv.cfg",
        "home_is_current_bundled_python": true,
        "system_site_packages_disabled": true
      },
      {
        "path": "resources/runtime/pitwall-venv/pyvenv.cfg",
        "home_is_current_bundled_python": true,
        "system_site_packages_disabled": true
      }
    ]
  },
  {
    "component": "Components/CF1-Skills",
    "files": 52,
    "bytes": 500289,
    "unchanged_sha256": 52,
    "changes": [],
    "missing": [],
    "added": [],
    "unexpected_changed": [],
    "expected_cfg_not_changed": [],
    "cfg_semantics": []
  }
]
```

结论：PASS。CF1 48,774 文件中 48,770 文件逐字不变，只有四个被授权修复的 pyvenv.cfg 发生预期变化；独立 Skills 52 文件全部同 SHA256。没有新增、删除或额外内容改动。

离线环境与保全验收通过；真实激活、平台账号登录与正式采集仍需后续独立验收，本轮未执行。

本验证阶段的写入范围：程序侧仅上述四个 CF1 pyvenv.cfg（合计增加 244 B）；证据侧新建本文件、追加 audit-crawler-vpc.md。文件差异结论覆盖两个 Components 组件目录，未将其扩大为整台 Windows 系统的写入审计。
