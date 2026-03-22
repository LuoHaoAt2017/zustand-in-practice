import React, { useState } from 'react'
import { create } from 'zustand'
import './App.css'

// Context API 示例
const ThemeContext = React.createContext({
  theme: 'light',
  toggleTheme: () => {},
})

// Zustand store 示例
interface ZustandStore {
  count: number
  user: string | null
  increment: () => void
  decrement: () => void
  login: (username: string) => void
  logout: () => void
}

const useZustandStore = create<ZustandStore>((set) => ({
  count: 0,
  user: null,
  increment: () => set((state: ZustandStore) => ({ count: state.count + 1 })),
  decrement: () => set((state: ZustandStore) => ({ count: state.count - 1 })),
  login: (username) => set({ user: username }),
  logout: () => set({ user: null }),
}))

function App() {
  const [contextTheme, setContextTheme] = useState('light')
  const { count, user, increment, decrement, login, logout } = useZustandStore()

  const toggleContextTheme = () => {
    setContextTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogin = () => {
    const username = prompt('请输入用户名') || 'Guest'
    login(username)
  }

  return (
    <div className="chapter-1-app">
      <header className="app-header">
        <h1>第1章：为什么我在中型项目中选择 Zustand</h1>
        <p>对比Zustand与Redux、Context API的优缺点</p>
      </header>

      <div className="comparison-grid">
        {/* Context API 示例 */}
        <div className="comparison-card">
          <h2>Context API</h2>
          <div className="card-content">
            <p>当前主题: <strong>{contextTheme}</strong></p>
            <button onClick={toggleContextTheme} className="demo-button">
              切换主题
            </button>
            <div className="pros-cons">
              <h4>优点</h4>
              <ul>
                <li>React内置，无需额外依赖</li>
                <li>适合主题、用户信息等低频变化数据</li>
                <li>简单易用</li>
              </ul>
              <h4>缺点</h4>
              <ul>
                <li>容易导致不必要的重渲染</li>
                <li>不适合高频变化的状态</li>
                <li>多个Context嵌套复杂</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Zustand 示例 */}
        <div className="comparison-card highlight">
          <h2>Zustand</h2>
          <div className="card-content">
            <p>计数器: <strong>{count}</strong></p>
            <p>用户: <strong>{user || '未登录'}</strong></p>
            <div className="button-group">
              <button onClick={increment} className="demo-button">+</button>
              <button onClick={decrement} className="demo-button">-</button>
              {user ? (
                <button onClick={logout} className="demo-button secondary">登出</button>
              ) : (
                <button onClick={handleLogin} className="demo-button primary">登录</button>
              )}
            </div>
            <div className="pros-cons">
              <h4>优点</h4>
              <ul>
                <li>极简API，学习成本低</li>
                <li>包体积极小（~1.5KB）</li>
                <li>优秀的TypeScript支持</li>
                <li>精确更新，避免不必要的重渲染</li>
                <li>内置DevTools集成</li>
                <li>中间件生态丰富</li>
              </ul>
              <h4>缺点</h4>
              <ul>
                <li>相对较新，社区规模不如Redux</li>
                <li>超大型项目可能需要更严格的架构约束</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="summary">
        <h3>总结</h3>
        <p>
          Zustand在中小型项目中提供了最佳平衡：它保留了Redux的不可变更新和DevTools支持，
          同时大大简化了API和TypeScript配置。对于大多数React项目，Zustand都是值得推荐的选择。
        </p>
        <div className="recommendation">
          <strong>推荐使用场景：</strong>
          <ul>
            <li>中小型项目快速启动</li>
            <li>团队新人较多，需要降低学习成本</li>
            <li>TypeScript项目，需要优秀的类型支持</li>
            <li>需要快速原型开发</li>
            <li>性能敏感应用，需要避免不必要的重渲染</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App