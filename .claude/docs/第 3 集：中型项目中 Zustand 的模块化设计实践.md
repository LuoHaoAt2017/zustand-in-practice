# 🎬 第 3 集：中型项目中 Zustand 的模块化设计实践

**目标观众**：已经会基础 Zustand 的中级前端
**时长**：28–32 分钟
**Demo**：Todo + 用户偏好 + 权限管理（拆分 store）

---

## ⏱ 00:00–01:00｜开场钩子

> 上一集我们学了基础用法和 5 个坑。
> 今天，我要展示如何在中型项目中拆分 store，让你的状态管理干净、可维护，并且性能更好。

---

## ⏱ 01:00–04:00｜场景介绍

* 小型项目无法展示模块化
* 中型项目常见状态：

  1. tasks
  2. user
  3. settings
* 展示不拆 store 时的问题：

  * 文件巨大
  * selector 混乱
  * 多模块耦合

---

## ⏱ 04:00–08:00｜拆分 store 基础示例

### 代码节奏

```js
// tasksStore.js
import create from 'zustand'
export const useTasksStore = create(set => ({
  tasks: [],
  addTask: (task) => set(state => ({ tasks: [...state.tasks, task] })),
}))

// userStore.js
export const useUserStore = create(set => ({
  user: null,
  setUser: (u) => set({ user: u }),
}))
```

讲解：

* 每个模块 store 独立
* 组件只订阅自己需要的 store

---

## ⏱ 08:00–12:00｜组合 store 使用

* 在组件里如何组合：

```js
const tasks = useTasksStore(state => state.tasks)
const addTask = useTasksStore(state => state.addTask)
const user = useUserStore(state => state.user)
```

* 强调：

  * 避免一个 store 管理所有状态
  * selector 精准订阅减少渲染

---

## ⏱ 12:00–16:00｜跨 store 通信

* 问题：tasksStore 需要依赖 userStore 信息
* 正确做法：

```js
const addUserTask = (task) => {
  const user = useUserStore.getState().user
  useTasksStore.getState().addTask({ ...task, userId: user.id })
}
```

* 说明 getState 用法 vs selector

---

## ⏱ 16:00–20:00｜异步 action 模块化

* 每个 store 独立处理异步

```js
const fetchTasks = async () => {
  const data = await fetch('/tasks').then(r => r.json())
  set({ tasks: data })
}
```

* 演示 tasksStore.fetchTasks()
* 强调：模块化异步让代码更可测试

---

## ⏱ 20:00–26:00｜Demo 演示

* 组件使用多个 store
* 添加任务 → 只更新 tasks 组件
* 改用户 → 只更新 user 组件
* 强调可维护性 + 性能提升

---

## ⏱ 26:00–28:00｜总结 + 下集预告

> 今天我们学了模块化 store 和跨 store 通信。
> 下集我将讲复杂业务场景下的 Zustand：异步、表单、跨模块状态管理。

---
