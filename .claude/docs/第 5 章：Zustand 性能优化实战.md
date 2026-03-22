# 第 5 章：Zustand 性能优化实战

## 概述
随着应用规模增长，状态管理的性能变得至关重要。本章将深入探讨Zustand的性能优化技巧，包括选择器优化、状态分割、持久化策略等实战方法。

## 学习目标
- 理解Zustand的渲染机制和性能特性
- 掌握选择器优化的各种技巧
- 学习状态分割和懒加载策略
- 了解持久化性能优化
- 掌握性能监控和调试方法

## Zustand渲染机制

### 基本渲染原理
Zustand使用订阅-发布模式，只有订阅的状态发生变化时，组件才会重新渲染。关键点：
1. **精确更新**：组件只订阅它需要的状态片段
2. **浅比较**：默认使用严格相等（`===`）比较
3. **批量更新**：在React事件处理函数中自动批量更新

### 性能问题常见原因
1. **过度订阅**：组件订阅了不需要的状态
2. **不必要的对象创建**：每次渲染创建新对象/数组
3. **复杂选择器计算**：昂贵计算在每次渲染时重复执行
4. **大状态对象**：更新小部分状态导致大对象重渲染

## 选择器优化技巧

### 基础选择器使用
```typescript
// 性能差：直接解构整个store
function UserProfile() {
  const { user, settings, preferences, history } = useUserStore() // 任何变化都会重渲染

  return <div>{user.name}</div>
}

// 性能好：使用选择器只订阅需要的数据
function UserProfile() {
  const user = useUserStore((state) => state.user) // 只有user变化时重渲染

  return <div>{user.name}</div>
}
```

### 选择器组合优化
```typescript
// 方法1：分别订阅多个字段
function UserProfile() {
  const name = useUserStore((state) => state.user.name)
  const avatar = useUserStore((state) => state.user.avatar)
  const email = useUserStore((state) => state.user.email)

  // 问题：user.name变化会导致所有三个选择器重新计算
  return (
    <div>
      <img src={avatar} alt={name} />
      <h1>{name}</h1>
      <p>{email}</p>
    </div>
  )
}

// 方法2：组合选择器（更好）
function UserProfile() {
  const { name, avatar, email } = useUserStore((state) => ({
    name: state.user.name,
    avatar: state.user.avatar,
    email: state.user.email,
  }))

  // 当user的任何属性变化时都会重渲染，但只计算一次选择器
  return (
    <div>
      <img src={avatar} alt={name} />
      <h1>{name}</h1>
      <p>{email}</p>
    </div>
  )
}

// 方法3：使用useShallow避免不必要的重渲染
import { useShallow } from 'zustand/react/shallow'

function UserProfile() {
  const { name, avatar, email } = useUserStore(
    useShallow((state) => ({
      name: state.user.name,
      avatar: state.user.avatar,
      email: state.user.email,
    }))
  )

  // 只有当name、avatar、email中至少一个发生变化时才重渲染
  return (
    <div>
      <img src={avatar} alt={name} />
      <h1>{name}</h1>
      <p>{email}</p>
    </div>
  )
}
```

### 记忆化选择器
```typescript
import { createSelector } from 'reselect'
import { shallow } from 'zustand/shallow'

// 使用reselect创建记忆化选择器
const selectFilteredProducts = createSelector(
  [
    (state: ProductState) => state.products,
    (state: ProductState) => state.selectedCategory,
    (state: ProductState) => state.searchQuery,
  ],
  (products, selectedCategory, searchQuery) => {
    // 昂贵的计算：只在输入变化时重新计算
    return products
      .filter((p) => !selectedCategory || p.categoryId === selectedCategory)
      .filter((p) => !searchQuery || p.name.includes(searchQuery))
      .sort((a, b) => a.price - b.price)
  }
)

// 在组件中使用
function ProductList() {
  const filteredProducts = useProductStore(selectFilteredProducts, shallow)

  return filteredProducts.map(/* ... */)
}
```

## 状态结构优化

### 扁平化状态结构
```typescript
// 不推荐：嵌套过深
interface NestedState {
  user: {
    profile: {
      personal: {
        name: string
        age: number
      }
      contact: {
        email: string
        phone: string
      }
    }
  }
}

// 推荐：扁平化结构
interface FlatState {
  userName: string
  userAge: number
  userEmail: string
  userPhone: string
}

// 或者合理分组
interface OptimizedState {
  user: {
    name: string
    age: number
    email: string
    phone: string
  }
}
```

### 状态分割策略
```typescript
// 不推荐：所有状态放在一个store中
const useMonolithicStore = create(() => ({
  // 用户相关
  user: null,
  // 商品相关
  products: [],
  // 购物车相关
  cart: [],
  // 订单相关
  orders: [],
  // 设置相关
  settings: {},
}))

// 推荐：按业务域分割
const useUserStore = create(() => ({ user: null }))
const useProductStore = create(() => ({ products: [] }))
const useCartStore = create(() => ({ cart: [] }))
const useOrderStore = create(() => ({ orders: [] }))
const useSettingsStore = create(() => ({ settings: {} }))
```

### 懒加载状态
```typescript
// 使用getInitialState函数延迟初始化
const useLazyStore = create(() => {
  // 初始状态可以是函数，延迟执行
  const initialState = () => ({
    largeData: null,
    metadata: {},
    // ...其他可能昂贵的初始化
  })

  return {
    ...initialState(),
    loadData: async () => {
      const data = await fetchExpensiveData()
      set({ largeData: data })
    },
  }
})

// 或者按需加载模块
const useDynamicStore = create(() => ({
  modules: new Map(),

  loadModule: async (moduleName) => {
    if (this.modules.has(moduleName)) return

    const module = await import(`./modules/${moduleName}`)
    this.modules.set(moduleName, module.default)

    set((state) => ({
      modules: new Map(state.modules).set(moduleName, module.default),
    }))
  },
}))
```

## 持久化性能优化

### 选择性持久化
```typescript
import { persist, createJSONStorage } from 'zustand/middleware'

// 不推荐：持久化整个store
const useStore = create(
  persist(
    () => ({
      user: { /* 大量用户数据 */ },
      products: [ /* 大量商品数据 */ ],
      cart: [ /* 购物车数据 */ ],
      uiState: { /* UI状态，不需要持久化 */ },
    }),
    {
      name: 'app-storage',
    }
  )
)

// 推荐：只持久化必要数据
const usePersistedStore = create(
  persist(
    () => ({
      // 需要持久化的数据
      authToken: null,
      userPreferences: {},

      // 不需要持久化的数据
      temporaryData: null,
      uiState: {},
    }),
    {
      name: 'app-storage',
      // 只持久化指定字段
      partialize: (state) => ({
        authToken: state.authToken,
        userPreferences: state.userPreferences,
      }),
    }
  )
)
```

### 存储引擎选择
```typescript
// 根据数据量选择存储引擎
const createOptimizedStore = (storeName: string, config: any) => {
  // 小数据量使用localStorage
  if (config.estimatedSize < 5 * 1024 * 1024) { // 5MB
    return create(
      persist(config.store, {
        name: storeName,
        storage: createJSONStorage(() => localStorage),
      })
    )
  }

  // 大数据量使用indexedDB
  return create(
    persist(config.store, {
      name: storeName,
      storage: {
        getItem: async (name) => {
          // indexedDB实现
          return await idb.get(name)
        },
        setItem: async (name, value) => {
          await idb.set(name, value)
        },
        removeItem: async (name) => {
          await idb.delete(name)
        },
      },
    })
  )
}
```

## 批量更新优化

### 手动批量更新
```typescript
const useStore = create((set) => ({
  count: 0,
  text: '',
  loading: false,

  // 多个状态更新导致多次渲染
  updateSeparately: () => {
    set({ loading: true })
    set({ count: 10 })
    set({ text: 'updated' })
    set({ loading: false })
    // 导致4次渲染
  },

  // 批量更新，只渲染一次
  updateBatch: () => {
    set({
      loading: true,
      count: 10,
      text: 'updated',
    })
    // 延迟设置loading为false
    setTimeout(() => {
      set({ loading: false })
    }, 0)
  },

  // 使用函数形式批量更新
  updateWithFunction: () => {
    set((state) => ({
      loading: true,
      count: state.count + 1,
      text: 'updated',
    }))
  },
}))
```

### 防抖和节流
```typescript
import { throttle, debounce } from 'lodash-es'

const useStore = create((set) => ({
  searchQuery: '',
  searchResults: [],

  // 节流搜索，避免频繁更新
  throttledSearch: throttle(async (query) => {
    set({ searchQuery: query })
    const results = await api.search(query)
    set({ searchResults: results })
  }, 300),

  // 防抖搜索，等待用户停止输入
  debouncedSearch: debounce(async (query) => {
    set({ searchQuery: query })
    const results = await api.search(query)
    set({ searchResults: results })
  }, 500),
}))
```

## 性能监控和调试

### 渲染性能监控
```typescript
// 自定义hook监控组件渲染
const useRenderCounter = (componentName: string) => {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current++
    console.log(`${componentName} 渲染次数: ${renderCount.current}`)
  })
}

// 在组件中使用
function UserProfile() {
  useRenderCounter('UserProfile')
  const user = useUserStore((state) => state.user)

  return <div>{user.name}</div>
}
```

### 选择器性能分析
```typescript
// 带性能监控的选择器
const createProfiledSelector = <T, R>(selectorName: string, selector: (state: T) => R) => {
  return (state: T): R => {
    const start = performance.now()
    const result = selector(state)
    const end = performance.now()

    if (end - start > 16) { // 超过一帧时间（60fps）
      console.warn(`选择器 "${selectorName}" 执行时间过长: ${end - start}ms`)
    }

    return result
  }
}

// 使用
const selectExpensiveData = createProfiledSelector(
  'expensiveData',
  (state) => computeExpensiveData(state)
)
```

### React DevTools集成
```typescript
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'CounterStore',
      enabled: process.env.NODE_ENV === 'development',
      // 记录状态变化历史
      trace: true,
    }
  )
)
```

## 实战优化示例

### 大型列表性能优化
```typescript
interface LargeListState {
  items: Item[]
  visibleItems: Item[]
  visibleRange: [number, number]
  virtualizationEnabled: boolean

  // 虚拟滚动优化
  setVisibleRange: (start: number, end: number) => void
  // 分页加载
  loadPage: (page: number) => Promise<void>
  // 搜索过滤
  filterItems: (query: string) => void
}

const useLargeListStore = create<LargeListState>((set, get) => ({
  items: [],
  visibleItems: [],
  visibleRange: [0, 50],
  virtualizationEnabled: true,

  setVisibleRange: (start, end) => {
    const { items } = get()
    set({
      visibleRange: [start, end],
      visibleItems: items.slice(start, end),
    })
  },

  loadPage: async (page) => {
    const pageSize = 100
    const newItems = await api.loadItems(page, pageSize)

    set((state) => ({
      items: [...state.items, ...newItems],
    }))
  },

  filterItems: (query) => {
    const { items } = get()
    // 使用Web Worker进行昂贵过滤操作
    filterWorker.postMessage({ items, query })

    filterWorker.onmessage = (event) => {
      set({ items: event.data.filteredItems })
    }
  },
}))
```

## 本章案例设计

### 案例：大型数据表格性能优化
我们将实现一个大型数据表格，展示以下优化技巧：
1. **虚拟滚动**：只渲染可见区域的行
2. **记忆化选择器**：避免重复计算
3. **分页加载**：按需加载数据
4. **批量更新**：减少渲染次数
5. **性能监控**：实时监控渲染性能

### 技术要点
- 使用react-window实现虚拟滚动
- reselect记忆化选择器
- 防抖搜索和过滤
- React Profiler性能分析

## 总结
Zustand提供了丰富的性能优化手段，从简单的选择器使用到复杂的架构设计。通过合理的优化策略，可以确保即使在大型应用中也能保持良好的性能表现。

---

**下一章**：我们将通过实战案例，学习如何使用Zustand重构一个混乱的React项目。
