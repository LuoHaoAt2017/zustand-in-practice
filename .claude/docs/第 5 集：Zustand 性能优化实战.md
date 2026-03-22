# 🎬 第 5 集：Zustand 性能优化实战

**时长**：30–35 分钟
**Demo**：大型 Todo + 用户偏好 + filter + 性能监测

---

## ⏱ 00:00–01:00｜开场钩子

> 到中型项目，性能问题开始出现。
> 今天我们用 selector、subscribe 和最佳实践来优化 Zustand。

---

## ⏱ 01:00–06:00｜性能问题演示

* 使用全局 selector → 全局重渲染
* 演示 console.log 频繁打印组件渲染

---

## ⏱ 06:00–12:00｜selector 优化

* 单独 selector：

```js
const tasks = useTasksStore(state => state.tasks)
const count = useTasksStore(state => state.tasks.length)
```

* 强调只渲染依赖 state 的组件

---

## ⏱ 12:00–18:00｜subscribe 优化

* 订阅状态变化：

```js
useTasksStore.subscribe(
  tasks => console.log('tasks changed', tasks)
)
```

* 演示如何在非组件中响应状态变化

---

## ⏱ 18:00–28:00｜Demo 性能优化

* 大型任务列表（1000+ 条）
* 演示优化前后渲染次数差异
* 强调中级 → 高级前端思维

---

## ⏱ 28:00–35:00｜总结 + 下集预告

> 今天我们优化了性能，掌握 selector 和 subscribe。
> 下集是本系列收官：完整项目重构实战。

---