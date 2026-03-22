// 第4章：复杂业务场景下的Zustand - 异步操作处理
import { create } from 'zustand'
import { Product, PaginatedResponse } from './types'
import { productApi } from './mockApi'

// 基础异步状态接口
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  reset: () => void
}

// 创建基础异步store的工厂函数
export const createAsyncStore = <T>(fetcher: () => Promise<T>) => {
  return create<AsyncState<T>>((set) => ({
    data: null,
    loading: false,
    error: null,
    fetch: async () => {
      set({ loading: true, error: null })
      try {
        const data = await fetcher()
        set({ data, loading: false })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '未知错误', loading: false })
      }
    },
    reset: () => set({ data: null, loading: false, error: null })
  }))
}

// 使用示例：商品列表异步store
export const useProductsAsyncStore = createAsyncStore(() => productApi.getProducts(1, 10))

// 高级异步模式：带参数和缓存的分页store
export interface PaginatedState<T> {
  items: T[]
  page: number
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  fetchPage: (page: number, force?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export const createPaginatedStore = <T>(
  fetcher: (page: number) => Promise<PaginatedResponse<T>>,
  initialPageSize: number = 10
) => {
  return create<PaginatedState<T>>((set, get) => ({
    items: [],
    page: 0,
    total: 0,
    loading: false,
    error: null,
    get hasMore() {
      const { items, total } = get()
      return items.length < total
    },

    fetchPage: async (page, force = false) => {
      // 避免重复请求
      if (get().loading) {
        console.log('正在加载中，跳过重复请求')
        return
      }

      set({ loading: true, error: null })
      try {
        const response = await fetcher(page)
        set((state) => ({
          items: page === 1 || force ? response.items : [...state.items, ...response.items],
          page,
          total: response.total,
          loading: false
        }))
        console.log(`第${page}页数据加载完成，共${response.items.length}条`)
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '加载失败', loading: false })
        console.error('分页数据加载失败:', error)
      }
    },

    loadMore: async () => {
      const { page, hasMore } = get()
      if (hasMore && !get().loading) {
        console.log(`加载下一页，当前页码: ${page}`)
        await get().fetchPage(page + 1)
      } else {
        console.log('没有更多数据或正在加载中')
      }
    },

    refresh: async () => {
      console.log('刷新数据...')
      await get().fetchPage(1, true)
    }
  }))
}

// 使用示例：分页商品store
export const useProductsPaginatedStore = createPaginatedStore<Product>(
  (page) => productApi.getProducts(page, 10),
  10
)

// 竞态处理：搜索store
export interface SearchState<T> {
  query: string
  results: T[]
  loading: boolean
  error: string | null
  lastRequestId: number
  search: (query: string) => Promise<void>
  clear: () => void
}

export const createSearchStore = <T>(searcher: (query: string) => Promise<T[]>) => {
  return create<SearchState<T>>((set, get) => {
    let currentRequestId = 0

    return {
      query: '',
      results: [],
      loading: false,
      error: null,
      lastRequestId: 0,

      search: async (query: string) => {
        const requestId = ++currentRequestId
        set({ query, loading: true, lastRequestId: requestId })
        console.log(`开始搜索: "${query}" (请求ID: ${requestId})`)

        try {
          const results = await searcher(query)

          // 只处理最新的请求结果
          if (requestId === currentRequestId) {
            set({ results, loading: false })
            console.log(`搜索完成: "${query}"，找到${results.length}个结果 (请求ID: ${requestId})`)
          } else {
            console.log(`请求 ${requestId} 已过期，最新请求ID: ${currentRequestId}`)
          }
        } catch (error) {
          if (requestId === currentRequestId) {
            set({
              error: error instanceof Error ? error.message : '搜索失败',
              loading: false
            })
            console.error(`搜索失败: "${query}"`, error)
          }
        }
      },

      clear: () => {
        set({ query: '', results: [], error: null })
        console.log('清空搜索结果')
      }
    }
  })
}

// 使用示例：商品搜索store
export const useProductSearchStore = createSearchStore<Product>(
  async (query) => {
    const response = await productApi.searchProducts(query, 1)
    return response.items
  }
)

// 组合示例：同时使用多种异步模式
export const useComplexAsyncExample = () => {
  const productsAsync = useProductsAsyncStore()
  const productsPaginated = useProductsPaginatedStore()
  const productSearch = useProductSearchStore()

  return {
    // 基础异步
    basicAsync: {
      state: productsAsync,
      fetch: productsAsync.fetch,
      reset: productsAsync.reset
    },
    // 分页异步
    paginatedAsync: {
      state: productsPaginated,
      loadMore: productsPaginated.loadMore,
      refresh: productsPaginated.refresh
    },
    // 搜索异步（竞态处理）
    searchAsync: {
      state: productSearch,
      search: productSearch.search,
      clear: productSearch.clear
    }
  }
}