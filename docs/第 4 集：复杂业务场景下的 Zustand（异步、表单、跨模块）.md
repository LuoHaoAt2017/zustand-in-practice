# 🎬 第 4 集：复杂业务场景下的 Zustand（异步、表单、跨模块）

**时长**：35–40 分钟
**Demo**：Todo + 用户表单 + 异步加载数据

---

## ⏱ 00:00–01:00｜开场钩子

> 如果你在中型项目里使用 Zustand，单 store 可以搞定简单场景，但复杂业务时很容易踩坑。
> 今天，我演示 **异步、表单、跨模块状态**如何管理。

---

## ⏱ 01:00–06:00｜复杂表单场景

* 用户信息表单 + 验证
* 状态需要同时更新 tasksStore
* 演示代码：

```js
const handleSubmit = (values) => {
  useUserStore.getState().setUser(values)
  useTasksStore.getState().addTask({ text: 'Welcome task', userId: values.id })
}
```

---

## ⏱ 06:00–12:00｜异步状态管理

* fetch / update / delete tasks
* store 内封装 async action
* 代码示例：

```js
fetchTasks: async () => {
  const data = await fetch('/tasks').then(r => r.json())
  set({ tasks: data })
}
```

* 演示调用：

```js
useTasksStore.getState().fetchTasks()
```

---

## ⏱ 12:00–18:00｜跨模块依赖

* 用户变化 → tasks 更新
* 代码：

```js
const unsubscribe = useUserStore.subscribe(
  user => {
    if(user) useTasksStore.getState().fetchTasks()
  }
)
```

* 强调：订阅方式 vs selector

---

## ⏱ 18:00–28:00｜复杂 Demo 演示

* 用户表单 → 自动生成任务 → tasks 列表更新
* 异步数据加载 → UI 渲染
* 展示多个组件只渲染必要部分

---

## ⏱ 28:00–35:00｜总结 + 下集预告

> 今天我们完整演示了复杂业务场景。
> 下集我将讲性能优化：selector、subscribe、避免不必要渲染。

---