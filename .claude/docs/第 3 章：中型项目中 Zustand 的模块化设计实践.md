# 第 3 章：中型项目中 Zustand 的模块化设计实践

## 概述
随着项目规模增长，单个store会变得难以维护。本章将介绍如何在中型项目中对Zustand store进行模块化设计，包括store分割、组合、依赖管理等最佳实践。

## 学习目标
- 理解模块化store的设计原则
- 掌握store分割和组合技巧
- 学习处理模块间依赖关系
- 了解代码组织和维护策略

## 为什么需要模块化

### 单体store的问题
```typescript
// 问题：所有状态都放在一个store中
const useMonolithicStore = create((set, get) => ({
  // 用户相关
  user: null,
  token: null,
  permissions: [],

  // 商品相关
  products: [],
  categories: [],
  cart: [],

  // 订单相关
  orders: [],
  currentOrder: null,

  // 设置相关
  theme: 'light',
  language: 'zh-CN',

  // 数十个action...
  login: () => {},
  logout: () => {},
  fetchProducts: () => {},
  addToCart: () => {},
  // ...更多
}))
```

**问题**：
1. **关注点分离不清晰**：不同业务域状态混杂
2. **维护困难**：文件过大，难以导航
3. **测试复杂**：难以单独测试某个功能模块
4. **团队协作冲突**：多人修改同一文件
5. **性能影响**：不必要的重渲染范围扩大

## 模块化设计模式

### 模式1：按业务域分割store

```typescript
// store/modules/auth.ts
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: () => !!get().token,
  login: async (credentials) => {
    const response = await api.login(credentials)
    set({ user: response.user, token: response.token })
  },
  logout: () => set({ user: null, token: null }),
}))

// store/modules/product.ts
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
    const products = await api.getProducts()
    set({ products })
  },
  selectCategory: (categoryId) => set({ selectedCategory: categoryId }),
}))

// store/modules/cart.ts
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
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },
  addItem: (product, quantity) => {
    set((state) => ({
      items: [...state.items, { ...product, quantity }],
    }))
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }))
  },
  clearCart: () => set({ items: [] }),
}))
```

### 模式2：store组合与派生状态

```typescript
// store/combined.ts
import { useAuthStore } from './modules/auth'
import { useProductStore } from './modules/product'
import { useCartStore } from './modules/cart'

// 创建组合hook，用于需要访问多个store的场景
export const useAppStore = () => {
  const user = useAuthStore((state) => state.user)
  const products = useProductStore((state) => state.products)
  const cartItems = useCartStore((state) => state.items)

  // 派生状态：用户购物车中的商品详情
  const cartProducts = useMemo(() => {
    return cartItems.map((item) => {
      const product = products.find((p) => p.id === item.productId)
      return product ? { ...product, quantity: item.quantity } : null
    }).filter(Boolean)
  }, [cartItems, products])

  return {
    user,
    products,
    cartItems,
    cartProducts,
  }
}

// 或者创建组合action
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
}
```

### 模式3：依赖注入模式

```typescript
// store/modules/order.ts
export interface OrderState {
  orders: Order[]
  createOrder: (cartItems: CartItem[]) => Promise<Order>
}

// 创建store工厂，接受依赖
export const createOrderStore = (dependencies: {
  cartStore: ReturnType<typeof useCartStore>
  authStore: ReturnType<typeof useAuthStore>
}) => {
  return create<OrderState>((set) => ({
    orders: [],
    createOrder: async (cartItems) => {
      const { user } = dependencies.authStore.getState()
      const { clearCart } = dependencies.cartStore.getState()

      if (!user) throw new Error('User not authenticated')

      const order = await api.createOrder({
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
})
```

## 文件组织方案

### 方案A：按模块组织
```
src/
├── store/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── index.ts        # 导出store和类型
│   │   │   ├── actions.ts      # 单独存放复杂actions
│   │   │   └── selectors.ts    # 派生状态选择器
│   │   ├── product/
│   │   │   └── index.ts
│   │   ├── cart/
│   │   │   └── index.ts
│   │   └── order/
│   │       └── index.ts
│   ├── combined.ts             # 组合store
│   └── index.ts                # 统一导出
```

### 方案B：按功能组织
```
src/
├── features/
│   ├── auth/
│   │   ├── store.ts           # auth相关store
│   │   ├── components/
│   │   └── hooks/
│   ├── products/
│   │   ├── store.ts
│   │   ├── components/
│   │   └── hooks/
│   └── cart/
│       ├── store.ts
│       ├── components/
│       └── hooks/
└── shared/
    └── store/
        ├── types.ts
        └── utils.ts
```

## 模块间通信

### 1. 使用组合hook
```typescript
// hooks/useCheckout.ts
export const useCheckout = () => {
  const { user } = useAuthStore()
  const { items, clearCart } = useCartStore()
  const { createOrder } = useOrderStore()

  const checkout = useCallback(async () => {
    if (!user) throw new Error('请先登录')
    if (items.length === 0) throw new Error('购物车为空')

    const order = await createOrder(items)
    clearCart()
    return order
  }, [user, items, createOrder, clearCart])

  return { checkout }
}
```

### 2. 使用中间件协调
```typescript
// store/middleware/syncMiddleware.ts
const syncMiddleware: Middleware = (config) => (set, get, api) => {
  const next = config(set, get, api)

  // 监听auth变化，同步到其他store
  const originalSet = api.setState
  api.setState = (partial, replace) => {
    const prevState = get()
    const result = originalSet(partial, replace)
    const nextState = get()

    // 如果用户登出，清空购物车
    if (prevState.user && !nextState.user) {
      useCartStore.getState().clearCart()
    }

    return result
  }

  return next
}
```

## 性能优化考虑

### 1. 避免跨模块重渲染
```typescript
// 错误：组件订阅了不需要的模块
function ProductList() {
  const { products, user } = useAppStore() // user变化也会导致重渲染

  return products.map(/* ... */)
}

// 正确：只订阅需要的模块
function ProductList() {
  const products = useProductStore((state) => state.products)

  return products.map(/* ... */)
}
```

### 2. 使用memoization
```typescript
// store/modules/product/selectors.ts
export const selectFilteredProducts = createSelector(
  [(state: ProductState) => state.products, (state: ProductState) => state.selectedCategory],
  (products, selectedCategory) => {
    if (!selectedCategory) return products
    return products.filter((p) => p.categoryId === selectedCategory)
  }
)

// 组件中使用
const filteredProducts = useProductStore(selectFilteredProducts)
```

## 本章案例设计

### 案例：电商应用模块化store
我们将实现一个简化的电商应用，包含以下模块：
1. **认证模块**：用户登录/登出
2. **商品模块**：商品列表、分类筛选
3. **购物车模块**：添加商品、移除商品、计算总价
4. **订单模块**：创建订单、订单历史

### 技术要点
- 模块化store设计
- 模块间通信
- 派生状态计算
- 性能优化（避免不必要的重渲染）

## 总结
模块化设计是中型项目成功使用Zustand的关键。通过合理的store分割、组合和依赖管理，可以提高代码的可维护性、可测试性和团队协作效率。

---

**下一章**：我们将探讨在复杂业务场景下如何使用Zustand处理异步、表单和跨模块通信。
