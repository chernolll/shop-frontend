# UI 规范

> 基于现有 CSS 变量和 Ant Design Vue 的设计系统

## 布局

- 标准管理后台布局: 侧边栏（Sidebar）+ 顶栏（Header）+ 内容区（Content）
- 布局组件: `packages/@core/ui-kit/layout-ui`
- Tabs 页签: `packages/@core/ui-kit/tabs-ui`
- 表单: `packages/@core/ui-kit/form-ui` (`VbenForm`)

## 配色（CSS 变量）

| 语义     | 变量                | 说明                     |
| -------- | ------------------- | ------------------------ |
| 主色     | `--primary`         | `212 100% 45%`（蓝色系） |
| 成功     | `--success`         | `144 57% 58%`            |
| 警告     | `--warning`         | `42 84% 61%`             |
| 错误     | `--destructive`     | `359 100% 65%`           |
| 背景     | `--background`      | `0 0% 100%`              |
| 次级背景 | `--background-deep` | `216 20% 96%`            |
| 卡片背景 | `--card`            | `0 0% 100%`              |
| 边框     | `--border`          | `240 6% 90%`             |

支持多主题切换: `default` / `violet` / `pink` / `green` / `orange` / `slate` 等

## Typography

- 字体: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`
- 基准字号: `--font-size-base: 16px`
- 菜单字号: `calc(var(--font-size-base) * 0.875)`

## 圆角

- 统一: `--radius: 0.5rem`

## UI 组件体系

| 类别 | 来源 | 说明 |
| --- | --- | --- |
| 基础组件 | Ant Design Vue | Button / Input / Select / Table / Modal / Drawer 等 |
| 高级表格 | VXE Table | 可编辑表格、虚拟滚动 |
| 表单增强 | `VbenForm` (`@core/ui-kit/form-ui`) | Schema 驱动的表单系统 |
| 弹出层 | `@core/ui-kit/popup-ui` | Modal / Drawer 增强 |
| 菜单 | `@core/ui-kit/menu-ui` | 侧边栏菜单 |
| 图标 | `@vben/icons` (Iconify + SVG) | Lucide / Ion / Mdi 图标集 |
| 加载 | `@vben/common-ui` | v-loading / v-spinning 指令 |
| 动效 | `@vben/plugins/motion` | 过渡动画插件 |
| Tooltip | Tippy.js | 高级 tooltip / popover |
| Vue Query | `@tanstack/vue-query` | 服务端状态管理 |
| 验证码 | Slider / Point Selection / Rotate Captcha | 人机验证 |
| 剪裁 | Cropper | 图片裁剪 |
| 富文本 | TipTap | 富文本编辑器 |

## 间距与布局 Pattern

- 页面统一通过 Tailwind CSS 管理间距
- 表单使用 `VbenForm` 的 schema 配置，不手写表单布局
- 表格页面统一使用 VXE Table + 分页 footer
- 弹窗/抽屉使用 `@core/ui-kit/popup-ui` 的 `useVbenModal` / `useVbenDrawer`
