# 源码交付边界

2026-11-13 从原工作区当前文件导出，基线 HEAD `5d888802504073bfa1f52f000848c6c18baabba4`。原工作区包含未提交实现，因此这个 HEAD 本身不代表交付文件版本；逐文件原始 SHA256 见 [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json)。新仓库采用独立初始提交，没有改写/上传原工作区、各独立子仓或备份中的旧历史。

## 已包含

Next 前端及其测试、锁文件、设计资源；Python 身份/KOL网关、发布/备份/回滚；KOL原生HTML/JS/CSS、SQLite Store、集成适配和当前组件依赖的静态历史资料/图片；B站原始HTML与生成器；Constitution、Product、SBS文本、六套设计资源的版本索引。

这是一套可运行系统源码，不是线上数据导出。KOL静态data.json含963 UP和95创意，早于最新云端工作库，仅供明确选择的本机开发参考。生产网关不会用该文件覆盖数据。历史HTML也只作生成来源，默认输出零数据展示。

## 保留在原位置、不上传

账号和业务数据库、邀请码、Cookie/密钥、.env私密配置、.local、_git_backups、node_modules、.next、生成legacy缓存、日志、历史截图/私有执行回执；未整合的OpenBP/Harness/Kiroshi/Torpedo/VCPAI/工作盘点独立仓；CrawlerF1、BusinessMap等候选原件；第三方设计仓浅克隆。源码中的历史文档链接可能指向这些未分发证据，须向负责人取得受控访问，不能把缺失证据解读为验收通过。

## 相对原件的交付调整

业务运行源码及静态参考数据逐字节保留。以下文档增加当前协作说明，避免旧描述误导：AGENTS.md、REPOSITORIES.md、Product/handoffs/CURRENT.md、frontend/mikoshi-web/README.md。frontend/mikoshi-web/.env.example改成无凭据的现役模式示例。

新增根README、CONTRIBUTING、Git忽略/字节保持规则、PR模板、基础CI，以及init_dev.py/test_dev_setup.py（仅供本机新库初始化和独立回归）。运行时源文件没有借此改动。根SBS/INDEX仍记录原步骤状态；GitHub上传不能替代SBS-0023欠缺的云端发布/备份及浏览器验证。

## 维护原则

今后协作代码以此仓库的分支和PR为准。未指定协作者GitHub账号，因此本次没有自行邀请成员。该库包含内部资料及品牌，必须保持私有；生产更新由负责人按部署文档人工执行，CI没有生产权限且不自动部署。
