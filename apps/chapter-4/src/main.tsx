import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// qiankun 生命周期钩子
let root: ReactDOM.Root | null = null

function render(props: any = {}) {
  const { container } = props
  const appContainer = container
    ? container.querySelector('#root')
    : document.getElementById('root')

  root = ReactDOM.createRoot(appContainer)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// 独立运行时直接渲染
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}

// qiankun 生命周期
export async function bootstrap() {
  console.log('chapter-4 app bootstraped')
}

export async function mount(props: any) {
  console.log('chapter-4 app mount', props)
  render(props)
}

export async function unmount(_props: any) {
  console.log('chapter-4 app unmount')
  if (root) {
    root.unmount()
    root = null
  }
}

export async function update(props: any) {
  console.log('chapter-4 app update', props)
}