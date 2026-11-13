# 营销项目工作台

对应[SBS-0016](../../../../../SBS/SBS-0016-marketing-workbench.md)，原型能力映射见[SOURCE_MAP](../../../../../Product/handoffs/SBS-0016/SOURCE_MAP.md)。

- `model.ts`：任务、任务内节点、事件线、项目节点、项目设置、统计/提醒和运行时校验。
- `repository.ts`：独立身份键 `mikoshi:workbench:v1:<userId>`；版本比较、Web Locks、写回核验。空读不写，失败保留草稿与旧串。没有服务器接口。
- `workbench-provider.tsx`：五页共用数据、筛选和编辑草稿；按身份重挂载，跨标签同步，站内/退出/换身份守卫。
- `data-exchange.ts`：CSV防公式、JSON完整备份与原子追加；最多2MB/300条，重新分配记录ID，导入不覆盖工作区设置。原型cedian格式不直接导入。
- `overview/tasks/timeline/people`：四种项目视图；`kol-overview`只读取KOL公开model/provider，不另建名册。
- `editors.tsx`：统一编辑、保存、取消与删除确认；节点日期必须在任务周期内。
- `workbench-page.tsx`：页面入口、导出导入、提醒与只读示例；`workbench.css`引用现有语义色板，字号和时间轴使用rem。

默认没有任务。示例仅通过“查看只读示例”在内存中展示，不会自动写入本机工作区。旧dashboard布局key、原型缓存key、三方号及KOL仓储均不由本模块写入。

任务“完成”仅为项目成员手工维护；KOL合作、锁档、排期与平台已发布是不同语义。成员只是任务分工文字，不是员工账户、权限、工时或绩效。刷新会丢失未保存草稿；已保存资料仅在当前浏览器，使用JSON备份保留。
