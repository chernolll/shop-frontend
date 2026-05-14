# UI System — AI Prompt

> 本文档是 AI 生成 UI 代码的系统级 prompt，用于约束输出风格、组件选择、交互规范。项目已集成 `ui-ux-pro-max` skill，负责布局/UX/信息层级决策。本文件负责系统级约束。

---

## 一、项目身份

```text
企业级 SaaS Admin 后台系统
```

业务域：TikTok 电商 BD 管理、达人/KOL 管理、SOP 流程、审核流、店铺管理、视频数据分析

角色：ADMIN（超级管理员）、BD（商务拓展人员）

技术栈：**Vue 3 (Composition API) + TypeScript + Vben Admin 5.x + Ant Design Vue + Tailwind CSS + vxe-table**

---

## 二、设计系统 Token

> 来自 ui-ux-pro-max skill 数据库，SaaS General + Analytics Dashboard 混合方案

### 2.1 色彩

| Token          | Hex       | Tailwind     | 用途                       |
| -------------- | --------- | ------------ | -------------------------- |
| Primary        | `#2563EB` | `blue-600`   | 主操作按钮、选中态、链接   |
| Secondary      | `#3B82F6` | `blue-500`   | 次要操作、hover 态、进度条 |
| CTA            | `#F97316` | `orange-500` | 关键行动点（创建、提交）   |
| Background     | `#F8FAFC` | `slate-50`   | 页面底色                   |
| Card           | `#FFFFFF` | `white`      | 卡片、表格底               |
| Text Primary   | `#1E293B` | `slate-800`  | 标题、正文                 |
| Text Secondary | `#475569` | `slate-600`  | 辅助文字、描述             |
| Text Muted     | `#94A3B8` | `slate-400`  | 占位符、禁用态             |
| Border         | `#E2E8F0` | `slate-200`  | 分割线、卡片边框           |

**状态色（系统统一）**：

| 状态    | Hex       | Tailwind    | 语义             |
| ------- | --------- | ----------- | ---------------- |
| Success | `#22C55E` | `green-500` | 通过、完成、正常 |
| Error   | `#EF4444` | `red-500`   | 失败、驳回、终止 |
| Warning | `#F59E0B` | `amber-500` | 待审核、警告     |
| Info    | `#3B82F6` | `blue-500`  | 进行中、处理中   |
| Muted   | `#94A3B8` | `slate-400` | 未开始、默认     |

**暗色模式**：以上 Light mode token 为默认。Dark mode 走 Vben Admin 内置暗色主题变量，不在本文件单独定义。

### 2.2 字体

**主方案**：Modern Professional（Poppins + Open Sans）

```css
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
```

| 层级                | 字体      | 字重 | 大小 | 行高 |
| ------------------- | --------- | ---- | ---- | ---- |
| Page Title          | Poppins   | 600  | 24px | 1.3  |
| Section Title       | Poppins   | 500  | 18px | 1.4  |
| Card Title          | Poppins   | 500  | 16px | 1.4  |
| Body                | Open Sans | 400  | 14px | 1.6  |
| Description / Muted | Open Sans | 400  | 12px | 1.5  |
| Table Cell          | Open Sans | 400  | 13px | 1.5  |
| Code / Data         | Fira Code | 400  | 13px | 1.5  |

**数据/数字专用**：Fira Code（表格内数字、金额、统计数据列使用等宽字体对齐）

### 2.3 间距

```text
页面 padding: 16px ~ 24px
区块间距（Card 之间）: 16px
卡片内 padding: 16px ~ 24px
表格行高: 40px
表单项间距: 16px
Toolbar 与 Table 间距: 12px
```

### 2.4 圆角与阴影

```text
Card / Modal border-radius: 8px
Button border-radius: 6px
Input / Select border-radius: 6px
Tag border-radius: 4px
Table border-radius: 6px (外层容器)

Card shadow: 0 1px 3px rgba(0,0,0,0.06) — 极轻，信息密度优先
Modal shadow: 0 4px 16px rgba(0,0,0,0.12)
Dropdown shadow: 0 4px 12px rgba(0,0,0,0.1)
```

### 2.5 动画

```text
微交互时长: 150-200ms（hover、focus、tab 切换）
面板展开/收起: 200-300ms
Modal 进出: 200ms ease-out（入场）、150ms ease-in（离场）
Transition easing: cubic-bezier(0.4, 0, 0.2, 1) — 标准缓出
```

**强制要求**：所有动画需适配 `prefers-reduced-motion: reduce`，关闭非必要动效。

---

## 三、AI UI 输出原则

### 3.1 核心原则

```text
信息效率 > 视觉炫技
```

| 必须                          | 禁止                   |
| ----------------------------- | ---------------------- |
| 业务效率优先                  | Dribbble 风格设计      |
| 信息层级清晰                  | 视觉炫技 / 复杂渐变    |
| 长期可维护                    | 大量动画               |
| 系统统一性                    | 高饱和 UI 配色         |
| Vben Admin 风格一致           | 设计作品集风格         |
| 使用 skill 的 SaaS Admin 能力 | 过度自定义替代框架组件 |

目标：**像成熟业务系统，而不是设计作品。**

### 3.2 设计风格

```text
Data-Dense Dashboard × Trust & Authority
```

关键词：Clean / Structured / Efficient / Professional / Scalable

### 3.3 组件优先级

当需要在以下层级选择时，按优先级：

1. **Vben UI Kit 组件**（Page、Card、Modal、Drawer、Tabs、Description 等）
2. **Ant Design Vue 组件**（Steps、Tag、Badge、Tooltip、Popconfirm 等）
3. **vxe-table**（数据表格，含排序/筛选/分页/导出）
4. **Lucide Icons**（Vben 内置图标集，禁止 emoji）
5. **Tailwind CSS**（仅用于微调间距、颜色等原子样式）

禁止：重复造轮子、用自定义复杂组件替代现有生态。

---

## 四、页面结构规范

### 4.1 标准页面骨架

```text
Page（Vben Page 组件）
 ├── Header（标题 + 面包屑）
 ├── Toolbar（左右分区：搜索/筛选 + 操作按钮）
 ├── Main Content（Card 包裹）
 │    ├── Table（vxe-table）
 │    └── Pagination
 └── Footer（可选，极少使用）
```

### 4.2 四种核心页面类型

| 页面类型 | 结构 | 代表 |
| --- | --- | --- |
| **数据管理页** | Toolbar → Table → Pagination | 达人列表、SKU 管理、审核列表 |
| **详情/流程页** | Steps → Card 分区 → 操作区 | SOP 详情、达人详情 |
| **表单页** | Card 分区 → Form → 提交区 | 任务创建、员工编辑 |
| **Dashboard** | KPI 卡片行 → 图表网格 → 列表 | 工作台 |

---

## 五、Table 页面规范（最高频）

系统 80%+ 页面属于数据管理页，必须统一。

### 5.1 Toolbar

```text
Toolbar
 ├── 左侧：搜索框 + 筛选下拉（最多 4 个，超出折叠）
 └── 右侧：主操作按钮（新建/导出等，最多 3 个）
```

- 搜索框始终在左侧第一位
- 筛选条件过多时，使用"更多筛选"展开/收起
- 主操作按钮突出 Primary 色，次要操作用 Default

### 5.2 Table

统一属性：

- `stripe`（斑马纹，交替行色 `#F8FAFC` / `#FFFFFF`）
- `hover`（hover 行高亮 `#F1F5F9`）
- `loading`（数据加载中显示骨架/spinner）
- `empty`（空状态：无数据时显示图标 + 引导文案）
- `fixed action column`（操作列固定右侧，宽度 120-180px）

操作列规则：

- 最多显示 **3 个**按钮（文字链接或 icon-button）
- 超出 3 个的放入 `Dropdown`
- 危险操作（删除、废弃、驳回）需二次确认（Popconfirm）

### 5.3 列宽规则

| 字段类型                | 宽度             | 对齐 |
| ----------------------- | ---------------- | ---- |
| ID / 编号               | 80-100px         | 左   |
| 短文本（状态Tag、代码） | 100-140px        | 中   |
| 名称/标题               | 160-240px（min） | 左   |
| 金额/数字               | 100-140px        | 右   |
| 日期时间                | 140-180px        | 左   |
| 操作列                  | 120-180px        | 右   |

### 5.4 分页

- 默认每页 20 条（page_size: 20）
- 可选 10 / 20 / 50 / 100
- 显示总条数 + 页码 + 跳转

---

## 六、SOP / Workflow 页面规范

SOP 详情页是系统核心交互。

### 6.1 结构

```text
SOP Detail Page
 ├── 顶部步骤条（SopSteps）— 可点击切换、当前高亮、完成态打勾
 ├── 状态标签区（Tag：进行中/已完成/已终止）
 ├── 步骤内容区（Card 分区，每个 Card 一个逻辑块）
 │    ├── 信息展示区（Description / Table）
 │    ├── 表单区（Form）
 │    └── 审核区（Timeline / Tag + 审批意见）
 └── 操作区（底部固定或跟随内容）
      ├── 主操作（推进下一阶段 / 提交审核）
      ├── 次要操作（保存草稿）
      └── 危险操作（终止流程，二次确认）
```

### 6.2 状态流转视觉

- 已完成步骤：绿色对勾 + 实线连线
- 当前步骤：蓝色高亮 + 呼吸动画（可选，尊重 reduced-motion）
- 未到达步骤：灰色 + 虚线
- 终止状态：红色指示，步骤条不变但内容区展示终止信息

禁止：所有流程信息堆叠在一个区域、无状态反馈。

---

## 七、Dashboard 页面规范

```text
Dashboard
 ├── KPI 概览行（4-6 个统计卡片：任务数/达人/视频/GMV/完成率）
 ├── 图表区（2 列网格：趋势图 + 排行图）
 └── 列表区（最近活动 / 待处理审核）
```

统计卡片必须包含：数值（大号 Fira Code 等宽字体）+ 标签 + 环比变化（↑↓ 绿色/红色）

禁止：单纯堆图表、无业务含义。

---

## 八、Form 页面规范

- 表单使用 Ant Design Vue `Form` 组件
- 标签对齐：单列表单 label 左对齐，多列网格布局
- 必填字段用红色星号标识
- 验证：前端提交前校验 + 后端错误展示在对应字段下方
- 复杂表单分 Card 区块（基本信息 / 分配信息 / 审核信息）
- 提交区：底部固定或跟随，主按钮 Primary，取消按钮 Default 或返回上一页

---

## 九、状态系统（强制统一）

### 9.1 业务枚举 → 颜色映射

```text
成功/通过/完成/正常：green（#22C55E）
失败/驳回/终止/异常：red（#EF4444）
待审核/警告/即将逾期：amber（#F59E0B）
进行中/处理中：blue（#3B82F6）
未开始/默认/草稿：slate/gray（#94A3B8）
```

### 9.2 Tag 组件规范

- 所有枚举值必须在表格列和详情页中使用统一的 Tag 组件
- Tag 颜色必须与上述状态色一致
- 同状态同颜色，不允许同一状态在不同页面使用不同颜色

---

## 十、交互规范

### 10.1 必须实现

| 场景       | 规范                                  |
| ---------- | ------------------------------------- |
| 数据加载中 | Skeleton 或 Table loading             |
| 操作进行中 | 按钮 disabled + 加载态（spin）        |
| 操作成功   | Toast 提示（顶部居中，3s 自动消失）   |
| 操作失败   | Toast 提示 + 具体错误信息             |
| 空状态     | 图标 + 引导文案 + 可选行动按钮        |
| 网络异常   | 错误提示 + 重试按钮                   |
| 危险操作   | Popconfirm 二次确认（删除/废弃/驳回） |

### 10.2 Hover / Focus

- 所有可点击元素：`cursor-pointer` + hover 态（颜色/背景变化）
- Focus：所有表单控件和按钮有可见的 `focus-ring`（蓝色 2px），禁止 `outline: none` 无替代
- Touch：移动端/平板触摸目标 ≥ 44×44px

### 10.3 可访问性

| 规则       | 要求                                                |
| ---------- | --------------------------------------------------- |
| 色彩对比度 | 正文 ≥ 4.5:1（`#1E293B` on `#F8FAFC` ≈ 12:1 ✅）    |
| 色彩不唯一 | 错误信息 = 红色文字 + 错误图标 + 错误文案，三者并用 |
| 键盘导航   | Tab 序遵循视觉顺序                                  |
| 图片 alt   | 商品图、头像等 meaningful image 必须有 alt 描述     |
| 表单 label | 所有输入框关联 label                                |

### 10.4 动画约束

- 所有动画 ≤ 300ms
- 禁用 ∞ 循环动画（loading spinner 除外）
- 只动画 `transform` 和 `opacity`，不动画 `width/height/top/left`
- 必须尊重 `prefers-reduced-motion: reduce`

---

## 十一、组件使用速查表

| 需求               | 组件                         | 来源           |
| ------------------ | ---------------------------- | -------------- |
| 页面容器           | `Page`                       | Vben UI Kit    |
| 卡片分区           | `Card`                       | Ant Design Vue |
| 数据表格           | `vxe-table`                  | vxe-table      |
| 表单               | `Form` + `FormItem`          | Ant Design Vue |
| 弹窗               | `Modal`                      | Ant Design Vue |
| 抽屉（侧边栏编辑） | `Drawer`                     | Ant Design Vue |
| 步骤条             | 自定义 Steps（本项目已实现） | `SopSteps.vue` |
| 标签/徽标          | `Tag` / `Badge`              | Ant Design Vue |
| 确认弹窗           | `Popconfirm`                 | Ant Design Vue |
| 下拉菜单           | `Dropdown` + `Menu`          | Ant Design Vue |
| 提示/气泡          | `Tooltip`                    | Ant Design Vue |
| 通知               | `message` (Toast)            | Ant Design Vue |
| 图标               | Lucide Icons（`lucide:xxx`） | Vben 内置      |
| 描述列表           | `Descriptions`               | Ant Design Vue |
| 标签页             | `Tabs`                       | Ant Design Vue |
| 空状态             | `Empty`                      | Ant Design Vue |
| 加载               | `Spin` / `Skeleton`          | Ant Design Vue |

---

## 十二、禁止事项

```text
❌ 裸 div 堆叠（必须有 Page / Card 等容器）
❌ 纯 Tailwind 堆砌（优先使用组件，Tailwind 仅做微调）
❌ 页面风格不统一（统一使用上述设计 token）
❌ 随意颜色（一切颜色必须来自 2.1 色彩表）
❌ 高密度拥挤布局（严格遵守 2.3 间距规范）
❌ 炫技动画（遵守 2.5 + 10.4）
❌ emoji 作为图标（使用 Lucide Icons）
❌ 复杂玻璃态 / 过度渐变 / 霓虹效果
❌ HUD / Sci-Fi / Futuristic 风格
❌ 同一状态在不同页面使用不同颜色
```

---

## 十三、AI 生成页面前必须执行的步骤

### Step 1：判断页面类型

从以下 4 种中确定一种：

- 数据管理页（Table 为主）
- 详情/流程页（Steps + Card）
- 表单页（Form + Card）
- Dashboard（KPI + 图表 + 列表）

### Step 2：从本文件读取对应规范

- Table 页 → 第五节
- SOP/流程页 → 第六节
- Dashboard → 第七节
- 表单页 → 第八节

### Step 3：使用 ui-ux-pro-max skill 获取具体设计建议

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<页面关键词>" --design-system -p "<页面名称>"
```

### Step 4：使用 Vue 栈约束

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "form table modal layout" --stack vue
```

### Step 5：检查清单（提交前）

- [ ] 没有 emoji 被用作图标（全部使用 Lucide Icons）
- [ ] 所有可点击元素有 `cursor-pointer`
- [ ] 所有 hover 态有视觉反馈
- [ ] 色彩全部来自 2.1 色彩表
- [ ] 同状态同颜色（9.1 状态色映射）
- [ ] 间距遵守 2.3 规范
- [ ] 动画 ≤ 300ms，尊重 reduced-motion
- [ ] 表格有 loading / empty / stripe / hover
- [ ] 危险操作有 Popconfirm
- [ ] Form label 完整、必填标识清晰
- [ ] 页面有 Page / Card 容器，无裸 div 堆叠
- [ ] 使用 Vben/Ant Design 组件，未重复造轮子

---

## 十四、最终目标

```text
稳定  ·  专业  ·  统一  ·  可扩展
```

系统应当看起来像 **真实企业在使用的业务后台**，而不是设计作品。
