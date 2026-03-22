import React, { useState, useEffect } from 'react'
import { create } from 'zustand'
import './App.css'

// ========== Store 类型定义 ==========

// 基础计数器store
interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

// 坑1 store
interface Pitfall1Store {
  count: number
  unrelated: number
  incrementCount: () => void
  incrementUnrelated: () => void
}

// 坑2 store
interface Pitfall2Store {
  items: number[]
  addItem: (item: number) => void
}

// 坑3 store
interface Pitfall3Store {
  data: string | null
  loading: boolean
  error?: string | null
  fetchData: (shouldFail?: boolean) => Promise<void>
}

// 坑4 store
interface Pitfall4Store {
  count: number
  increment: () => void
  reset: () => void
}

// 坑5 store
interface User {
  id: string
  name: string
  email: string
}

interface Pitfall5Store {
  user: User | null
  setUser: (user: User | null) => void
}

// ========== Store 实现 ==========

// 基础计数器store - 正确示例
const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state: CounterStore) => ({ count: state.count + 1 })),
  decrement: () => set((state: CounterStore) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// 坑1：直接在组件中解构导致重渲染
const usePitfall1BadStore = create<Pitfall1Store>((set) => ({
  count: 0,
  unrelated: 0,
  incrementCount: () => set((state: Pitfall1Store) => ({ count: state.count + 1 })),
  incrementUnrelated: () => set((state: Pitfall1Store) => ({ unrelated: state.unrelated + 1 })),
}))

const usePitfall1GoodStore = create<Pitfall1Store>((set) => ({
  count: 0,
  unrelated: 0,
  incrementCount: () => set((state: Pitfall1Store) => ({ count: state.count + 1 })),
  incrementUnrelated: () => set((state: Pitfall1Store) => ({ unrelated: state.unrelated + 1 })),
}))

// 坑2：直接修改原状态
const usePitfall2BadStore = create<Pitfall2Store>((set) => ({
  items: [1, 2, 3],
  addItem: (item: number) => {
    set((state: Pitfall2Store) => {
      // @ts-ignore - 故意错误：直接修改原状态
      state.items.push(item)
      return state
    })
  },
}))

const usePitfall2GoodStore = create<Pitfall2Store>((set) => ({
  items: [1, 2, 3],
  addItem: (item: number) => {
    set((state: Pitfall2Store) => ({
      items: [...state.items, item], // 正确：返回新对象
    }))
  },
}))

// 坑3：忘记处理异步错误
const usePitfall3BadStore = create<Omit<Pitfall3Store, 'error'>>((set) => ({
  data: null,
  loading: false,
  fetchData: async (shouldFail = false) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 500))

    if (shouldFail) {
      // 错误：没有处理错误
      throw new Error('模拟API错误')
    }

    const data = '成功获取的数据'
    set({ data, loading: false })
  },
}))

const usePitfall3GoodStore = create<Pitfall3Store>((set) => ({
  data: null,
  loading: false,
  error: null,
  fetchData: async (shouldFail = false) => {
    set({ loading: true, error: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      if (shouldFail) {
        throw new Error('模拟API错误')
      }

      const data = '成功获取的数据'
      set({ data, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
}))

// 坑4：无限更新循环
const usePitfall4BadStore = create<Pitfall4Store>((set, get) => ({
  count: 0,
  increment: () => {
    set((state: Pitfall4Store) => {
      if (state.count < 3) { // 限制为3次以避免浏览器卡死
        get().increment() // 错误：递归调用
      }
      return { count: state.count + 1 }
    })
  },
  reset: () => set({ count: 0 }),
}))

const usePitfall4GoodStore = create<Pitfall4Store>((set) => ({
  count: 0,
  increment: () => {
    set((state: Pitfall4Store) => {
      if (state.count < 10) {
        return { count: state.count + 1 }
      }
      return state
    })
  },
  reset: () => set({ count: 0 }),
}))

// 坑5：类型定义不完整
const usePitfall5BadStore = create<any>((set: any) => ({
  user: null,
  setUser: (user: any) => set({ user }),
}))

const usePitfall5GoodStore = create<Pitfall5Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

const sections = [
  { id: 'basic', title: '基础用法', description: 'Zustand基本API使用' },
  { id: 'pitfall1', title: '坑1：直接解构导致重渲染', description: '错误解构 vs 使用选择器' },
  { id: 'pitfall2', title: '坑2：直接修改原状态', description: '修改原状态 vs 返回新对象' },
  { id: 'pitfall3', title: '坑3：忘记处理异步错误', description: '无错误处理 vs 完整错误处理' },
  { id: 'pitfall4', title: '坑4：无限更新循环', description: '递归调用 vs 条件判断' },
  { id: 'pitfall5', title: '坑5：类型定义不完整', description: '类型不安全 vs 类型安全' },
]

function App() {
  const [activeSection, setActiveSection] = useState('basic')
  const [renderCountBad, setRenderCountBad] = useState(0)
  const [renderCountGood, setRenderCountGood] = useState(0)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  // 捕获控制台错误
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
      setConsoleLogs(prev => [...prev.slice(-4), `❌ ${message}`])
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  const addConsoleLog = (message: string) => {
    setConsoleLogs(prev => [...prev.slice(-4), `📝 ${message}`])
  }

  const renderBasicUsage = () => (
    <div className="demo-section">
      <h3>基础计数器示例</h3>
      <div className="demo-grid">
        <div className="demo-card">
          <h4>使用store</h4>
          <CounterDemo />
        </div>
        <div className="demo-card">
          <h4>使用选择器优化</h4>
          <CounterDisplay />
        </div>
      </div>
      <div className="code-comparison">
        <div className="code-block">
          <h5>store定义</h5>
          <pre>{`const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))`}</pre>
        </div>
        <div className="code-block">
          <h5>组件使用</h5>
          <pre>{`// 使用整个store
const { count, increment } = useCounterStore()

// 使用选择器（推荐）
const count = useCounterStore((state) => state.count)`}</pre>
        </div>
      </div>
    </div>
  )

  const renderPitfall1 = () => {
    const BadComponent = () => {
      useEffect(() => {
        setRenderCountBad(prev => prev + 1)
      })

      const { count, unrelated, incrementCount, incrementUnrelated } = usePitfall1BadStore()

      return (
        <div className="demo-component">
          <p>组件渲染次数: {renderCountBad}</p>
          <p>count: {count}</p>
          <p>unrelated: {unrelated}</p>
          <div className="button-group">
            <button onClick={incrementCount}>增加count</button>
            <button onClick={incrementUnrelated}>增加unrelated</button>
          </div>
          <p className="warning">⚠️ 问题：unrelated变化也会导致此组件重渲染</p>
        </div>
      )
    }

    const GoodComponent = () => {
      useEffect(() => {
        setRenderCountGood(prev => prev + 1)
      })

      const count = usePitfall1GoodStore((state: Pitfall1Store) => state.count)
      const incrementCount = usePitfall1GoodStore((state: Pitfall1Store) => state.incrementCount)
      const incrementUnrelated = usePitfall1GoodStore((state: Pitfall1Store) => state.incrementUnrelated)

      return (
        <div className="demo-component">
          <p>组件渲染次数: {renderCountGood}</p>
          <p>count: {count}</p>
          <p>unrelated: 不会在此显示</p>
          <div className="button-group">
            <button onClick={incrementCount}>增加count</button>
            <button onClick={incrementUnrelated}>增加unrelated</button>
          </div>
          <p className="success">✅ 优化：只有count变化才会导致重渲染</p>
        </div>
      )
    }

    return (
      <div className="demo-section">
        <h3>直接解构导致不必要的重渲染</h3>
        <div className="demo-grid">
          <div className="demo-card error">
            <h4>❌ 错误示例</h4>
            <BadComponent />
          </div>
          <div className="demo-card success">
            <h4>✅ 正确做法</h4>
            <GoodComponent />
          </div>
        </div>
        <div className="code-comparison">
          <div className="code-block">
            <h5>错误代码</h5>
            <pre>{`function UserProfile() {
  // 直接解构整个store
  const { user, posts, comments } = useUserStore()
  // 任何状态变化都会导致重渲染
  return <h1>{user.name}</h1>
}`}</pre>
          </div>
          <div className="code-block">
            <h5>正确代码</h5>
            <pre>{`function UserProfile() {
  // 使用选择器只订阅需要的数据
  const user = useUserStore((state) => state.user)
  // 只有user变化时才会重渲染
  return <h1>{user.name}</h1>
}`}</pre>
          </div>
        </div>
      </div>
    )
  }

  const renderPitfall2 = () => {
    const BadComponent = () => {
      const { items, addItem } = usePitfall2BadStore()

      const handleAdd = () => {
        addItem(items.length + 1)
        addConsoleLog('添加了item，但状态可能没有正确更新')
      }

      return (
        <div className="demo-component">
          <p>items: [{items.join(', ')}]</p>
          <button onClick={handleAdd}>添加item</button>
          <p className="warning">⚠️ 问题：直接修改原状态，可能导致意外行为</p>
        </div>
      )
    }

    const GoodComponent = () => {
      const { items, addItem } = usePitfall2GoodStore()

      const handleAdd = () => {
        addItem(items.length + 1)
        addConsoleLog('添加了item，状态正确更新')
      }

      return (
        <div className="demo-component">
          <p>items: [{items.join(', ')}]</p>
          <button onClick={handleAdd}>添加item</button>
          <p className="success">✅ 正确：返回新对象，状态更新正确</p>
        </div>
      )
    }

    return (
      <div className="demo-section">
        <h3>直接修改原状态</h3>
        <div className="demo-grid">
          <div className="demo-card error">
            <h4>❌ 错误示例</h4>
            <BadComponent />
          </div>
          <div className="demo-card success">
            <h4>✅ 正确做法</h4>
            <GoodComponent />
          </div>
        </div>
        <div className="code-comparison">
          <div className="code-block">
            <h5>错误代码</h5>
            <pre>{`addItem: (item) => {
  set((state) => {
    state.items.push(item) // 直接修改原状态
    return state
  })
}`}</pre>
          </div>
          <div className="code-block">
            <h5>正确代码</h5>
            <pre>{`addItem: (item) => {
  set((state) => ({
    items: [...state.items, item] // 返回新对象
  }))
}`}</pre>
          </div>
        </div>
      </div>
    )
  }

  const renderPitfall3 = () => {
    const BadComponent = () => {
      const { data, loading, fetchData } = usePitfall3BadStore()

      const handleFetch = async (shouldFail: boolean) => {
        try {
          await fetchData(shouldFail)
          addConsoleLog(shouldFail ? '请求失败但没有处理错误' : '请求成功')
        } catch (error) {
          addConsoleLog(`捕获到错误: ${error}`)
        }
      }

      return (
        <div className="demo-component">
          <p>数据: {data || '未加载'}</p>
          <p>加载中: {loading ? '是' : '否'}</p>
          <div className="button-group">
            <button onClick={() => handleFetch(false)} disabled={loading}>
              模拟成功请求
            </button>
            <button onClick={() => handleFetch(true)} disabled={loading}>
              模拟失败请求
            </button>
          </div>
          <p className="warning">⚠️ 问题：store中没有错误状态，错误会抛出到组件</p>
        </div>
      )
    }

    const GoodComponent = () => {
      const { data, loading, error, fetchData } = usePitfall3GoodStore()

      const handleFetch = async (shouldFail: boolean) => {
        await fetchData(shouldFail)
        addConsoleLog(shouldFail ? '请求失败，错误已处理' : '请求成功')
      }

      return (
        <div className="demo-component">
          <p>数据: {data || '未加载'}</p>
          <p>加载中: {loading ? '是' : '否'}</p>
          <p>错误: {error || '无'}</p>
          <div className="button-group">
            <button onClick={() => handleFetch(false)} disabled={loading}>
              模拟成功请求
            </button>
            <button onClick={() => handleFetch(true)} disabled={loading}>
              模拟失败请求
            </button>
          </div>
          <p className="success">✅ 正确：完整的错误处理，用户体验更好</p>
        </div>
      )
    }

    return (
      <div className="demo-section">
        <h3>忘记处理异步错误</h3>
        <div className="demo-grid">
          <div className="demo-card error">
            <h4>❌ 错误示例</h4>
            <BadComponent />
          </div>
          <div className="demo-card success">
            <h4>✅ 正确做法</h4>
            <GoodComponent />
          </div>
        </div>
        <div className="code-comparison">
          <div className="code-block">
            <h5>错误代码</h5>
            <pre>{`fetchData: async () => {
  set({ loading: true })
  const response = await fetch('/api/data')
  const data = await response.json() // 可能抛出错误
  set({ data, loading: false })
}`}</pre>
          </div>
          <div className="code-block">
            <h5>正确代码</h5>
            <pre>{`fetchData: async () => {
  set({ loading: true, error: null })
  try {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error('请求失败')
    const data = await response.json()
    set({ data, loading: false })
  } catch (error) {
    set({ error: error.message, loading: false })
  }
}`}</pre>
          </div>
        </div>
      </div>
    )
  }

  const renderPitfall4 = () => {
    const BadComponent = () => {
      const { count, increment, reset } = usePitfall4BadStore()

      const handleIncrement = () => {
        try {
          increment()
          addConsoleLog(`增加count: ${count} -> ${count + 1}`)
        } catch (error) {
          addConsoleLog(`错误: ${error}`)
        }
      }

      return (
        <div className="demo-component">
          <p>count: {count}</p>
          <div className="button-group">
            <button onClick={handleIncrement}>增加count</button>
            <button onClick={reset}>重置</button>
          </div>
          <p className="warning">⚠️ 问题：递归调用导致无限循环（已限制为3次）</p>
        </div>
      )
    }

    const GoodComponent = () => {
      const { count, increment, reset } = usePitfall4GoodStore()

      const handleIncrement = () => {
        increment()
        addConsoleLog(`安全增加count: ${count} -> ${Math.min(count + 1, 10)}`)
      }

      return (
        <div className="demo-component">
          <p>count: {count}</p>
          <div className="button-group">
            <button onClick={handleIncrement}>增加count</button>
            <button onClick={reset}>重置</button>
          </div>
          <p className="success">✅ 正确：使用条件判断，最多增加到10</p>
        </div>
      )
    }

    return (
      <div className="demo-section">
        <h3>无限更新循环</h3>
        <div className="demo-grid">
          <div className="demo-card error">
            <h4>❌ 错误示例</h4>
            <BadComponent />
          </div>
          <div className="demo-card success">
            <h4>✅ 正确做法</h4>
            <GoodComponent />
          </div>
        </div>
        <div className="code-comparison">
          <div className="code-block">
            <h5>错误代码</h5>
            <pre>{`increment: () => {
  set((state) => {
    if (state.count < 10) {
      get().increment() // 递归调用！
    }
    return { count: state.count + 1 }
  })
}`}</pre>
          </div>
          <div className="code-block">
            <h5>正确代码</h5>
            <pre>{`increment: () => {
  set((state) => {
    if (state.count < 10) {
      return { count: state.count + 1 }
    }
    return state
  })
}`}</pre>
          </div>
        </div>
      </div>
    )
  }

  const renderPitfall5 = () => {
    const BadComponent = () => {
      const { user, setUser } = usePitfall5BadStore()

      const handleSetUser = () => {
        // TypeScript不会报错，但类型不安全
        setUser({ id: '1', name: 'John' })
        addConsoleLog('设置了user，但类型不安全')
      }

      const handleSetInvalid = () => {
        // 可以设置任何类型
        setUser('invalid')
        addConsoleLog('设置了无效的user类型')
      }

      return (
        <div className="demo-component">
          <p>user: {JSON.stringify(user)}</p>
          <div className="button-group">
            <button onClick={handleSetUser}>设置有效user</button>
            <button onClick={handleSetInvalid}>设置无效user</button>
          </div>
          <p className="warning">⚠️ 问题：没有类型约束，可能导致运行时错误</p>
        </div>
      )
    }

    const GoodComponent = () => {
      const { user, setUser } = usePitfall5GoodStore()

      const handleSetUser = () => {
        setUser({ id: '1', name: 'John', email: 'john@example.com' })
        addConsoleLog('设置了类型安全的user')
      }

      const handleClear = () => {
        setUser(null)
        addConsoleLog('清除了user')
      }

      return (
        <div className="demo-component">
          <p>user: {JSON.stringify(user)}</p>
          <div className="button-group">
            <button onClick={handleSetUser}>设置user</button>
            <button onClick={handleClear}>清除user</button>
          </div>
          <p className="success">✅ 正确：完整的TypeScript类型定义</p>
        </div>
      )
    }

    return (
      <div className="demo-section">
        <h3>类型定义不完整</h3>
        <div className="demo-grid">
          <div className="demo-card error">
            <h4>❌ 错误示例</h4>
            <BadComponent />
          </div>
          <div className="demo-card success">
            <h4>✅ 正确做法</h4>
            <GoodComponent />
          </div>
        </div>
        <div className="code-comparison">
          <div className="code-block">
            <h5>错误代码</h5>
            <pre>{`const useStore = create((set) => ({
  user: null, // 类型为any或null
  setUser: (user) => set({ user }), // user为any
}))`}</pre>
          </div>
          <div className="code-block">
            <h5>正确代码</h5>
            <pre>{`interface User {
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
}))`}</pre>
          </div>
        </div>
      </div>
    )
  }

  // 基础计数器组件
  function CounterDemo() {
    const { count, increment, decrement, reset } = useCounterStore()

    return (
      <div className="counter">
        <h3>Count: {count}</h3>
        <div className="button-group">
          <button onClick={increment}>+</button>
          <button onClick={decrement}>-</button>
          <button onClick={reset}>重置</button>
        </div>
      </div>
    )
  }

  // 使用选择器的计数器显示组件
  function CounterDisplay() {
    const count = useCounterStore((state) => state.count)

    return (
      <div className="counter">
        <h3>Count: {count}</h3>
        <p>此组件只订阅count状态</p>
        <p>其他状态变化不会导致重渲染</p>
      </div>
    )
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'basic': return renderBasicUsage()
      case 'pitfall1': return renderPitfall1()
      case 'pitfall2': return renderPitfall2()
      case 'pitfall3': return renderPitfall3()
      case 'pitfall4': return renderPitfall4()
      case 'pitfall5': return renderPitfall5()
      default: return renderBasicUsage()
    }
  }

  return (
    <div className="chapter-2-app">
      <header className="app-header">
        <h1>第2章：Zustand 基础用法 + 常见 5 个坑（新手必踩）</h1>
        <p>通过实际演示学习如何正确使用Zustand，避免常见错误</p>
      </header>

      <div className="app-content">
        <nav className="section-nav">
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="nav-title">{section.title}</div>
                  <div className="nav-description">{section.description}</div>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="main-content">
          {renderActiveSection()}

          <div className="console-panel">
            <h4>控制台输出</h4>
            <div className="console-output">
              {consoleLogs.length === 0 ? (
                <p className="console-placeholder">操作示例查看输出...</p>
              ) : (
                consoleLogs.map((log, index) => (
                  <div key={index} className="console-line">{log}</div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="app-footer">
        <p><strong>学习要点：</strong> 掌握基础API，理解set/get函数，使用选择器优化性能，避免这5个常见错误</p>
      </footer>
    </div>
  )
}

export default App