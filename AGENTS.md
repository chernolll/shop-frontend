# AGENTS.md — BD 达人管理系统 AI 入口

## 项目简介

BD 达人运营管理系统（基于 Vue Vben Admin v5.7），面向东南亚电商达人合作全流程管理。Monorepo 架构（Turbo + pnpm），业务代码集中在 `playground/`。

## 文档入口

```
AGENTS.md (本文)          ← 总入口：路由表 + 约束 + AI 角色
    ↓
docs/architecture.md      ← 系统架构全景 + 技术栈 + 层级依赖
docs/module-map.md        ← 路由→组件→API→Store 完整映射
docs/file-map.md          ← 关键文件索引
docs/dependency.md        ← 模块依赖关系图
    ↓
docs/modules/             ← 各业务模块详情
    bd.md                 ← BD 端核心模块
    review.md             ← 审核模块
    kol.md                ← KOL 管理模块
    system.md             ← 系统管理模块
    ↓
docs/business/            ← 核心业务知识
    sop-workflow.md       ← SOP 状态流转 (建联→送样→视频→汇款→完成)
    task-lifecycle.md     ← 任务创建→分配→执行→完成 全流程
    role-permission.md    ← Admin/BD 双角色权限模型
    ↓
docs/rules/               ← 编码与架构规范
    coding.md             ← 命名/目录/TS/Vue/API 规范
    architecture.md       ← 分层原则/数据流/禁止依赖
    ui.md                 ← UI 组件体系 + CSS 变量
    ↓
docs/memory/decisions.md  ← 关键架构决策记录
```

## 阅读顺序

1. 先读本文 → 了解项目身份和核心约束
2. 根据任务类型读对应的 `docs/modules/*.md`
3. 涉及业务流程时读 `docs/business/*.md`
4. 编码前参考 `docs/rules/coding.md`
5. 需要定位文件时查 `docs/file-map.md`

**原则：只读当前任务相关的文档，最小化上下文占用。**

## Coding 流程

```
新功能:  READ docs/module-map.md → READ docs/modules/<module>.md → 开发 → Lint 验证
Bug修复:  READ docs/business/<flow>.md → 定位模块 → READ docs/modules/<module>.md → 修复 → 验证
重构:    READ docs/architecture.md → READ docs/dependency.md → 设计 → 更新 docs/memory/decisions.md
```

## AI 行为约束

### 必须

- 编码前先读相关 `docs/` 文档
- 新代码保持与周边文件一致的风格、命名、结构
- 修改架构/模块/业务流程后同步更新 docs 文档
- Props/Emits 使用 `<script setup lang="ts">` + 泛型语法
- API 类型使用 namespace 组织（`XxxApi.Item` / `XxxApi.ListParams`）
- 所有标识符和注释使用英文，UI 文案使用中文

### 禁止

- ❌ 不读文档直接改代码
- ❌ 引入与 `docs/rules/` 冲突的模式
- ❌ 擅自升级依赖版本
- ❌ 在 `packages/` 中引用 `playground/` 代码
- ❌ 页面组件间互相 import
- ❌ 一次性加载全部文档
- ❌ 做任务范围外的"顺手重构"

### 提交规范

- Conventional Commits: `feat:` `fix:` `refactor:` `style:` `docs:` `chore:`
- 提交信息使用中文
- 结尾: `Co-Authored-By: Claude <noreply@anthropic.com>`

## 文档更新规则

- 新增模块/路由 → 更新 `docs/module-map.md` + 新建 `docs/modules/<name>.md`
- 修改业务流程 → 更新 `docs/business/*.md`
- 改变架构依赖方向 → 更新 `docs/architecture.md` + `docs/dependency.md` + `docs/memory/decisions.md`
- 调整编码规范 → 更新 `docs/rules/coding.md`
- 新增 API 函数 → 更新 `docs/file-map.md`

## 项目快捷信息

- 业务代码: `playground/src/`
- 路由定义: `playground/src/router/routes/modules/`
- API 函数: `playground/src/api/`
- 页面组件: `playground/src/views/`
- Pinia Store: `playground/src/store/`
- 共享包: `packages/effects/` + `packages/@core/`
- 启动: `pnpm dev:play`
- 构建: `pnpm build:play`
- Lint: `pnpm lint`
- 格式化: `pnpm format`
