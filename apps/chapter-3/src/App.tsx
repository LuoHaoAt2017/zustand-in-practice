import React, { useState, useEffect } from 'react'
import './App.css'

// 导入模块化store
import { useAuthStore } from './stores/modules/auth'
import { useProductStore } from './stores/modules/product'
import { useCartStore } from './stores/modules/cart'
import { useOrderStore } from './stores/modules/order'
import { useAppStore, useCombinedActions } from './stores/combined'
import { initializeMockData } from './stores'

// 章节导航
const sections = [
  { id: 'introduction', title: '模块化设计介绍', description: '为什么需要模块化store' },
  { id: 'auth', title: '认证模块', description: '用户登录/登出' },
  { id: 'product', title: '商品模块', description: '商品列表与分类' },
  { id: 'cart', title: '购物车模块', description: '添加商品与计算总价' },
  { id: 'order', title: '订单模块', description: '创建订单与历史' },
  { id: 'combined', title: '模块组合', description: '跨模块通信与派生状态' },
  { id: 'patterns', title: '设计模式对比', description: '不同模块化模式对比' },
]

// 模拟数据（注释掉未使用的变量）
// const mockProducts = [
//   { id: '1', name: '商品A', price: 100, category: 'electronics' },
//   { id: '2', name: '商品B', price: 200, category: 'electronics' },
//   { id: '3', name: '商品C', price: 150, category: 'clothing' },
//   { id: '4', name: '商品D', price: 300, category: 'clothing' },
// ]

// const mockCategories = [
//   { id: 'electronics', name: '电子产品' },
//   { id: 'clothing', name: '服装' },
// ]

function App() {
  const [activeSection, setActiveSection] = useState('introduction')
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  // 初始化模拟数据
  useEffect(() => {
    const init = async () => {
      await initializeMockData()
      addConsoleLog('模拟数据初始化完成')
    }
    init()
  }, [])

  const addConsoleLog = (message: string) => {
    setConsoleLogs(prev => [...prev.slice(-4), `📝 ${message}`])
  }

  // 渲染介绍部分
  const renderIntroduction = () => (
    <div className="demo-section">
      <h3>为什么需要模块化store？</h3>
      <div className="demo-grid">
        <div className="demo-card">
          <h4>单体store的问题</h4>
          <ul>
            <li><strong>关注点分离不清晰</strong>：不同业务域状态混杂</li>
            <li><strong>维护困难</strong>：文件过大，难以导航</li>
            <li><strong>测试复杂</strong>：难以单独测试某个功能模块</li>
            <li><strong>团队协作冲突</strong>：多人修改同一文件</li>
            <li><strong>性能影响</strong>：不必要的重渲染范围扩大</li>
          </ul>

          <div className="code-block">
            <h5>单体store示例（不推荐）</h5>
            <pre>{`// 所有状态都在一个store中
const useMonolithicStore = create((set, get) => ({
  // 用户相关
  user: null,
  token: null,

  // 商品相关
  products: [],
  categories: [],

  // 购物车相关
  cart: [],

  // 订单相关
  orders: [],

  // 数十个action混杂在一起...
  login: () => {},
  fetchProducts: () => {},
  addToCart: () => {},
  createOrder: () => {},
  // ...更多
}))`}</pre>
          </div>
        </div>

        <div className="demo-card success">
          <h4>模块化store的优势</h4>
          <ul>
            <li><strong>关注点分离</strong>：每个store负责单一业务域</li>
            <li><strong>易于维护</strong>：小文件，清晰的结构</li>
            <li><strong>便于测试</strong>：可以单独测试每个模块</li>
            <li><strong>团队协作</strong>：不同团队负责不同模块</li>
            <li><strong>性能优化</strong>：组件只订阅需要的模块</li>
            <li><strong>可复用性</strong>：模块可以在不同项目间复用</li>
          </ul>
        </div>
      </div>
    </div>
  )

  // 渲染认证模块
  const renderAuthModule = () => {
    const { user, isAuthenticated, login, logout } = useAuthStore()

    const handleLogin = () => {
      login({ username: 'testuser', password: 'password' })
      addConsoleLog('用户登录成功')
    }

    const handleLogout = () => {
      logout()
      addConsoleLog('用户已登出')
    }

    return (
      <div className="demo-section">
        <h3>认证模块</h3>
        <div className="demo-grid">
          <div className="demo-card">
            <h4>用户状态</h4>
            <div className="demo-component">
              <p>当前用户: {user ? user.username : '未登录'}</p>
              <p>认证状态: {isAuthenticated() ? '已认证' : '未认证'}</p>
              <div className="button-group">
                <button onClick={handleLogin} disabled={isAuthenticated()}>
                  模拟登录
                </button>
                <button onClick={handleLogout} disabled={!isAuthenticated()}>
                  登出
                </button>
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h4>store代码</h4>
            <div className="code-block">
              <pre>{`// store/modules/auth.ts
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: () => boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: () => !!get().token,
  login: async (credentials) => {
    // 模拟API调用
    const response = await mockApi.login(credentials)
    set({ user: response.user, token: response.token })
  },
  logout: () => set({ user: null, token: null }),
}))`}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 渲染商品模块
  const renderProductModule = () => {
    const { products, categories, selectedCategory, fetchProducts, selectCategory } = useProductStore()

    const handleFetchProducts = () => {
      fetchProducts()
      addConsoleLog('获取商品列表')
    }

    const handleSelectCategory = (categoryId: string | null) => {
      selectCategory(categoryId)
      addConsoleLog(`选择分类: ${categoryId || '全部'}`)
    }

    return (
      <div className="demo-section">
        <h3>商品模块</h3>
        <div className="demo-grid">
          <div className="demo-card">
            <h4>商品列表</h4>
            <div className="demo-component">
              <p>商品数量: {products.length}</p>
              <p>当前分类: {selectedCategory || '全部'}</p>

              <div className="button-group">
                <button onClick={handleFetchProducts}>获取商品</button>
                <button onClick={() => handleSelectCategory(null)}>全部</button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={selectedCategory === cat.id ? 'active' : ''}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="product-list">
                {products.map(product => (
                  <div key={product.id} className="product-item">
                    <span>{product.name}</span>
                    <span>¥{product.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h4>store代码</h4>
            <div className="code-block">
              <pre>{`// store/modules/product.ts
export interface ProductState {
  products: Product[]
  categories: Category[]
  selectedCategory: string | null
  fetchProducts: () => Promise<void>
  selectCategory: (categoryId: string | null) => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  categories: [],
  selectedCategory: null,
  fetchProducts: async () => {
    const products = await mockApi.getProducts()
    set({ products })
  },
  selectCategory: (categoryId) => set({ selectedCategory: categoryId }),
}))`}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 渲染购物车模块
  const renderCartModule = () => {
    const { items, total, addItem, removeItem, clearCart } = useCartStore()
    const { products } = useProductStore()

    const handleAddToCart = (productId: string) => {
      const product = products.find(p => p.id === productId)
      if (product) {
        addItem(product, 1)
        addConsoleLog(`添加到购物车: ${product.name}`)
      }
    }

    const handleRemoveFromCart = (productId: string) => {
      removeItem(productId)
      addConsoleLog(`从购物车移除: ${productId}`)
    }

    return (
      <div className="demo-section">
        <h3>购物车模块</h3>
        <div className="demo-grid">
          <div className="demo-card">
            <h4>购物车</h4>
            <div className="demo-component">
              <p>商品数量: {items.length}</p>
              <p>总价: ¥{total}</p>

              <div className="button-group">
                <button onClick={() => handleAddToCart('1')}>添加商品A</button>
                <button onClick={() => handleAddToCart('2')}>添加商品B</button>
                <button onClick={clearCart} disabled={items.length === 0}>
                  清空购物车
                </button>
              </div>

              <div className="cart-items">
                {items.map(item => (
                  <div key={item.id} className="cart-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>¥{item.price * item.quantity}</span>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="small"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h4>store代码</h4>
            <div className="code-block">
              <pre>{`// store/modules/cart.ts
export interface CartState {
  items: CartItem[]
  total: number
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  get total() {
    return get().items.reduce((sum, item) =>
      sum + item.price * item.quantity, 0)
  },
  addItem: (product, quantity) => {
    set((state) => ({
      items: [...state.items, {
        ...product,
        quantity
      }],
    }))
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }))
  },
  clearCart: () => set({ items: [] }),
}))`}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 渲染订单模块
  const renderOrderModule = () => {
    const { orders, createOrder } = useOrderStore()
    const { items } = useCartStore()
    const { user } = useAuthStore()

    const handleCreateOrder = async () => {
      try {
        const order = await createOrder(items)
        addConsoleLog(`订单创建成功: ${order.id}`)
      } catch (error) {
        addConsoleLog(`订单创建失败: ${(error as Error).message}`)
      }
    }

    return (
      <div className="demo-section">
        <h3>订单模块</h3>
        <div className="demo-grid">
          <div className="demo-card">
            <h4>订单管理</h4>
            <div className="demo-component">
              <p>订单数量: {orders.length}</p>
              <p>用户状态: {user ? '已登录' : '未登录'}</p>
              <p>购物车商品: {items.length}件</p>

              <div className="button-group">
                <button
                  onClick={handleCreateOrder}
                  disabled={!user || items.length === 0}
                >
                  创建订单
                </button>
              </div>

              <div className="order-list">
                {orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div>订单ID: {order.id}</div>
                    <div>总价: ¥{order.total}</div>
                    <div>商品数量: {order.items.length}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h4>store代码（依赖注入模式）</h4>
            <div className="code-block">
              <pre>{`// store/modules/order.ts
export const createOrderStore = (dependencies: {
  cartStore: ReturnType<typeof useCartStore>
  authStore: ReturnType<typeof useAuthStore>
}) => {
  return create<OrderState>((set) => ({
    orders: [],
    createOrder: async (cartItems) => {
      const { user } = dependencies.authStore.getState()
      const { clearCart } = dependencies.cartStore.getState()

      if (!user) throw new Error('用户未认证')

      const order = await mockApi.createOrder({
        userId: user.id,
        items: cartItems,
      })

      set((state) => ({ orders: [...state.orders, order] }))
      clearCart()
      return order
    },
  }))
}

// 使用时注入依赖
const useOrderStore = createOrderStore({
  cartStore: useCartStore,
  authStore: useAuthStore,
})`}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 渲染模块组合
  const renderCombinedModule = () => {
    const { user, products, cartItems, cartProducts } = useAppStore()
    const { addProductToCart } = useCombinedActions()

    const handleAddProduct = (productId: string) => {
      addProductToCart(productId, 1)
      addConsoleLog(`通过组合action添加商品: ${productId}`)
    }

    return (
      <div className="demo-section">
        <h3>模块组合与派生状态</h3>
        <div className="demo-grid">
          <div className="demo-card">
            <h4>组合hook示例</h4>
            <div className="demo-component">
              <p>用户: {user ? user.username : '未登录'}</p>
              <p>商品总数: {products.length}</p>
              <p>购物车商品: {cartItems.length}件</p>
              <p>购物车商品详情: {cartProducts.length}种</p>

              <div className="button-group">
                <button onClick={() => handleAddProduct('3')}>添加商品C到购物车</button>
                <button onClick={() => handleAddProduct('4')}>添加商品D到购物车</button>
              </div>

              <div className="cart-products">
                {cartProducts.map(product => (
                  <div key={product.id} className="cart-product-item">
                    <span>{product.name} × {product.quantity}</span>
                    <span>¥{product.price * product.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h4>组合store代码</h4>
            <div className="code-block">
              <pre>{`// store/combined.ts
import { useAuthStore } from './modules/auth'
import { useProductStore } from './modules/product'
import { useCartStore } from './modules/cart'

// 组合hook
export const useAppStore = () => {
  const user = useAuthStore((state) => state.user)
  const products = useProductStore((state) => state.products)
  const cartItems = useCartStore((state) => state.items)

  // 派生状态：购物车商品详情
  const cartProducts = useMemo(() => {
    return cartItems.map((item) => {
      const product = products.find((p) => p.id === item.id)
      return product ? { ...product, quantity: item.quantity } : null
    }).filter(Boolean)
  }, [cartItems, products])

  return { user, products, cartItems, cartProducts }
}

// 组合action
export const useCombinedActions = () => {
  const { addItem } = useCartStore()
  const { products } = useProductStore()

  const addProductToCart = useCallback((productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      addItem(product, quantity)
    }
  }, [products, addItem])

  return { addProductToCart }
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 渲染设计模式对比
  const renderPatternsComparison = () => (
    <div className="demo-section">
      <h3>模块化设计模式对比</h3>
      <div className="demo-grid">
        <div className="demo-card">
          <h4>模式1：按业务域分割store</h4>
          <ul>
            <li><strong>优点</strong>：清晰的组织结构，易于维护</li>
            <li><strong>适用场景</strong>：中型项目，业务边界清晰</li>
            <li><strong>示例</strong>：auth.ts, product.ts, cart.ts</li>
          </ul>
        </div>

        <div className="demo-card">
          <h4>模式2：组合与派生状态</h4>
          <ul>
            <li><strong>优点</strong>：灵活组合，避免重复逻辑</li>
            <li><strong>适用场景</strong>：需要跨模块数据的场景</li>
            <li><strong>示例</strong>：combined.ts中的组合hook</li>
          </ul>
        </div>

        <div className="demo-card">
          <h4>模式3：依赖注入</h4>
          <ul>
            <li><strong>优点</strong>：解耦依赖，便于测试</li>
            <li><strong>适用场景</strong>：模块间强依赖，需要mock测试</li>
            <li><strong>示例</strong>：order.ts中的store工厂</li>
          </ul>
        </div>
      </div>

      <div className="demo-card">
        <h4>文件组织方案</h4>
        <div className="code-block">
          <pre>{`// 方案A：按模块组织
src/
├── store/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   ├── actions.ts
│   │   │   └── selectors.ts
│   │   ├── product/
│   │   │   └── index.ts
│   │   ├── cart/
│   │   │   └── index.ts
│   │   └── order/
│   │       └── index.ts
│   ├── combined.ts
│   └── index.ts

// 方案B：按功能组织
src/
├── features/
│   ├── auth/
│   │   ├── store.ts
│   │   ├── components/
│   │   └── hooks/
│   ├── products/
│   │   ├── store.ts
│   │   └── components/
│   └── cart/
│       ├── store.ts
│       └── components/
└── shared/
    └── store/
        ├── types.ts
        └── utils.ts`}</pre>
        </div>
      </div>
    </div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'introduction': return renderIntroduction()
      case 'auth': return renderAuthModule()
      case 'product': return renderProductModule()
      case 'cart': return renderCartModule()
      case 'order': return renderOrderModule()
      case 'combined': return renderCombinedModule()
      case 'patterns': return renderPatternsComparison()
      default: return renderIntroduction()
    }
  }

  return (
    <div className="chapter-3-app">
      <header className="app-header">
        <h1>第3章：中型项目中 Zustand 的模块化设计实践</h1>
        <p>学习如何在中型项目中对Zustand store进行模块化设计，包括store分割、组合、依赖管理等最佳实践</p>
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
            <h4>操作日志</h4>
            <div className="console-output">
              {consoleLogs.length === 0 ? (
                <p className="console-placeholder">点击各模块的按钮查看操作日志...</p>
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
        <p><strong>学习要点：</strong> 理解模块化store的设计原则，掌握store分割和组合技巧，学习处理模块间依赖关系</p>
      </footer>
    </div>
  )
}

export default App
