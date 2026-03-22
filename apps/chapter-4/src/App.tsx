// 第4章：复杂业务场景下的Zustand - 演示界面
import React, { useState, useEffect } from 'react'
import './App.css'
import { initializeChapter4, useAllStores } from './store'

// 章节导航
const chapters = [
  { id: 'async', title: '异步操作处理', description: '基础异步、分页加载、竞态处理' },
  { id: 'form', title: '表单状态管理', description: '同步验证、异步验证、表单提交' },
  { id: 'communication', title: '跨模块通信', description: '事件总线、观察者模式、实时通知' },
  { id: 'checkout', title: '电商Checkout流程', description: '多步骤流程、状态管理、订单处理' },
  { id: 'integration', title: '综合示例', description: '所有技术点的综合应用' },
  { id: 'debug', title: '调试面板', description: '查看状态变化和事件日志' }
]

function App() {
  const [activeChapter, setActiveChapter] = useState('async')
  const [initialized, setInitialized] = useState(false)

  // 初始化store
  useEffect(() => {
    const cleanup = initializeChapter4()
    setInitialized(true)

    return cleanup
  }, [])

  if (!initialized) {
    return (
      <div className="app">
        <div className="loading">正在初始化第4章示例应用...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>第4章：复杂业务场景下的Zustand</h1>
        <p className="subtitle">异步、表单、跨模块通信的综合实践</p>
      </header>

      <div className="container">
        {/* 左侧导航 */}
        <nav className="sidebar">
          <div className="chapter-list">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                className={`chapter-btn ${activeChapter === chapter.id ? 'active' : ''}`}
                onClick={() => setActiveChapter(chapter.id)}
              >
                <div className="chapter-title">{chapter.title}</div>
                <div className="chapter-desc">{chapter.description}</div>
              </button>
            ))}
          </div>
        </nav>

        {/* 右侧内容 */}
        <main className="content">
          {activeChapter === 'async' && <AsyncDemo />}
          {activeChapter === 'form' && <FormDemo />}
          {activeChapter === 'communication' && <CommunicationDemo />}
          {activeChapter === 'checkout' && <CheckoutDemo />}
          {activeChapter === 'integration' && <IntegrationDemo />}
          {activeChapter === 'debug' && <DebugPanel />}
        </main>
      </div>

      <footer className="footer">
        <p>第4章：复杂业务场景下的Zustand - 通过控制台查看详细日志和状态变化</p>
      </footer>
    </div>
  )
}

// ==================== 异步操作演示 ====================
function AsyncDemo() {
  const { async } = useAllStores()

  return (
    <div className="demo-section">
      <h2>异步操作处理</h2>
      <p className="section-desc">展示基础异步、分页加载和竞态处理三种模式</p>

      <div className="demo-grid">
        {/* 基础异步 */}
        <div className="demo-card">
          <h3>基础异步模式</h3>
          <div className="demo-content">
            <div className="status">
              状态: {async.basicAsync.state.loading ? '加载中...' :
                   async.basicAsync.state.error ? `错误: ${async.basicAsync.state.error}` :
                   async.basicAsync.state.data ? '加载完成' : '未加载'}
            </div>
            <div className="actions">
              <button
                onClick={async.basicAsync.fetch}
                disabled={async.basicAsync.state.loading}
              >
                {async.basicAsync.state.loading ? '加载中...' : '加载商品数据'}
              </button>
              <button
                onClick={async.basicAsync.reset}
                disabled={async.basicAsync.state.loading}
              >
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 分页加载 */}
        <div className="demo-card">
          <h3>分页加载模式</h3>
          <div className="demo-content">
            <div className="status">
              页码: {async.paginatedAsync.state.page} |
              总数: {async.paginatedAsync.state.total} |
              加载中: {async.paginatedAsync.state.loading ? '是' : '否'}
            </div>
            <div className="status">
              当前项目数: {async.paginatedAsync.state.items.length} |
              还有更多: {async.paginatedAsync.state.hasMore ? '是' : '否'}
            </div>
            <div className="actions">
              <button
                onClick={() => async.paginatedAsync.state.fetchPage(1)}
                disabled={async.paginatedAsync.state.loading}
              >
                加载第一页
              </button>
              <button
                onClick={async.paginatedAsync.loadMore}
                disabled={async.paginatedAsync.state.loading || !async.paginatedAsync.state.hasMore}
              >
                加载更多
              </button>
              <button
                onClick={async.paginatedAsync.refresh}
                disabled={async.paginatedAsync.state.loading}
              >
                刷新
              </button>
            </div>
          </div>
        </div>

        {/* 竞态处理 */}
        <div className="demo-card">
          <h3>竞态处理（搜索）</h3>
          <div className="demo-content">
            <div className="status">
              搜索词: "{async.searchAsync.state.query}" |
              结果数: {async.searchAsync.state.results.length} |
              最后请求ID: {async.searchAsync.state.lastRequestId}
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="输入搜索词..."
                onChange={(e) => {
                  const value = e.target.value
                  // 模拟快速输入时的竞态处理
                  if (value) {
                    async.searchAsync.search(value)
                  }
                }}
              />
            </div>
            <div className="actions">
              <button
                onClick={() => async.searchAsync.search('手机')}
                disabled={async.searchAsync.state.loading}
              >
                搜索"手机"
              </button>
              <button
                onClick={() => async.searchAsync.search('电脑')}
                disabled={async.searchAsync.state.loading}
              >
                搜索"电脑"
              </button>
              <button
                onClick={async.searchAsync.clear}
              >
                清空
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-note">
        <p>💡 使用技巧:</p>
        <ul>
          <li>基础异步模式: 简单的加载状态和错误处理</li>
          <li>分页加载模式: 支持加载更多和刷新，避免重复请求</li>
          <li>竞态处理: 快速输入时只处理最新的请求结果</li>
          <li>查看控制台了解详细的请求日志和状态变化</li>
        </ul>
      </div>
    </div>
  )
}

// ==================== 表单演示 ====================
function FormDemo() {
  const { registerForm, loginForm } = useAllStores()

  return (
    <div className="demo-section">
      <h2>表单状态管理</h2>
      <p className="section-desc">展示同步验证、异步验证和完整表单提交流程</p>

      <div className="demo-grid">
        {/* 注册表单 */}
        <div className="demo-card wide">
          <h3>用户注册表单（包含异步验证）</h3>
          <div className="demo-content">
            <FormField
              label="用户名"
              store={registerForm}
              name="username"
              type="text"
              placeholder="至少3个字符"
            />
            <FormField
              label="邮箱"
              store={registerForm}
              name="email"
              type="email"
              placeholder="输入邮箱地址"
            />
            <FormField
              label="密码"
              store={registerForm}
              name="password"
              type="password"
              placeholder="至少6个字符"
            />
            <FormField
              label="确认密码"
              store={registerForm}
              name="confirmPassword"
              type="password"
              placeholder="再次输入密码"
            />
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
                  checked={registerForm((state) => state.fields.agreeToTerms?.value) || false}
                  onChange={(e) => registerForm.getState().setFieldValue('agreeToTerms', e.target.checked)}
                  onBlur={() => registerForm.getState().setFieldTouched('agreeToTerms', true)}
                />
                同意服务条款
              </label>
              {registerForm((state) => state.fields.agreeToTerms?.touched && state.fields.agreeToTerms?.error) && (
                <div className="error">{registerForm((state) => state.fields.agreeToTerms?.error)}</div>
              )}
            </div>

            <div className="form-actions">
              <button
                onClick={() => registerForm.getState().submit()}
                disabled={registerForm((state) => state.submitting)}
              >
                {registerForm((state) => state.submitting ? '提交中...' : '注册')}
              </button>
              <button
                onClick={() => registerForm.getState().reset()}
              >
                重置
              </button>
              <button
                onClick={() => registerForm.getState().clearErrors()}
              >
                清除错误
              </button>
            </div>

            <div className="form-status">
              {registerForm((state) => state.submitSuccess && '✅ 注册成功！')}
              {registerForm((state) => state.submitError && `❌ ${state.submitError}`)}
              {registerForm((state) => state.isValid ? '✅ 表单有效' : '❌ 表单无效')}
            </div>
          </div>
        </div>

        {/* 登录表单 */}
        <div className="demo-card">
          <h3>登录表单</h3>
          <div className="demo-content">
            <FormField
              label="邮箱"
              store={loginForm}
              name="email"
              type="email"
            />
            <FormField
              label="密码"
              store={loginForm}
              name="password"
              type="password"
            />

            <div className="form-actions">
              <button
                onClick={() => loginForm.getState().submit()}
                disabled={loginForm((state) => state.submitting)}
              >
                {loginForm((state) => state.submitting ? '登录中...' : '登录')}
              </button>
              <button
                onClick={() => loginForm.getState().reset()}
              >
                重置
              </button>
            </div>

            <div className="form-status">
              {loginForm((state) => state.submitSuccess && '✅ 登录成功！')}
              {loginForm((state) => state.submitError && `❌ ${state.submitError}`)}
            </div>
          </div>
        </div>
      </div>

      <div className="demo-note">
        <p>💡 表单特性:</p>
        <ul>
          <li>同步验证: 即时检查字段格式和必填项</li>
          <li>异步验证: 用户名和邮箱的实时可用性检查</li>
          <li>触摸验证: 只有触摸过的字段才显示错误</li>
          <li>防重复提交: 提交过程中禁用按钮</li>
          <li>完整的错误处理和成功反馈</li>
        </ul>
      </div>
    </div>
  )
}

// 表单字段组件
function FormField({ label, store, name, type = 'text', placeholder = '' }: any) {
  const field = store((state) => state.fields[name])
  const setValue = store((state) => state.setFieldValue)
  const setTouched = store((state) => state.setFieldTouched)

  return (
    <div className="form-field">
      <label>{label}</label>
      <input
        type={type}
        value={field?.value || ''}
        onChange={(e) => setValue(name, e.target.value)}
        onBlur={() => setTouched(name, true)}
        placeholder={placeholder}
      />
      {field?.touched && field?.error && (
        <div className="error">{field.error}</div>
      )}
    </div>
  )
}

// ==================== 跨模块通信演示 ====================
function CommunicationDemo() {
  const { communication } = useAllStores()
  const [eventLog, setEventLog] = useState<string[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  // 监听事件
  useEffect(() => {
    const unsubscribe = communication.eventBus.on('*' as any, (data: any) => {
      // 这里简化处理，实际应该根据事件类型处理
      setEventLog(prev => [`${new Date().toLocaleTimeString()}: ${JSON.stringify(data)}`, ...prev.slice(0, 10)])
    })

    return unsubscribe
  }, [communication.eventBus])

  // 监听通知
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNotifications = communication.notifications.getState().notifications
      setNotifications(currentNotifications.slice(0, 5))
    }, 500)

    return () => clearInterval(interval)
  }, [communication.notifications])

  return (
    <div className="demo-section">
      <h2>跨模块通信</h2>
      <p className="section-desc">事件总线、观察者模式和实时通知系统</p>

      <div className="demo-grid">
        {/* 事件触发 */}
        <div className="demo-card">
          <h3>触发事件</h3>
          <div className="demo-content">
            <div className="actions">
              <button onClick={() => {
                communication.cart.getState().addItem({
                  id: 'prod-' + Date.now(),
                  name: '测试商品',
                  price: Math.floor(Math.random() * 1000) + 100
                })
              }}>
                添加商品到购物车
              </button>
              <button onClick={() => {
                communication.cart.getState().removeItem('item-1')
              }}>
                从购物车移除商品
              </button>
              <button onClick={() => {
                communication.eventBus.emit('user:loggedIn', {
                  userId: 'user-' + Date.now(),
                  userName: '测试用户'
                })
              }}>
                模拟用户登录
              </button>
              <button onClick={() => {
                communication.eventBus.emit('order:created', {
                  orderId: 'order-' + Date.now(),
                  total: 999
                })
              }}>
                模拟创建订单
              </button>
            </div>
          </div>
        </div>

        {/* 通知面板 */}
        <div className="demo-card">
          <h3>实时通知</h3>
          <div className="demo-content">
            <div className="notifications">
              {notifications.length === 0 ? (
                <div className="empty">暂无通知</div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`notification ${notif.type}`}>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="actions">
              <button onClick={() => {
                communication.notifications.getState().clearNotifications()
              }}>
                清除所有通知
              </button>
            </div>
          </div>
        </div>

        {/* 事件日志 */}
        <div className="demo-card wide">
          <h3>事件日志（最近10条）</h3>
          <div className="demo-content">
            <div className="event-log">
              {eventLog.length === 0 ? (
                <div className="empty">暂无事件</div>
              ) : (
                eventLog.map((log, index) => (
                  <div key={index} className="log-entry">
                    {log}
                  </div>
                ))
              )}
            </div>
            <div className="actions">
              <button onClick={() => setEventLog([])}>
                清空日志
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-note">
        <p>💡 通信模式:</p>
        <ul>
          <li>事件总线: 模块间松耦合通信，任何模块都可以触发或监听事件</li>
          <li>观察者模式: 特定状态变化的订阅/通知机制</li>
          <li>实时通知: 基于事件的用户反馈系统</li>
          <li>查看控制台了解详细的事件触发和传递过程</li>
        </ul>
      </div>
    </div>
  )
}

// ==================== Checkout流程演示 ====================
function CheckoutDemo() {
  const { checkout } = useAllStores()
  const state = checkout.state()
  const stepDetails = checkout.getStepDetails()

  return (
    <div className="demo-section">
      <h2>电商Checkout流程</h2>
      <p className="section-desc">多步骤状态管理、订单处理和支付集成</p>

      {/* 步骤指示器 */}
      <div className="steps-indicator">
        {stepDetails.map((step) => (
          <div key={step.step} className={`step ${step.isCurrent ? 'current' : ''} ${step.isCompleted ? 'completed' : ''}`}>
            <div className="step-number">{step.index + 1}</div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-grid">
        {/* 当前步骤内容 */}
        <div className="demo-card wide">
          <h3>当前步骤: {stepDetails.find(s => s.isCurrent)?.title}</h3>
          <div className="demo-content">
            {state.step === 'cart' && (
              <div className="step-content">
                <h4>购物车商品</h4>
                <div className="cart-items">
                  {state.cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="item-name">{item.name}</div>
                      <div className="item-details">
                        ¥{item.price} × {item.quantity} = ¥{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">总计: ¥{state.cartTotal}</div>
              </div>
            )}

            {state.step === 'shipping' && (
              <div className="step-content">
                <h4>配送地址</h4>
                {state.loading ? (
                  <div>加载地址中...</div>
                ) : (
                  <>
                    <div className="address-list">
                      {state.availableAddresses.map((addr) => (
                        <div key={addr.id} className={`address-item ${state.shippingAddress?.id === addr.id ? 'selected' : ''}`}>
                          <div className="address-name">{addr.name} ({addr.phone})</div>
                          <div className="address-detail">{addr.province}{addr.city}{addr.district}{addr.detail}</div>
                          <button onClick={() => checkout.state().selectAddress(addr.id)}>
                            {state.shippingAddress?.id === addr.id ? '已选择' : '选择'}
                          </button>
                        </div>
                      ))}
                    </div>
                    {state.isAddingNewAddress ? (
                      <div className="add-address-form">
                        <h5>添加新地址</h5>
                        <button onClick={() => checkout.state().cancelAddingNewAddress()}>取消</button>
                      </div>
                    ) : (
                      <button onClick={() => checkout.state().startAddingNewAddress()}>
                        添加新地址
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {state.step === 'payment' && (
              <div className="step-content">
                <h4>支付方式</h4>
                {state.loading ? (
                  <div>加载支付方式中...</div>
                ) : (
                  <div className="payment-methods">
                    {state.availablePaymentMethods.map((method) => (
                      <div key={method.id} className={`payment-method ${state.paymentMethod?.id === method.id ? 'selected' : ''}`}>
                        <div className="method-name">{method.name}</div>
                        {method.lastFour && <div className="method-detail">尾号 {method.lastFour}</div>}
                        <button onClick={() => checkout.state().selectPaymentMethod(method.id)}>
                          {state.paymentMethod?.id === method.id ? '已选择' : '选择'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {state.step === 'review' && (
              <div className="step-content">
                <h4>订单确认</h4>
                <div className="order-summary">
                  <div className="summary-row">
                    <span>商品总额:</span>
                    <span>¥{state.orderSummary.subtotal}</span>
                  </div>
                  <div className="summary-row">
                    <span>配送费:</span>
                    <span>¥{state.orderSummary.shippingFee}</span>
                  </div>
                  <div className="summary-row">
                    <span>优惠:</span>
                    <span>-¥{state.orderSummary.discount}</span>
                  </div>
                  <div className="summary-row total">
                    <span>实付金额:</span>
                    <span>¥{state.orderSummary.total}</span>
                  </div>
                </div>
                <div className="order-details">
                  <p>配送地址: {state.shippingAddress?.province}{state.shippingAddress?.city}{state.shippingAddress?.district}{state.shippingAddress?.detail}</p>
                  <p>支付方式: {state.paymentMethod?.name}</p>
                </div>
              </div>
            )}

            {state.step === 'complete' && (
              <div className="step-content">
                <h4>🎉 订单创建成功!</h4>
                <p>感谢您的购买，订单处理已完成。</p>
                <p>您将收到订单确认邮件，我们会在24小时内发货。</p>
              </div>
            )}
          </div>
        </div>

        {/* 控制面板 */}
        <div className="demo-card">
          <h3>流程控制</h3>
          <div className="demo-content">
            <div className="status">
              当前步骤: {state.step}<br />
              加载状态: {state.loading ? '进行中' : '空闲'}<br />
              错误: {state.error || '无'}
            </div>
            <div className="actions vertical">
              <button
                onClick={() => checkout.state().goToPrevStep()}
                disabled={state.step === 'cart' || state.loading}
              >
                上一步
              </button>
              <button
                onClick={() => checkout.state().goToNextStep()}
                disabled={state.step === 'complete' || state.loading}
              >
                下一步
              </button>
              {state.step === 'review' && (
                <button
                  onClick={() => checkout.completeCheckout()}
                  disabled={state.loading}
                  className="primary"
                >
                  {state.loading ? '处理中...' : '确认下单'}
                </button>
              )}
              <button
                onClick={() => checkout.state().resetCheckout()}
                disabled={state.loading}
              >
                重置流程
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-note">
        <p>💡 Checkout流程特性:</p>
        <ul>
          <li>多步骤状态管理: 清晰的步骤划分和状态转换</li>
          <li>数据预加载: 下一步所需数据提前加载</li>
          <li>完整的验证: 每个步骤都有数据验证</li>
          <li>错误处理: 网络错误和业务错误的统一处理</li>
          <li>事件集成: 订单创建后触发相关事件</li>
        </ul>
      </div>
    </div>
  )
}

// ==================== 综合示例 ====================
function IntegrationDemo() {
  return (
    <div className="demo-section">
      <h2>综合示例</h2>
      <p className="section-desc">异步操作、表单、通信和业务流程的综合应用</p>

      <div className="demo-content">
        <div className="integration-demo">
          <h3>完整的用户注册+购物流程</h3>
          <p>这个示例展示了第4章所有技术的综合应用：</p>

          <ol>
            <li>用户通过表单注册（包含异步验证）</li>
            <li>注册成功后自动登录（跨模块通信）</li>
            <li>浏览商品（异步分页加载）</li>
            <li>添加商品到购物车（事件触发）</li>
            <li>进行checkout流程（多步骤状态管理）</li>
            <li>创建订单（异步操作+错误处理）</li>
            <li>订单确认（事件通知）</li>
          </ol>

          <div className="actions">
            <button onClick={() => {
              console.log('开始完整流程演示...')
              // 在实际应用中，这里会触发一系列连贯的操作
              alert('查看控制台了解完整流程的模拟执行')
            }}>
              开始完整流程演示
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 调试面板 ====================
function DebugPanel() {
  const { async, registerForm, loginForm, communication, checkout } = useAllStores()

  return (
    <div className="demo-section">
      <h2>调试面板</h2>
      <p className="section-desc">查看所有store的当前状态和调试信息</p>

      <div className="demo-grid">
        {/* 异步状态 */}
        <div className="demo-card">
          <h3>异步操作状态</h3>
          <div className="debug-content">
            <pre>
              {JSON.stringify({
                basicAsync: {
                  loading: async.basicAsync.state.loading,
                  error: async.basicAsync.state.error,
                  hasData: !!async.basicAsync.state.data
                },
                paginatedAsync: {
                  page: async.paginatedAsync.state.page,
                  total: async.paginatedAsync.state.total,
                  itemsCount: async.paginatedAsync.state.items.length,
                  hasMore: async.paginatedAsync.state.hasMore
                },
                searchAsync: {
                  query: async.searchAsync.state.query,
                  resultsCount: async.searchAsync.state.results.length,
                  lastRequestId: async.searchAsync.state.lastRequestId
                }
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* 表单状态 */}
        <div className="demo-card">
          <h3>表单状态</h3>
          <div className="debug-content">
            <pre>
              {JSON.stringify({
                registerForm: {
                  isValid: registerForm((state) => state.isValid),
                  submitting: registerForm((state) => state.submitting),
                  submitSuccess: registerForm((state) => state.submitSuccess),
                  submitError: registerForm((state) => state.submitError)
                },
                loginForm: {
                  submitting: loginForm((state) => state.submitting),
                  submitSuccess: loginForm((state) => state.submitSuccess)
                }
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* 通信状态 */}
        <div className="demo-card">
          <h3>通信状态</h3>
          <div className="debug-content">
            <pre>
              {JSON.stringify({
                cart: {
                  itemsCount: communication.cart.getState().items.length
                },
                notifications: {
                  count: communication.notifications.getState().notifications.length
                }
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* Checkout状态 */}
        <div className="demo-card">
          <h3>Checkout状态</h3>
          <div className="debug-content">
            <pre>
              {JSON.stringify({
                step: checkout.state().step,
                loading: checkout.state().loading,
                error: checkout.state().error,
                shippingAddress: !!checkout.state().shippingAddress,
                paymentMethod: !!checkout.state().paymentMethod,
                orderSummary: checkout.state().orderSummary
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App