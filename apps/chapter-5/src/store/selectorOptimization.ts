// 第5章：Zustand性能优化实战 - 选择器优化
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import { createSelector } from 'reselect'
import { Product, User, FilterState, PaginationState, SelectorMetrics, PerformanceConfig } from './types'
import { generateMockUser, generateMockProduct, dataGenerator } from './mockData'

// ==================== 示例1：基础选择器优化 ====================

// 创建包含大量数据的用户store
interface UserStoreState {
  users: User[]
  currentUser: User | null
  selectedUserId: string | null
  loading: boolean
  error: string | null

  // Actions
  loadUsers: () => Promise<void>
  selectUser: (userId: string) => void
  updateUser: (userId: string, updates: Partial<User>) => void
  addUser: (user: Omit<User, 'id'>) => void
  removeUser: (userId: string) => void
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  users: [],
  currentUser: null,
  selectedUserId: null,
  loading: false,
  error: null,

  loadUsers: async () => {
    set({ loading: true, error: null })
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 生成大量用户数据
      const users = Array.from({ length: 1000 }, (_, i) =>
        generateMockUser(`user-${i + 1}`)
      )

      set({ users, loading: false })
      console.log(`加载了${users.length}个用户`)
    } catch (error) {
      set({ error: '加载用户失败', loading: false })
    }
  },

  selectUser: (userId) => {
    const user = get().users.find(u => u.id === userId)
    set({ selectedUserId: userId, currentUser: user || null })
  },

  updateUser: (userId, updates) => {
    set((state) => ({
      users: state.users.map(user =>
        user.id === userId ? { ...user, ...updates } : user
      ),
      currentUser: state.currentUser?.id === userId
        ? { ...state.currentUser, ...updates }
        : state.currentUser
    }))
  },

  addUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`
    }
    set((state) => ({ users: [newUser, ...state.users] }))
  },

  removeUser: (userId) => {
    set((state) => ({
      users: state.users.filter(user => user.id !== userId),
      currentUser: state.currentUser?.id === userId ? null : state.currentUser,
      selectedUserId: state.selectedUserId === userId ? null : state.selectedUserId
    }))
  }
}))

// ==================== 示例2：reselect记忆化选择器 ====================

// 创建商品store
interface ProductStoreState {
  products: Product[]
  filteredProducts: Product[]
  filters: FilterState
  pagination: PaginationState
  loading: boolean
  error: string | null

  // Actions
  loadProducts: () => Promise<void>
  setFilters: (filters: Partial<FilterState>) => void
  setPage: (page: number) => void
  searchProducts: (query: string) => void
  resetFilters: () => void
}

export const useProductStore = create<ProductStoreState>((set, get) => ({
  products: [],
  filteredProducts: [],
  filters: {
    searchQuery: '',
    categories: [],
    priceRange: [0, 10000],
    sortBy: 'name',
    sortOrder: 'asc',
    inStock: false
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  },
  loading: false,
  error: null,

  loadProducts: async () => {
    set({ loading: true, error: null })
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 生成大量商品数据
      const products = Array.from({ length: 5000 }, (_, i) =>
        generateMockProduct(`product-${i + 1}`)
      )

      set({
        products,
        loading: false
      })

      // 应用当前过滤器
      get().applyFilters()

      console.log(`加载了${products.length}个商品`)
    } catch (error) {
      set({ error: '加载商品失败', loading: false })
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }
    }), false, () => {
      // 在状态更新后应用过滤器
      get().applyFilters()
    })
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page }
    }), false, () => {
      get().applyFilters()
    })
  },

  searchProducts: (query) => {
    get().setFilters({ searchQuery: query })
  },

  resetFilters: () => {
    set({
      filters: {
        searchQuery: '',
        categories: [],
        priceRange: [0, 10000],
        sortBy: 'name',
        sortOrder: 'asc',
        inStock: false
      },
      pagination: { ...get().pagination, page: 1 }
    }, false, () => {
      get().applyFilters()
    })
  },

  // 私有方法：应用过滤器
  applyFilters: () => {
    const { products, filters, pagination } = get()

    console.time('applyFilters')

    // 1. 过滤
    let filtered = products

    if (filters.searchQuery) {
      filtered = dataGenerator.searchData(filtered, filters.searchQuery, ['name', 'description', 'categoryName'])
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        filters.categories.includes(product.categoryId)
      )
    }

    if (filters.priceRange) {
      filtered = filtered.filter(product =>
        product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1]
      )
    }

    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0)
    }

    // 2. 排序
    filtered = dataGenerator.sortData(filtered, filters.sortBy, filters.sortOrder)

    // 3. 分页
    const paginated = dataGenerator.getPaginatedData(filtered, pagination.page, pagination.pageSize)

    console.timeEnd('applyFilters')

    set({
      filteredProducts: paginated.items,
      pagination: {
        ...pagination,
        total: filtered.length,
        totalPages: paginated.totalPages,
        hasNext: paginated.hasNext,
        hasPrev: paginated.hasPrev
      }
    })
  }
}))

// 使用reselect创建记忆化选择器
export const createProductSelectors = () => {
  // 基础选择器
  const selectProducts = (state: ProductStoreState) => state.products
  const selectFilters = (state: ProductStoreState) => state.filters

  // 记忆化选择器：过滤后的商品
  const selectFilteredProducts = createSelector(
    [selectProducts, selectFilters],
    (products, filters) => {
      console.time('selectFilteredProducts (reselect)')

      let filtered = products

      if (filters.searchQuery) {
        filtered = dataGenerator.searchData(filtered, filters.searchQuery, ['name', 'description', 'categoryName'])
      }

      if (filters.categories.length > 0) {
        filtered = filtered.filter(product =>
          filters.categories.includes(product.categoryId)
        )
      }

      if (filters.priceRange) {
        filtered = filtered.filter(product =>
          product.price >= filters.priceRange[0] &&
          product.price <= filters.priceRange[1]
        )
      }

      if (filters.inStock) {
        filtered = filtered.filter(product => product.stock > 0)
      }

      console.timeEnd('selectFilteredProducts (reselect)')
      return filtered
    }
  )

  // 记忆化选择器：排序后的商品
  const selectSortedProducts = createSelector(
    [selectFilteredProducts, selectFilters],
    (filteredProducts, filters) => {
      return dataGenerator.sortData(filteredProducts, filters.sortBy, filters.sortOrder)
    }
  )

  // 记忆化选择器：分页商品
  const selectPaginatedProducts = createSelector(
    [selectSortedProducts, (state: ProductStoreState) => state.pagination],
    (sortedProducts, pagination) => {
      return dataGenerator.getPaginatedData(sortedProducts, pagination.page, pagination.pageSize)
    }
  )

  return {
    selectProducts,
    selectFilters,
    selectFilteredProducts,
    selectSortedProducts,
    selectPaginatedProducts
  }
}

// ==================== 示例3：useShallow优化 ====================

// 创建复杂状态store
interface ComplexState {
  user: User | null
  products: Product[]
  cart: Array<{ id: string; name: string; price: number; quantity: number }>
  notifications: Array<{ id: string; type: string; message: string }>
  ui: {
    theme: 'light' | 'dark'
    sidebarOpen: boolean
    modalOpen: boolean
    loading: boolean
  }

  // Actions
  updateUser: (user: User) => void
  addToCart: (item: { id: string; name: string; price: number }) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  showModal: () => void
  hideModal: () => void
  addNotification: (type: string, message: string) => void
}

export const useComplexStore = create<ComplexState>((set) => ({
  user: generateMockUser('current-user'),
  products: Array.from({ length: 100 }, (_, i) => generateMockProduct(`product-${i + 1}`)),
  cart: [],
  notifications: [],
  ui: {
    theme: 'light',
    sidebarOpen: false,
    modalOpen: false,
    loading: false
  },

  updateUser: (user) => set({ user }),

  addToCart: (item) => set((state) => ({
    cart: [...state.cart, { ...item, quantity: 1 }]
  })),

  toggleTheme: () => set((state) => ({
    ui: { ...state.ui, theme: state.ui.theme === 'light' ? 'dark' : 'light' }
  })),

  toggleSidebar: () => set((state) => ({
    ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
  })),

  showModal: () => set((state) => ({
    ui: { ...state.ui, modalOpen: true }
  })),

  hideModal: () => set((state) => ({
    ui: { ...state.ui, modalOpen: false }
  })),

  addNotification: (type, message) => set((state) => ({
    notifications: [
      { id: `notif-${Date.now()}`, type, message },
      ...state.notifications.slice(0, 9) // 只保留最近10条
    ]
  }))
}))

// ==================== 示例4：性能监控选择器 ====================

// 选择器性能监控工具
export const createProfiledSelector = <T, R>(
  selectorName: string,
  selector: (state: T) => R,
  warnThreshold: number = 16 // 16ms = 一帧时间(60fps)
) => {
  let executionCount = 0
  let totalTime = 0

  return (state: T): R => {
    const start = performance.now()
    const result = selector(state)
    const end = performance.now()
    const executionTime = end - start

    executionCount++
    totalTime += executionTime

    if (executionTime > warnThreshold) {
      console.warn(
        `⚠️ 选择器 "${selectorName}" 执行时间过长: ${executionTime.toFixed(2)}ms\n` +
        `总计执行: ${executionCount}次, 平均时间: ${(totalTime / executionCount).toFixed(2)}ms`
      )
    }

    return result
  }
}

// 性能监控store
interface PerformanceStoreState {
  metrics: SelectorMetrics[]
  config: PerformanceConfig

  // Actions
  addMetric: (metric: Omit<SelectorMetrics, 'lastExecution'>) => void
  clearMetrics: () => void
  updateConfig: (config: Partial<PerformanceConfig>) => void
}

export const usePerformanceStore = create<PerformanceStoreState>((set) => ({
  metrics: [],
  config: {
    enableProfiling: true,
    logRenderMetrics: true,
    logSelectorMetrics: true,
    warnOnSlowRender: 16,
    warnOnSlowSelector: 10,
    batchUpdates: true,
    enableVirtualization: true,
    enableDebouncing: true,
    debounceDelay: 300
  },

  addMetric: (metric) => set((state) => ({
    metrics: [
      {
        ...metric,
        lastExecution: new Date().toISOString()
      },
      ...state.metrics.slice(0, 49) // 只保留最近50条
    ]
  })),

  clearMetrics: () => set({ metrics: [] }),

  updateConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  }))
}))

// ==================== 示例5：选择器组合模式 ====================

// 组合多个选择器的hook
export const useOptimizedSelectors = () => {
  // 使用useShallow避免不必要的重渲染
  const user = useUserStore(useShallow((state) => ({
    currentUser: state.currentUser,
    selectedUserId: state.selectedUserId
  })))

  // 使用记忆化选择器
  const productSelectors = createProductSelectors()
  const { items: paginatedProducts } = useProductStore(productSelectors.selectPaginatedProducts, shallow)

  // 复杂store的选择器优化
  const uiState = useComplexStore(useShallow((state) => ({
    theme: state.ui.theme,
    sidebarOpen: state.ui.sidebarOpen,
    modalOpen: state.ui.modalOpen
  })))

  const cartSummary = useComplexStore((state) => {
    // 计算购物车总价 - 使用useMemo避免每次重新计算
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0)

    return {
      itemCount,
      total,
      isEmpty: state.cart.length === 0
    }
  })

  // 性能监控
  const performance = usePerformanceStore((state) => ({
    metrics: state.metrics,
    config: state.config
  }))

  return {
    user,
    products: paginatedProducts,
    ui: uiState,
    cart: cartSummary,
    performance
  }
}

// ==================== 性能优化演示hook ====================

export const usePerformanceDemo = () => {
  const userStore = useUserStore
  const productStore = useProductStore
  const complexStore = useComplexStore
  const performanceStore = usePerformanceStore

  // 演示不同的选择器使用方式
  const demoSelectors = {
    // 错误方式：直接解构整个store
    badPractice: () => {
      const state = userStore()
      return {
        user: state.currentUser,
        loading: state.loading,
        error: state.error,
        users: state.users // 不需要但订阅了
      }
    },

    // 改进方式：使用多个选择器
    betterPractice: () => {
      const user = userStore((state) => state.currentUser)
      const loading = userStore((state) => state.loading)
      const error = userStore((state) => state.error)

      return { user, loading, error }
    },

    // 最佳方式：使用组合选择器
    bestPractice: () => {
      return userStore(useShallow((state) => ({
        user: state.currentUser,
        loading: state.loading,
        error: state.error
      })))
    }
  }

  // 性能测试：对比不同选择器的性能
  const runPerformanceTest = async () => {
    console.log('🚀 开始选择器性能测试...')

    // 加载测试数据
    await userStore.getState().loadUsers()
    await productStore.getState().loadProducts()

    // 测试1：基础选择器性能
    console.time('基础选择器测试')
    for (let i = 0; i < 1000; i++) {
      demoSelectors.badPractice()
    }
    console.timeEnd('基础选择器测试')

    // 测试2：优化选择器性能
    console.time('优化选择器测试')
    for (let i = 0; i < 1000; i++) {
      demoSelectors.betterPractice()
    }
    console.timeEnd('优化选择器测试')

    // 测试3：最佳实践性能
    console.time('最佳实践测试')
    for (let i = 0; i < 1000; i++) {
      demoSelectors.bestPractice()
    }
    console.timeEnd('最佳实践测试')

    console.log('✅ 选择器性能测试完成')
  }

  return {
    demoSelectors,
    runPerformanceTest,

    // store状态
    userStore,
    productStore,
    complexStore,
    performanceStore,

    // 工具函数
    createProfiledSelector
  }
}