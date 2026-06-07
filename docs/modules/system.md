# 系统管理模块

## 模块职责

Admin 端系统基础数据管理：组织架构、人员管理、角色权限、菜单配置。

## 入口文件

- 路由入口: `playground/src/router/routes/modules/system.ts`
- 路由路径前缀: `/system`
- 权限: Admin only

## 子模块

### 1. 部门管理（Departments）

- 页面: `views/system/department/index.vue`
- API: `api/system/admin-department.ts`
- 核心操作: 部门 CRUD + 树形结构

### 2. 员工管理（Employees）

- 页面: `views/system/employee/index.vue`
- API: `api/system/admin-employee.ts`
- 核心操作: 员工 CRUD + 关联部门

### 3. BD 人员管理（BD Persons）

- 页面: `views/system/bd-person/index.vue`
- API: `api/system/admin-bd-person.ts`
- 核心操作: BD 人员身份管理

### 4. 角色管理（Roles）

- 页面: `views/system/role/list.vue` + `modules/form.vue`
- 数据定义: `views/system/role/data.ts`
- API: `api/system/role.ts`
- 核心操作: 角色 CRUD + 权限分配

### 5. 菜单管理（Menus）

- 页面: `views/system/menu/list.vue` + `modules/form.vue`
- 数据定义: `views/system/menu/data.ts`
- API: `api/system/menu.ts`
- 核心操作: 动态菜单配置

### 6. 部门树管理（Depts）

- 页面: `views/system/dept/list.vue` + `modules/form.vue`
- API: `api/system/dept.ts`
- 核心操作: 部门树 CRUD

## 共享组件

- `views/system/shared/useAdminDepartmentSelect.ts` — 部门选择器
- `views/system/shared/useAdminEmployeeSelect.ts` — 员工选择器
- `views/system/shared/useAdminPostSelect.ts` — 岗位选择器
- `views/system/shared/useAdminShopSelect.ts` — 店铺选择器

## 关联模块

- 角色权限直接影响 BD 模块和 Review 模块的可见菜单
