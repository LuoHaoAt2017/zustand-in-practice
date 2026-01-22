# 🎬 第 2 集：Zustand 基础用法 + 常见 5 个坑（新手必踩）

**目标观众**：已经会 React 的中级前端
**时长**：25–28 分钟

## ⏱ 00:00 – 01:00｜开场钩子

> “上集我们聊了为什么在中型项目里选择 Zustand。
> 今天，我不讲理论，我直接带你用 **一个小项目**，从零到能用，同时告诉你 **5 个新手最容易踩的坑**。
> 看完，你就敢在自己的项目里上手了。”

📌 作用：

* 强烈承接上一集
* 告诉观众：本集动手 + 实战 + 价值点（坑）

---

## ⏱ 01:00 – 03:00｜引入 Demo 项目

**项目场景**：

* 一个小型 Todo 应用（任务列表 + 完成状态）
* 简单 UI，用 React + Tailwind

讲解：

* “这个例子小但足够演示状态管理思路”
* 列出 **3 个 state**：

  1. tasks = [{id, text, done}]
  2. filter = 'all'|'done'|'active'
  3. actions = addTask / toggleTask / removeTask

📌 注意不要一开始写代码，先讲概念

---

## ⏱ 03:00 – 07:00｜创建第一个 store

### 代码节奏

```js
import create from 'zustand'

const useStore = create(set => ({
  tasks: [],
  filter: 'all',
  addTask: (task) => set(state => ({ tasks: [...state.tasks, task] })),
  toggleTask: (id) => set(state => ({
    tasks: state.tasks.map(t => t.id === id ? {...t, done: !t.done} : t)
  })),
}))
```

讲解：

1. `create` 的作用
2. `set` 的用法
3. state 和 action 都在同一个 store
4. 代码展示如何在组件里用：

```js
const tasks = useStore(state => state.tasks)
const addTask = useStore(state => state.addTask)
```

📌 提醒观众：

* “这里我们只展示基础，后面会拆分 store”

---

## ⏱ 07:00 – 11:00｜坑 1：直接修改 state

**演示**：

```js
const toggleTaskWrong = (id) => {
  const task = useStore.getState().tasks.find(t => t.id === id)
  task.done = !task.done  // ❌ 错误做法
}
```

讲解：

* React 不会感知直接修改
* 造成组件不更新
* 正确方法用 `set` 创建新数组

---

## ⏱ 11:00 – 14:00｜坑 2：过度全局化

* 演示一个项目把 **所有 state** 都放在一个 store
* 问题：

  * 模块耦合
  * 不容易维护
* 提示：模块化 store 更易扩展

---

## ⏱ 14:00 – 16:00｜坑 3：selector 使用不当

**示例**：

```js
const taskCount = useStore(state => state.tasks.length)
```

* 正确：selector 提高性能
* 错误：直接 useStore(state => state) → 全局 render

📌 强调：中级前端必须理解 selector 与重渲染的关系

---

## ⏱ 16:00 – 18:00｜坑 4：异步 action 处理不当

**示例**：

```js
fetch('/tasks')
  .then(res => res.json())
  .then(data => useStore.getState().tasks = data) // ❌
```

* 正确：

```js
fetch('/tasks')
  .then(res => res.json())
  .then(data => useStore.setState({ tasks: data }))
```

* 提示：Zustand 支持 async action，推荐封装在 store 里

---

## ⏱ 18:00 – 20:00｜坑 5：useStore 调用方式混乱

* 多次 useStore(state => state.tasks) vs useStore()
* 建议：

  * **每个 selector 独立调用**
  * 避免组件订阅过多无关 state

---

## ⏱ 20:00 – 23:00｜整合小 Demo

* 展示一个 **完整小组件**
* tasks 列表 + toggle + filter
* 让观众看到：

  * store 正确使用
  * selector 提高性能
  * async action 正常工作

📌 用屏幕录制方式演示：用户点击 → state 更新 → UI 自动更新

---

## ⏱ 23:00 – 25:00｜总结 + 下集预告

> 今天我们学会了：
>
> 1. 如何创建 store
> 2. 正确使用 set / selector
> 3. 避开 5 个最常见坑
>
> 下集我会讲 **中型项目中 Zustand 的模块化设计实践**
> 并演示如何拆分 store，构建大型项目结构。

* 提醒观众：

  * 点击订阅 + 开启通知
  * 系列播放列表链接

---

## 🔑 录制小技巧

1. 每个“坑”录一遍动作
2. 代码切屏节奏：

   * 写代码 → 运行 → 演示 bug → 修复
3. 用箭头/高亮突出关键点
4. 保持节奏：每个核心内容 2–3 分钟

---

我已经把 **第 2 集逐分钟脚本 + 代码节奏 + Demo 设计** 都写完了，基本可以直接开录。

---

如果你愿意，我可以帮你**把第 3 集到第 6 集也拆成完整逐分钟脚本**，保证整个 6 集专题从头到尾都可以直接拍，观众看完就像上完“迷你课程”。

你希望我直接帮你拆吗？
