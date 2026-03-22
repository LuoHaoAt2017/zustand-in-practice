import React, { useState, useEffect } from 'react'
import { registerMicroApps, start, setDefaultMountApp } from 'qiankun'
import './App.css'

// 章节配置
const chapters = [
  { id: 'chapter-1', title: '第1章: 为什么选择Zustand' },
  { id: 'chapter-2', title: '第2章: 基础用法 + 常见坑' },
  { id: 'chapter-3', title: '第3章: 模块化设计实践' },
  { id: 'chapter-4', title: '第4章: 复杂业务场景' },
  { id: 'chapter-5', title: '第5章: 性能优化实战' },
  { id: 'chapter-6', title: '第6章: 实战重构' },
]

// 子应用配置（开发环境）
const isDev = import.meta.env.DEV
const getEntry = (appId: string) => {
  if (isDev) {
    // 开发环境使用本地服务
    return `//localhost:${getPort(appId)}`
  }
  // 生产环境使用构建后的文件
  return `/apps/${appId}/`
}

const getPort = (appId: string): number => {
  const portMap: Record<string, number> = {
    'chapter-1': 3001,
    'chapter-2': 3002,
    'chapter-3': 3003,
    'chapter-4': 3004,
    'chapter-5': 3005,
    'chapter-6': 3006,
  }
  return portMap[appId] || 3000
}

function App() {
  const [activeChapter, setActiveChapter] = useState('chapter-1')

  // 初始化qiankun
  useEffect(() => {
    const microApps = chapters.map((chapter) => ({
      name: chapter.id,
      entry: getEntry(chapter.id),
      container: '#subapp-container',
      activeRule: `/${chapter.id}`,
      props: {
        chapterId: chapter.id,
      },
    }))

    registerMicroApps(microApps)
    setDefaultMountApp('/chapter-1')
    start({
      sandbox: {
        experimentalStyleIsolation: true, // 使用实验性的样式隔离
      },
      excludeAssetFilter: (assetUrl: string) => {
        // 排除 react-refresh 相关的资源
        return assetUrl.includes('@react-refresh') || assetUrl.includes('@vite/client')
      },
    })

    // 监听路由变化
    const handleRouteChange = () => {
      const path = window.location.pathname
      const chapter = chapters.find(c => path.includes(c.id)) || chapters[0]
      setActiveChapter(chapter.id)
    }

    window.addEventListener('popstate', handleRouteChange)
    handleRouteChange() // 初始路由

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  const handleChapterClick = (chapterId: string) => {
    setActiveChapter(chapterId)
    window.history.pushState(null, '', `/${chapterId}`)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>《Zustand 状态管理：从能用到用好》</h1>
        <p>一个专注于zustand状态管理的案例学习网站</p>
      </header>

      <nav className="chapter-nav">
        <ul>
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <button
                className={`nav-button ${activeChapter === chapter.id ? 'active' : ''}`}
                onClick={() => handleChapterClick(chapter.id)}
              >
                {chapter.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="app-main">
        <div className="chapter-info">
          <h2>{chapters.find(c => c.id === activeChapter)?.title}</h2>
          <div className="subapp-container" id="subapp-container">
            {!isDev && (
              <div className="loading">
                <p>正在加载子应用...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2025 Zustand实践案例 · 使用React + TypeScript + Vite + Qiankun构建</p>
      </footer>
    </div>
  )
}

export default App