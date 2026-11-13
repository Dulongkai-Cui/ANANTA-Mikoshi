# SBS 0011 顶栏收紧

状态：ACCEPTED（独立验收AC01～03全部PASS）
日期：2026-10-18。前置SBS-0010已ACCEPTED。用户要求顶栏稍窄，按截图收紧高度与按钮留白，保持明确按钮感。Codex实现；data_ui_review独立验收；data_ui_tests定向检查。

根仓main，HEAD 5d888802504073bfa1f52f000848c6c18baabba4，暂存空；保留前步未提交成果，不commit/push或触及子仓。

## 计划与范围

1. 桌面顶栏约69px收为56px：上下padding由8px降4px，桌面业务按钮/搜索与滚动箭头由44px降36px，横向按钮padding与图文/按钮间距略收紧。
2. 手机或粗指针保留44px主控件；文字放大时允许高度自然增大，不固定高度裁字。保留4px焦点留白、可横滚导航、真实href、图标/底色/边框与实心选中。
3. 只改topbar、business-switcher及topbar高度token。FE-07同步最小56px和桌面36px；这符合FE-44桌面默认36–40px/触摸44px，无业务规则变动。
4. 生产构建（含类型）、相关文件lint、既有4条焦点E2E与定向实图/几何检查；纯样式无需新单元测试或重跑全部业务回归。通过独立检查后更新SBS/INDEX/CURRENT。

## 验收

| AC | 标准 |
|---|---|
| 01 | 常规桌面顶栏56px、业务按钮36px，视觉比SBS10更薄；图标/文字/选中完整，搜索/环境居中 |
| 02 | 320px与粗指针主控件至少44px，200%文字和间距下无整页横溢，4条既有逐项键盘焦点检查通过 |
| 03 | 构建/lint通过，业务href/逻辑及原资产未改；独立报告通过、真实证据/Git状态记录完整 |

回退仅恢复本步三个文件的尺寸类/token，不动业务数据、其他执行者改动或旧证据。当前无待决定阻断，不新增依赖、任务/模型调用或部署。

## 实际交付与验收

独立审查已核查真实页面、4张有效截图、5份几何、4条原焦点测试及源码/资产指纹，AC01/02/03全部PASS，无阻断。当前步骤关闭，不自动扩展功能或启动下一步骤。

三个实现文件仅改尺寸类/token；业务逻辑、路由、测试和资产保持前步版本。桌面1440/1280实测顶栏56px、六按钮及搜索36px；320手机与1280粗指针实测44px。200%字号/间距时顶栏自然增为105px、按钮72px，无裁字或整页横溢。4条原逐项焦点E2E原断言通过。构建（含TypeScript）与相关TSX lint通过；未新写单测或重跑53业务用例。

证据：[build.log](evidence/SBS-0011/build.log)、[lint.log](evidence/SBS-0011/lint.log)、[4条焦点](evidence/SBS-0011/e2e/results.json)、[几何/实图](evidence/SBS-0011/visual-results.json)、[稳定触屏补图](evidence/SBS-0011/visual-touch-results.json)、[源码指纹](evidence/SBS-0011/source-sha256.json)、[资产保全](evidence/SBS-0011/asset-preservation.json)、[Git及源码范围](evidence/SBS-0011/git-and-source-changes.json)、[独立报告](evidence/SBS-0011/independent-review.md)。

截图脚本首次定位失败与两张过渡态采样日志保留；只修证据采样定位/等待并补对应图，不更改产品或放宽断言。有效页面图包含三方号桌面、200%焦点及手机/粗指针稳定图。108项应用/测试文件对比SBS-0010仅3项变化，7项品牌/历史资产指纹全部一致。

本地预览继续http://127.0.0.1:3108；根main/HEAD未变、暂存空、未commit/push。代码备份before-topbar.zip可恢复本步尺寸。未部署、未连接外部服务；范围只覆盖共享顶栏外观。

