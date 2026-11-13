# 第三方来源与许可

本应用没有从`frontend/fronted-skill`运行时导入源码；来源仓保持独立只读。依赖精确版本及完整依赖树见package-lock.json，包许可证保留在对应npm分发包中。

## shadcn/ui 改编组件

来源：https://github.com/shadcn-ui/ui ，锁定来源SHA：`d2fba50ee5b9113008b5bb908563527b7efd2f27`。使用new-york-v4的Radix体系，按需改编Button、Input、Label、Dialog、Sheet（本地名Drawer）、DropdownMenu、Tooltip。改编位置`src/components/ui`；Mikoshi Notice/Badge等为项目实现。主要改动是语义tokens、中文可访问名称、pending反馈、尺寸与焦点恢复；没有复制整个registry或上游应用。

以下许可证适用于上述改编来源：

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 技能与设计参考

Emil、UI UX Pro Max、Taste、Awesome DESIGN.md作为设计/研究参考；Impeccable operate/audit/harden/polish作为工作方法，未把其引擎、hook或整份技能嵌入应用。各来源SHA、许可及采用记录见[SBS-0007技能记录](../../SBS/evidence/SBS-0007/implementation/skill-usage.md)和[资源清单](../fronted-skill/sources.lock.json)。参考不表示获得Apple或任何第三方官方认证。

字体使用操作系统回退，不打包Apple专有字体、图标或Logo。图标通过已锁定的lucide-react包使用，保留其npm包许可证。后续新增或重新分发资源时同步维护本文件。
