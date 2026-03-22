// 第5章：Zustand性能优化实战 - 大型列表性能优化
import { create } from 'zustand'
import { LargeListItem, VirtualScrollState, FilterState, PaginationState, PerformanceConfig } from './types'
import { generateLargeProductList, dataGenerator } from './mockData'

// ==================== 示例1：虚拟滚动store ====================

interface VirtualScrollStoreState {
  // 原始数据
  allItems: LargeListItem[]
  totalCount: number

  // 虚拟滚动状态
  virtualScroll: VirtualScrollState
  visibleItems: LargeListItem[]

  // 过滤和排序
  filters: FilterState
  filteredItems: LargeListItem[]

  // 加载状态
  loading: boolean
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  setVisibleRange: (start: number, end: number) => void
  updateFilters: (filters: Partial<FilterState>) => void
  searchItems: (query: string) => void
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
}

export const useVirtualScrollStore = create<VirtualScrollStoreState>((set, get) => {
  const initialVirtualScroll: VirtualScrollState = {
    visibleStart: 0,
    visibleEnd: 50,
    itemHeight: 60,
    totalHeight: 0,
    overscan: 10
  }

  const initialFilters: FilterState = {
    searchQuery: '',
    categories: [],
    priceRange: [0, 10000],
    sortBy: 'name',
    sortOrder: 'asc',
    inStock: false
  }

  return {
    allItems: [],
    totalCount: 0,

    virtualScroll: initialVirtualScroll,
    visibleItems: [],

    filters: initialFilters,
    filteredItems: [],

    loading: false,
    initialized: false,

    initialize: async () => {
      if (get().initialized) return

      set({ loading: true })
      try {
        console.time('初始化大型数据')
        // 生成大量数据（实际项目中从API加载）
        const allItems = generateLargeProductList(10000)
        console.timeEnd('初始化大型数据')

        const totalCount = allItems.length
        const totalHeight = totalCount * initialVirtualScroll.itemHeight

        set({
          allItems,
          totalCount,
          virtualScroll: { ...initialVirtualScroll, totalHeight },
          filteredItems: allItems,
          visibleItems: allItems.slice(0, initialVirtualScroll.visibleEnd),
          initialized: true,
          loading: false
        })

        console.log(`初始化完成: ${totalCount}个项，总高度: ${totalHeight}px`)
      } catch (error) {
        set({ loading: false })
        console.error('初始化失败:', error)
      }
    },

    setVisibleRange: (start, end) => {
      const { filteredItems, virtualScroll } = get()

      // 计算实际可见项（考虑overscan）
      const overscanStart = Math.max(0, start - virtualScroll.overscan)
      const overscanEnd = Math.min(filteredItems.length, end + virtualScroll.overscan)

      const visibleItems = filteredItems.slice(overscanStart, overscanEnd)

      set({
        virtualScroll: {
          ...virtualScroll,
          visibleStart: start,
          visibleEnd: end
        },
        visibleItems
      })

      console.log(`更新可见范围: ${start}-${end}，实际渲染: ${overscanStart}-${overscanEnd} (${visibleItems.length}个项)`)
    },

    updateFilters: (newFilters) => {
      const { allItems, virtualScroll } = get()
      const filters = { ...get().filters, ...newFilters }

      console.time('应用过滤器')

      // 应用过滤器
      let filtered = allItems

      // 搜索过滤
      if (filters.searchQuery) {
        filtered = dataGenerator.searchData(filtered, filters.searchQuery, ['name', 'description', 'category'])
      }

      // 分类过滤
      if (filters.categories.length > 0) {
        filtered = filtered.filter(item =>
          filters.categories.includes(item.category)
        )
      }

      // 价格范围过滤
      filtered = filtered.filter(item =>
        item.price >= filters.priceRange[0] &&
        item.price <= filters.priceRange[1]
      )

      // 库存过滤
      if (filters.inStock) {
        filtered = filtered.filter(item => item.stock > 0)
      }

      // 排序
      filtered = dataGenerator.sortData(filtered, filters.sortBy, filters.sortOrder)

      console.timeEnd('应用过滤器')

      const totalHeight = filtered.length * virtualScroll.itemHeight

      set({
        filters,
        filteredItems: filtered,
        virtualScroll: {
          ...virtualScroll,
          totalHeight,
          visibleStart: 0,
          visibleEnd: Math.min(50, filtered.length)
        },
        visibleItems: filtered.slice(0, Math.min(50, filtered.length))
      })

      console.log(`过滤后: ${filtered.length}个项 (原: ${allItems.length})`)
    },

    searchItems: (query) => {
      get().updateFilters({ searchQuery: query })
    },

    loadMore: async () => {
      const { allItems, totalCount } = get()
      const currentCount = allItems.length

      if (currentCount >= totalCount) {
        console.log('已加载所有数据')
        return
      }

      set({ loading: true })
      try {
        // 模拟加载更多数据
        await new Promise(resolve => setTimeout(resolve, 800))

        const newItems = generateLargeProductList(1000)
        const updatedItems = [...allItems, ...newItems]

        set({
          allItems: updatedItems,
          loading: false
        })

        // 重新应用当前过滤器
        get().updateFilters(get().filters)

        console.log(`加载了${newItems.length}个新项，总计: ${updatedItems.length}`)
      } catch (error) {
        set({ loading: false })
        console.error('加载更多失败:', error)
      }
    },

    refresh: async () => {
      set({ loading: true })
      try {
        await new Promise(resolve => setTimeout(resolve, 1200))

        const allItems = generateLargeProductList(10000)
        const totalHeight = allItems.length * initialVirtualScroll.itemHeight

        set({
          allItems,
          totalCount: allItems.length,
          virtualScroll: { ...initialVirtualScroll, totalHeight },
          filters: initialFilters,
          filteredItems: allItems,
          visibleItems: allItems.slice(0, initialVirtualScroll.visibleEnd),
          loading: false
        })

        console.log(`刷新完成: ${allItems.length}个项`)
      } catch (error) {
        set({ loading: false })
      }
    },

    reset: () => {
      set({
        virtualScroll: initialVirtualScroll,
        filters: initialFilters,
        visibleItems: [],
        filteredItems: [],
        loading: false
      })
    }
  }
})

// ==================== 示例2：分页加载store ====================

interface PaginatedListStoreState {
  // 分页数据
  items: LargeListItem[]
  pagination: PaginationState

  // 过滤状态
  filters: FilterState
  loading: boolean
  error: string | null

  // Actions
  loadPage: (page: number) => Promise<void>
  loadNextPage: () => Promise<void>
  loadPrevPage: () => Promise<void>
  updateFilters: (filters: Partial<FilterState>) => void
  search: (query: string) => Promise<void>
  refresh: () => Promise<void>
}

export const usePaginatedListStore = create<PaginatedListStoreState>((set, get) => {
  const initialPagination: PaginationState = {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  }

  const initialFilters: FilterState = {
    searchQuery: '',
    categories: [],
    priceRange: [0, 10000],
    sortBy: 'name',
    sortOrder: 'asc',
    inStock: false
  }

  // 模拟数据库（实际项目中是API）
  let allData: LargeListItem[] = []

  const fetchDataFromSource = async (filters: FilterState, page: number, pageSize: number) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 600))

    if (allData.length === 0) {
      allData = generateLargeProductList(5000)
    }

    // 应用过滤器
    let filtered = allData

    if (filters.searchQuery) {
      filtered = dataGenerator.searchData(filtered, filters.searchQuery, ['name', 'description', 'category'])
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(item =>
        filters.categories.includes(item.category)
      )
    }

    if (filters.priceRange) {
      filtered = filtered.filter(item =>
        item.price >= filters.priceRange[0] &&
        item.price <= filters.priceRange[1]
      )
    }

    if (filters.inStock) {
      filtered = filtered.filter(item => item.stock > 0)
    }

    // 排序
    filtered = dataGenerator.sortData(filtered, filters.sortBy, filters.sortOrder)

    // 分页
    return dataGenerator.getPaginatedData(filtered, page, pageSize)
  }

  return {
    items: [],
    pagination: initialPagination,
    filters: initialFilters,
    loading: false,
    error: null,

    loadPage: async (page: number) => {
      set({ loading: true, error: null })
      try {
        const { filters, pagination } = get()
        const result = await fetchDataFromSource(filters, page, pagination.pageSize)

        set({
          items: result.items,
          pagination: {
            ...pagination,
            page: result.page,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          },
          loading: false
        })

        console.log(`加载第${page}页，共${result.items.length}个项，总计${result.total}个`)
      } catch (error) {
        set({ error: '加载失败', loading: false })
        console.error('加载页面失败:', error)
      }
    },

    loadNextPage: async () => {
      const { pagination } = get()
      if (pagination.hasNext) {
        await get().loadPage(pagination.page + 1)
      }
    },

    loadPrevPage: async () => {
      const { pagination } = get()
      if (pagination.hasPrev) {
        await get().loadPage(pagination.page - 1)
      }
    },

    updateFilters: async (newFilters) => {
      const filters = { ...get().filters, ...newFilters }
      set({ filters })

      // 过滤后重新加载第一页
      await get().loadPage(1)
    },

    search: async (query: string) => {
      await get().updateFilters({ searchQuery: query })
    },

    refresh: async () => {
      // 清空缓存数据
      allData = []
      set({ filters: initialFilters })
      await get().loadPage(1)
    }
  }
})

// ==================== 示例3：Web Worker处理 ====================

// 简单的Web Worker模拟（实际项目中应使用真正的Web Worker）
const createMockWorker = () => {
  return {
    postMessage: (data: any) => {
      console.log('Web Worker收到消息:', data)

      // 模拟处理时间
      setTimeout(() => {
        if (data.type === 'filter') {
          const result = {
            type: 'filterResult',
            payload: {
              items: data.payload.items.filter((item: LargeListItem) =>
                item.name.toLowerCase().includes(data.payload.query.toLowerCase())
              ),
              query: data.payload.query
            }
          }
          console.log('Web Worker返回结果:', result)
        }
      }, 300)
    }
  }
}

interface WorkerStoreState {
  items: LargeListItem[]
  filteredItems: LargeListItem[]
  loading: boolean
  worker: any

  // Actions
  initialize: () => Promise<void>
  filterWithWorker: (query: string) => void
  heavyComputation: () => Promise<void>
}

export const useWorkerStore = create<WorkerStoreState>((set, get) => ({
  items: [],
  filteredItems: [],
  loading: false,
  worker: null,

  initialize: async () => {
    set({ loading: true })
    try {
      const items = generateLargeProductList(5000)
      set({
        items,
        filteredItems: items,
        worker: createMockWorker(),
        loading: false
      })
      console.log(`初始化Web Worker数据: ${items.length}个项`)
    } catch (error) {
      set({ loading: false })
    }
  },

  filterWithWorker: (query: string) => {
    const { items, worker } = get()
    if (!worker) return

    set({ loading: true })

    // 发送到Web Worker处理
    worker.postMessage({
      type: 'filter',
      payload: {
        items,
        query
      }
    })

    // 模拟Worker返回结果
    setTimeout(() => {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 100)

      set({
        filteredItems: filtered,
        loading: false
      })

      console.log(`Web Worker过滤完成: "${query}"，找到${filtered.length}个结果`)
    }, 500)
  },

  heavyComputation: async () => {
    set({ loading: true })
    try {
      console.time('繁重计算')

      // 模拟繁重计算
      const items = get().items
      const computed = items.map(item => ({
        ...item,
        computedValue: Math.sqrt(item.price) * Math.log(item.rating + 1),
        processed: true
      }))

      // 模拟计算时间
      await new Promise(resolve => setTimeout(resolve, 1500))

      set({
        items: computed,
        loading: false
      })

      console.timeEnd('繁重计算')
      console.log(`完成繁重计算: ${computed.length}个项`)
    } catch (error) {
      set({ loading: false })
    }
  }
}))

// ==================== 示例4：性能监控和调优 ====================

interface PerformanceMonitorState {
  // 性能指标
  renderTimes: number[]
  selectorTimes: number[]
  memoryUsage: number[]
  networkLatency: number[]

  // 配置
  config: PerformanceConfig
  enabled: boolean

  // Actions
  startMonitoring: () => void
  stopMonitoring: () => void
  addRenderTime: (time: number) => void
  addSelectorTime: (time: number) => void
  updateConfig: (config: Partial<PerformanceConfig>) => void
  clearMetrics: () => void
  generateReport: () => PerformanceReport
}

interface PerformanceReport {
  averageRenderTime: number
  averageSelectorTime: number
  maxRenderTime: number
  maxSelectorTime: number
  renderCount: number
  selectorCount: number
  recommendations: string[]
}

export const usePerformanceMonitorStore = create<PerformanceMonitorState>((set, get) => ({
  renderTimes: [],
  selectorTimes: [],
  memoryUsage: [],
  networkLatency: [],

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
  enabled: false,

  startMonitoring: () => {
    set({ enabled: true })
    console.log('🔍 开始性能监控')
  },

  stopMonitoring: () => {
    set({ enabled: false })
    console.log('⏹️ 停止性能监控')
  },

  addRenderTime: (time: number) => {
    const { enabled, config } = get()
    if (!enabled) return

    set((state) => ({
      renderTimes: [...state.renderTimes.slice(-99), time] // 保留最近100个
    }))

    if (config.logRenderMetrics && time > config.warnOnSlowRender) {
      console.warn(`⚠️ 渲染时间过长: ${time.toFixed(2)}ms (阈值: ${config.warnOnSlowRender}ms)`)
    }
  },

  addSelectorTime: (time: number) => {
    const { enabled, config } = get()
    if (!enabled) return

    set((state) => ({
      selectorTimes: [...state.selectorTimes.slice(-99), time]
    }))

    if (config.logSelectorMetrics && time > config.warnOnSlowSelector) {
      console.warn(`⚠️ 选择器执行时间过长: ${time.toFixed(2)}ms (阈值: ${config.warnOnSlowSelector}ms)`)
    }
  },

  updateConfig: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig }
    }))
    console.log('更新性能监控配置:', newConfig)
  },

  clearMetrics: () => {
    set({
      renderTimes: [],
      selectorTimes: [],
      memoryUsage: [],
      networkLatency: []
    })
    console.log('已清除所有性能指标')
  },

  generateReport: () => {
    const { renderTimes, selectorTimes, config } = get()

    const averageRenderTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      : 0

    const averageSelectorTime = selectorTimes.length > 0
      ? selectorTimes.reduce((sum, time) => sum + time, 0) / selectorTimes.length
      : 0

    const maxRenderTime = renderTimes.length > 0 ? Math.max(...renderTimes) : 0
    const maxSelectorTime = selectorTimes.length > 0 ? Math.max(...selectorTimes) : 0

    // 生成优化建议
    const recommendations: string[] = []

    if (averageRenderTime > config.warnOnSlowRender) {
      recommendations.push('考虑使用React.memo()优化组件渲染')
      recommendations.push('检查是否有不必要的重渲染')
      recommendations.push('使用useShallow避免zustand store的深度比较')
    }

    if (averageSelectorTime > config.warnOnSlowSelector) {
      recommendations.push('使用reselect创建记忆化选择器')
      recommendations.push('考虑将繁重计算移到Web Worker')
      recommendations.push('优化选择器依赖项，避免不必要的重新计算')
    }

    if (renderTimes.length > 100) {
      recommendations.push('大量渲染可能表明存在性能问题，考虑虚拟滚动')
    }

    return {
      averageRenderTime,
      averageSelectorTime,
      maxRenderTime,
      maxSelectorTime,
      renderCount: renderTimes.length,
      selectorCount: selectorTimes.length,
      recommendations
    }
  }
}))

// ==================== 大型列表优化管理器 ====================

export const useLargeListOptimizationManager = () => {
  const virtualScrollStore = useVirtualScrollStore
  const paginatedListStore = usePaginatedListStore
  const workerStore = useWorkerStore
  const performanceMonitorStore = usePerformanceMonitorStore

  return {
    // store实例
    virtualScroll: virtualScrollStore,
    paginatedList: paginatedListStore,
    worker: workerStore,
    performanceMonitor: performanceMonitorStore,

    // 初始化所有store
    initializeAll: async () => {
      console.log('🚀 初始化大型列表优化示例...')

      await virtualScrollStore.getState().initialize()
      await paginatedListStore.getState().loadPage(1)
      await workerStore.getState().initialize()

      performanceMonitorStore.getState().startMonitoring()

      console.log('✅ 大型列表优化示例初始化完成')
    },

    // 运行性能测试
    runPerformanceTests: async () => {
      console.log('🧪 开始大型列表性能测试...')

      // 测试1：虚拟滚动性能
      console.time('虚拟滚动过滤测试')
      virtualScrollStore.getState().updateFilters({ searchQuery: '商品' })
      console.timeEnd('虚拟滚动过滤测试')

      // 测试2：分页加载性能
      console.time('分页加载测试')
      await paginatedListStore.getState().loadPage(2)
      console.timeEnd('分页加载测试')

      // 测试3：Web Worker性能
      console.time('Web Worker过滤测试')
      workerStore.getState().filterWithWorker('测试')
      console.timeEnd('Web Worker过滤测试')

      // 等待Worker完成
      await new Promise(resolve => setTimeout(resolve, 600))

      // 生成性能报告
      const report = performanceMonitorStore.getState().generateReport()
      console.log('📊 性能报告:', report)

      console.log('✅ 大型列表性能测试完成')
    },

    // 获取性能建议
    getOptimizationSuggestions: () => {
      const config = performanceMonitorStore.getState().config
      const suggestions = []

      if (config.enableVirtualization) {
        suggestions.push('✅ 已启用虚拟滚动：适合显示大量数据')
      }

      if (config.enableDebouncing) {
        suggestions.push(`✅ 已启用防抖：搜索延迟${config.debounceDelay}ms`)
      }

      if (config.batchUpdates) {
        suggestions.push('✅ 已启用批量更新：减少渲染次数')
      }

      if (!config.enableProfiling) {
        suggestions.push('⚠️ 性能监控已禁用：建议在生产环境关闭，开发环境开启')
      }

      return suggestions
    }
  }
}