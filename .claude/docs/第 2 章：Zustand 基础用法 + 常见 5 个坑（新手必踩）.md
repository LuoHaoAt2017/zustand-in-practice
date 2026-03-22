# 第 2 章：Zustand 基础用法 + 常见 5 个坑（新手必踩）

## 概述
本章将介绍Zustand的基础用法，包括创建store、使用状态、更新状态等核心API。同时，我们会深入分析新手常见的5个坑，帮助大家避免这些常见错误。

## 学习目标
- 掌握Zustand的基本API使用
- 理解create、set、get函数的作用
- 学会使用选择器优化性能
- 避免5个常见的错误用法

## 基础用法

### 1. 创建store
```typescript
import { create } from 'zustand'

// 基础store
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// 带有get函数的store
const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: () => !!get().token,
  login: (userData, authToken) => set({ user: userData, token: authToken }),
  logout: () => set({ user: null, token: null }),
}))
```

### 2. 使用store
```typescript
// 组件中使用
function Counter() {
  const { count, increment, decrement } = useCounterStore()

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}

// 使用选择器优化（避免不必要的重渲染）
function CountDisplay() {
  const count = useCounterStore((state) => state.count)

  return <h1>Count: {count}</h1>
}
```

### 3. 异步操作
```typescript
const useTodoStore = create((set) => ({
  todos: [],
  loading: false,
  error: null,

  fetchTodos: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/todos')
      const todos = await response.json()
      set({ todos, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  addTodo: async (title) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      const newTodo = await response.json()
      set((state) => ({ todos: [...state.todos, newTodo] }))
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  },
}))
```

### 4. 中间件使用
```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const useStore = create(
  devtools(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: 'counter-storage' }
    )
  )
)
```

## 常见5个坑

### 坑1：直接在组件中解构导致重渲染
**错误示例**：
```typescript
function UserProfile() {
  // 错误：直接解构整个store，任何状态变化都会导致重渲染
  const { user, posts, comments, settings } = useUserStore()

  return (
    <div>
      <h1>{user.name}</h1>
      {/* 只有user变化时需要更新，但posts等变化也会导致重渲染 */}
    </div>
  )
}
```

**正确做法**：
```typescript
function UserProfile() {
  // 正确：使用选择器只订阅需要的数据
  const user = useUserStore((state) => state.user)
  // 或者使用多个选择器
  const { user, posts } = useUserStore((state) => ({
    user: state.user,
    posts: state.posts,
  }))

  return <h1>{user.name}</h1>
}
```

### 坑2：在set函数中直接修改原状态
**错误示例**：
```typescript
const useStore = create((set) => ({
  items: [],
  addItem: (item) => {
    set((state) => {
      state.items.push(item) // 错误：直接修改原状态
      return state
    })
  },
}))
```

**正确做法**：
```typescript
const useStore = create((set) => ({
  items: [],
  addItem: (item) => {
    set((state) => ({
      items: [...state.items, item], // 正确：返回新对象
    }))
  },
}))

// 或者使用immer中间件
import { immer } from 'zustand/middleware/immer'

const useStore = create(
  immer((set) => ({
    items: [],
    addItem: (item) => {
      set((state) => {
        state.items.push(item) // 使用immer时可以直接修改
      })
    },
  }))
)
```

### 坑3：忘记处理异步错误
**错误示例**：
```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,

  fetchData: async () => {
    set({ loading: true })
    const response = await fetch('/api/data') // 可能失败但没处理错误
    const data = await response.json()
    set({ data, loading: false })
  },
}))
```

**正确做法**：
```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Network response was not ok')
      const data = await response.json()
      set({ data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
}))
```

### 坑4：无限更新循环
**错误示例**：
```typescript
const useStore = create((set, get) => ({
  count: 0,

  // 错误：在set回调中调用自身会导致无限循环
  increment: () => {
    set((state) => {
      if (state.count < 10) {
        get().increment() // 这里会再次调用increment，导致循环
      }
      return { count: state.count + 1 }
    })
  },
}))
```

**正确做法**：
```typescript
const useStore = create((set) => ({
  count: 0,

  // 正确：使用条件判断而不是递归调用
  increment: () => {
    set((state) => {
      if (state.count < 10) {
        return { count: state.count + 1 }
      }
      return state
    })
  },

  // 或者使用循环递增
  incrementToTen: () => {
    set((state) => {
      let newCount = state.count
      while (newCount < 10) {
        newCount++
      }
      return { count: newCount }
    })
  },
}))
```

### 坑5：类型定义不完整
**错误示例**：
```typescript
// 错误：没有正确定义类型
const useStore = create((set) => ({
  user: null, // 类型被推断为any或null
  setUser: (user) => set({ user }), // user参数类型为any
}))
```

**正确做法**：
```typescript
interface User {
  id: string
  name: string
  email: string
}

interface Store {
  user: User | null
  setUser: (user: User | null) => void
}

const useStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

## 本章案例设计

### 案例：计数器应用 + 错误演示
我们将创建一个计数器应用，同时展示上述5个坑的错误版本和正确版本：
1. **基础计数器**：展示正确用法
2. **错误演示1**：直接解构导致重渲染
3. **错误演示2**：直接修改原状态
4. **错误演示3**：异步错误未处理
5. **错误演示4**：无限循环
6. **错误演示5**：类型不安全

### 技术要点
- 使用React DevTools观察重渲染
- 使用TypeScript展示类型安全
- 控制台错误日志展示

## 总结
掌握Zustand的基础用法是高效使用该库的关键。通过避免这5个常见坑，可以显著提高代码质量和应用性能。

---

**下一章**：我们将学习如何在中型项目中设计模块化的Zustand store。
