// 第5章：Zustand性能优化实战 - 状态结构优化
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { throttle, debounce } from 'lodash-es'
import {
  User, Product, CartItem, Order, LargeListItem,
  PersistenceConfig, CacheState, BatchUpdate,
  StorageEngine, PerformanceConfig, VirtualScrollState
} from './types'
import { generateMockUser, generateMockProduct, generateLargeProductList, dataGenerator } from './mockData'

// ==================== 示例1：扁平化状态结构 ====================

// 不推荐：深度嵌套的状态结构
interface NestedUserState {
  user: {
    profile: {
      personal: {
        name: string
        age: number
        gender: string
      }
      contact: {
        email: string
        phone: string
        address: {
          street: string
          city: string
          country: string
        }
      }
    }
    settings: {
      preferences: {
        theme: string
        language: string
        notifications: boolean
      }
      privacy: {
        showEmail: boolean
        showAge: boolean
      }
    }
  }
}

// 推荐：扁平化状态结构
interface FlatUserState {
  // 用户基本信息
  userName: string
  userAge: number
  userGender: string

  // 联系信息
  userEmail: string
  userPhone: string
  userStreet: string
  userCity: string
  userCountry: string

  // 设置
  userTheme: string
  userLanguage: string
  userNotifications: boolean

  // 隐私设置
  userShowEmail: boolean
  userShowAge: boolean

  // Actions
  updatePersonalInfo: (info: { name?: string; age?: number; gender?: string }) => void
  updateContactInfo: (contact: { email?: string; phone?: string }) => void
  updateSettings: (settings: { theme?: string; language?: string; notifications?: boolean }) => void
}

// 或者合理分组（平衡扁平化和组织性）
interface OptimizedUserState {
  user: {
    // 基本个人信息
    name: string
    age: number
    gender: string
    email: string
    phone: string

    // 地址信息
    address: {
      street: string
      city: string
      country: string
    }

    // 设置（频繁变化的放在一起）
    settings: {
      theme: string
      language: string
      notifications: boolean
      showEmail: boolean
      showAge: boolean
    }
  }

  // Actions
  updateUser: (updates: Partial<OptimizedUserState['user']>) => void
  updateSettings: (settings: Partial<OptimizedUserState['user']['settings']>) => void
}

// ==================== 示例2：状态分割策略 ====================

// 创建分割的store（按业务域）

// 1. 用户认证store
interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const user = generateMockUser('logged-in-user')
      const token = 'mock-jwt-token'

      set({ user, token, loading: false })
      console.log('登录成功:', user.name)
    } catch (error) {
      set({ error: '登录失败', loading: false })
    }
  },

  logout: () => {
    set({ user: null, token: null })
    console.log('已登出')
  },

  updateProfile: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
    }))
  }
}))

// 2. 商品store（独立状态）
interface ProductState {
  products: Product[]
  selectedProduct: Product | null
  loading: boolean
  error: string | null

  loadProducts: () => Promise<void>
  selectProduct: (productId: string) => void
  updateProduct: (productId: string, updates: Partial<Product>) => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,

  loadProducts: async () => {
    set({ loading: true, error: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 800))

      const products = Array.from({ length: 100 }, (_, i) =>
        generateMockProduct(`product-${i + 1}`)
      )

      set({ products, loading: false })
    } catch (error) {
      set({ error: '加载商品失败', loading: false })
    }
  },

  selectProduct: (productId) => {
    set((state) => ({
      selectedProduct: state.products.find(p => p.id === productId) || null
    }))
  },

  updateProduct: (productId, updates) => {
    set((state) => ({
      products: state.products.map(product =>
        product.id === productId ? { ...product, ...updates } : product
      ),
      selectedProduct: state.selectedProduct?.id === productId
        ? { ...state.selectedProduct, ...updates }
        : state.selectedProduct
    }))
  }
}))

// 3. 购物车store（独立状态）
interface CartState {
  items: CartItem[]
  loading: boolean

  addItem: (product: Product, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find(item => item.productId === product.id)

      if (existingItem) {
        return {
          items: state.items.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          imageUrl: product.imageUrl,
          addedAt: new Date().toISOString()
        }
        return { items: [...state.items, newItem] }
      }
    })
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== itemId)
    }))
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }

    set((state) => ({
      items: state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }))
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
  }
}))

// 4. 订单store（独立状态）
interface OrderState {
  orders: Order[]
  loading: boolean
  error: string | null

  loadOrders: () => Promise<void>
  createOrder: (cartItems: CartItem[], shippingAddress: any, paymentMethod: string) => Promise<Order>
  cancelOrder: (orderId: string) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  loading: false,
  error: null,

  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 1200))

      // 模拟订单数据
      const orders = Array.from({ length: 20 }, (_, i) => {
        const orderId = `order-${Date.now()}-${i + 1}`
        return {
          id: orderId,
          userId: 'current-user',
          items: Array.from({ length: 3 }, (_, j) => ({
            productId: `product-${j + 1}`,
            name: `商品 ${j + 1}`,
            price: Math.floor(Math.random() * 1000) + 100,
            quantity: Math.floor(Math.random() * 3) + 1,
            imageUrl: `https://picsum.photos/100/100?random=${j + 1}`
          })),
          total: Math.floor(Math.random() * 5000) + 1000,
          subtotal: 0,
          shippingFee: 0,
          discount: 0,
          status: 'pending',
          shippingAddress: {
            street: '测试地址',
            city: '测试城市',
            country: '中国'
          },
          paymentMethod: '支付宝',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })

      set({ orders, loading: false })
    } catch (error) {
      set({ error: '加载订单失败', loading: false })
    }
  },

  createOrder: async (cartItems, shippingAddress, paymentMethod) => {
    set({ loading: true, error: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const order: Order = {
        id: `order-${Date.now()}`,
        userId: 'current-user',
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        subtotal: 0,
        shippingFee: 0,
        discount: 0,
        status: 'pending',
        shippingAddress,
        paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      set((state) => ({
        orders: [order, ...state.orders],
        loading: false
      }))

      return order
    } catch (error) {
      set({ error: '创建订单失败', loading: false })
      throw error
    }
  },

  cancelOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled', updatedAt: new Date().toISOString() }
          : order
      )
    }))
  }
}))

// ==================== 示例3：持久化性能优化 ====================

// 选择性持久化store
interface PersistedUserState {
  // 需要持久化的数据
  token: string | null
  preferences: {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
  }

  // 不需要持久化的数据（临时状态）
  loading: boolean
  error: string | null
  temporaryData: any

  // Actions
  setToken: (token: string | null) => void
  updatePreferences: (preferences: Partial<PersistedUserState['preferences']>) => void
  clearTemporaryData: () => void
}

export const usePersistedUserStore = create<PersistedUserState>()(
  persist(
    (set) => ({
      token: null,
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        notifications: true
      },
      loading: false,
      error: null,
      temporaryData: null,

      setToken: (token) => set({ token }),

      updatePreferences: (newPreferences) => set((state) => ({
        preferences: { ...state.preferences, ...newPreferences }
      })),

      clearTemporaryData: () => set({ temporaryData: null })
    }),
    {
      name: 'user-storage',
      // 只持久化token和preferences
      partialize: (state) => ({
        token: state.token,
        preferences: state.preferences
      }),
      storage: createJSONStorage(() => localStorage)
    }
  )
)

// 大数据量持久化store（使用indexedDB）
interface LargeDataState {
  largeList: LargeListItem[]
  loading: boolean
  lastUpdated: string | null

  loadLargeData: () => Promise<void>
  addItem: (item: Omit<LargeListItem, 'id'>) => void
  removeItem: (itemId: string) => void
  clearData: () => void
}

// 简单的indexedDB模拟（实际项目中应使用idb等库）
const createIndexedDBStorage = () => {
  return {
    getItem: async (key: string) => {
      await new Promise(resolve => setTimeout(resolve, 50))
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    },
    setItem: async (key: string, value: any) => {
      await new Promise(resolve => setTimeout(resolve, 100))
      localStorage.setItem(key, JSON.stringify(value))
    },
    removeItem: async (key: string) => {
      await new Promise(resolve => setTimeout(resolve, 50))
      localStorage.removeItem(key)
    }
  }
}

export const useLargeDataStore = create<LargeDataState>()(
  persist(
    (set, get) => ({
      largeList: [],
      loading: false,
      lastUpdated: null,

      loadLargeData: async () => {
        set({ loading: true })
        try {
          // 生成大量数据
          const largeList = generateLargeProductList(1000)

          set({
            largeList,
            loading: false,
            lastUpdated: new Date().toISOString()
          })

          console.log(`加载了${largeList.length}条大数据记录`)
        } catch (error) {
          set({ loading: false })
          console.error('加载大数据失败:', error)
        }
      },

      addItem: (itemData) => {
        const newItem: LargeListItem = {
          ...itemData,
          id: `item-${Date.now()}`
        }

        set((state) => ({
          largeList: [newItem, ...state.largeList],
          lastUpdated: new Date().toISOString()
        }))
      },

      removeItem: (itemId) => {
        set((state) => ({
          largeList: state.largeList.filter(item => item.id !== itemId),
          lastUpdated: new Date().toISOString()
        }))
      },

      clearData: () => {
        set({
          largeList: [],
          lastUpdated: new Date().toISOString()
        })
      }
    }),
    {
      name: 'large-data-storage',
      storage: createIndexedDBStorage(),
      // 对于大数据，可以设置版本迁移
      version: 1,
      migrate: (persistedState, version) => {
        console.log(`迁移持久化数据从版本 ${version} 到 1`)
        return persistedState
      }
    }
  )
)

// ==================== 示例4：防抖和节流优化 ====================

// 搜索store（使用防抖）
interface SearchState {
  query: string
  results: Product[]
  loading: boolean
  searchHistory: string[]

  // 防抖搜索
  debouncedSearch: (query: string) => void
  // 节流搜索
  throttledSearch: (query: string) => void
  // 立即搜索
  immediateSearch: (query: string) => Promise<void>
  clearSearch: () => void
}

export const useSearchStore = create<SearchState>((set, get) => {
  // 创建防抖函数
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      set({ results: [], loading: false })
      return
    }

    set({ loading: true })
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模拟搜索结果
      const allProducts = Array.from({ length: 1000 }, (_, i) =>
        generateMockProduct(`product-${i + 1}`)
      )

      const results = allProducts
        .filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 20) // 只返回前20个结果

      set({
        results,
        loading: false,
        searchHistory: [query, ...get().searchHistory.slice(0, 9)]
      })

      console.log(`防抖搜索完成: "${query}"，找到${results.length}个结果`)
    } catch (error) {
      set({ loading: false })
      console.error('搜索失败:', error)
    }
  }, 300)

  // 创建节流函数
  const throttledSearch = throttle(async (query: string) => {
    if (!query.trim()) {
      set({ results: [], loading: false })
      return
    }

    set({ loading: true })
    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const allProducts = Array.from({ length: 500 }, (_, i) =>
        generateMockProduct(`product-${i + 1}`)
      )

      const results = allProducts
        .filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10)

      set({
        results,
        loading: false
      })

      console.log(`节流搜索完成: "${query}"，找到${results.length}个结果`)
    } catch (error) {
      set({ loading: false })
    }
  }, 1000)

  return {
    query: '',
    results: [],
    loading: false,
    searchHistory: [],

    debouncedSearch: (query: string) => {
      set({ query })
      debouncedSearch(query)
    },

    throttledSearch: (query: string) => {
      set({ query })
      throttledSearch(query)
    },

    immediateSearch: async (query: string) => {
      set({ query, loading: true })
      try {
        await new Promise(resolve => setTimeout(resolve, 800))

        const allProducts = Array.from({ length: 2000 }, (_, i) =>
          generateMockProduct(`product-${i + 1}`)
        )

        const results = allProducts
          .filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.categoryName.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 50)

        set({
          results,
          loading: false,
          searchHistory: [query, ...get().searchHistory.slice(0, 9)]
        })

        console.log(`立即搜索完成: "${query}"，找到${results.length}个结果`)
      } catch (error) {
        set({ loading: false })
      }
    },

    clearSearch: () => {
      set({ query: '', results: [], loading: false })
      debouncedSearch.cancel()
      throttledSearch.cancel()
    }
  }
})

// ==================== 示例5：批量更新优化 ====================

// 批量更新store
interface BatchUpdateState {
  items: Array<{ id: string; value: number; updated: boolean }>
  updates: BatchUpdate<any>[]
  batchSize: number
  enabled: boolean

  // 单个更新（性能差）
  updateItemIndividually: (id: string, value: number) => void

  // 批量更新（性能好）
  updateItemsInBatch: (updates: Array<{ id: string; value: number }>) => void

  // 使用函数更新
  updateWithFunction: () => void

  // 重置状态
  resetItems: () => void

  // 切换批量模式
  toggleBatchMode: () => void
}

export const useBatchUpdateStore = create<BatchUpdateState>((set, get) => {
  // 初始化1000个项
  const initialItems = Array.from({ length: 1000 }, (_, i) => ({
    id: `item-${i + 1}`,
    value: i,
    updated: false
  }))

  return {
    items: initialItems,
    updates: [],
    batchSize: 100,
    enabled: true,

    updateItemIndividually: (id, value) => {
      if (!get().enabled) {
        console.warn('批量更新已禁用，使用批量更新以获得更好性能')
      }

      set((state) => ({
        items: state.items.map(item =>
          item.id === id ? { ...item, value, updated: true } : item
        ),
        updates: [
          ...state.updates,
          {
            type: 'set',
            path: `items.${state.items.findIndex(item => item.id === id)}.value`,
            value,
            timestamp: Date.now()
          }
        ]
      }))
    },

    updateItemsInBatch: (updates) => {
      const updateMap = new Map(updates.map(u => [u.id, u.value]))

      set((state) => ({
        items: state.items.map(item => {
          const newValue = updateMap.get(item.id)
          return newValue !== undefined
            ? { ...item, value: newValue, updated: true }
            : item
        }),
        updates: [
          ...state.updates,
          {
            type: 'batch',
            path: 'items',
            value: updates,
            timestamp: Date.now()
          }
        ]
      }))

      console.log(`批量更新了${updates.length}个项`)
    },

    updateWithFunction: () => {
      set((state) => {
        const updatedItems = state.items.map((item, index) => ({
          ...item,
          value: item.value + 1,
          updated: index % 2 === 0 // 每两个更新一个
        }))

        return {
          items: updatedItems,
          updates: [
            ...state.updates,
            {
              type: 'function',
              path: 'items',
              value: 'increment',
              timestamp: Date.now()
            }
          ]
        }
      })
    },

    resetItems: () => {
      set({
        items: initialItems,
        updates: []
      })
    },

    toggleBatchMode: () => {
      set((state) => ({ enabled: !state.enabled }))
    }
  }
})

// ==================== 状态优化管理器 ====================

export const useStateOptimizationManager = () => {
  return {
    // 分割的store
    auth: useAuthStore,
    products: useProductStore,
    cart: useCartStore,
    orders: useOrderStore,

    // 持久化store
    persistedUser: usePersistedUserStore,
    largeData: useLargeDataStore,

    // 优化store
    search: useSearchStore,
    batchUpdate: useBatchUpdateStore,

    // 性能测试
    runOptimizationTests: async () => {
      console.log('🚀 开始状态优化性能测试...')

      // 测试1：批量更新 vs 单个更新
      const batchStore = useBatchUpdateStore
      console.time('单个更新100个项')
      for (let i = 0; i < 100; i++) {
        batchStore.getState().updateItemIndividually(`item-${i + 1}`, i + 100)
      }
      console.timeEnd('单个更新100个项')

      console.time('批量更新100个项')
      const updates = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i + 1}`,
        value: i + 200
      }))
      batchStore.getState().updateItemsInBatch(updates)
      console.timeEnd('批量更新100个项')

      // 测试2：防抖搜索
      const searchStore = useSearchStore
      console.time('连续输入搜索（防抖）')
      for (let i = 0; i < 10; i++) {
        searchStore.getState().debouncedSearch(`test ${i}`)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      console.timeEnd('连续输入搜索（防抖）')

      // 等待防抖完成
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('✅ 状态优化性能测试完成')
    }
  }
}