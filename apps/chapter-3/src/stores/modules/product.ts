import { create } from 'zustand'
import { Product, Category } from '../types'
import { mockApi } from '../mockApi'

// 商品模块状态接口
export interface ProductState {
  products: Product[]
  categories: Category[]
  selectedCategory: string | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchProducts: () => Promise<void>
  fetchCategories: () => Promise<void>
  selectCategory: (categoryId: string | null) => void
  resetSelection: () => void
}

// 创建商品store
export const useProductStore = create<ProductState>((set) => ({
  // 初始状态
  products: [],
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,

  // 获取商品列表
  fetchProducts: async () => {
    set({ isLoading: true, error: null })

    try {
      const products = await mockApi.getProducts()
      set({ products, isLoading: false, error: null })
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message
      })
      throw error
    }
  },

  // 获取分类列表
  fetchCategories: async () => {
    set({ isLoading: true, error: null })

    try {
      const categories = await mockApi.getCategories()
      set({ categories, isLoading: false, error: null })
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message
      })
      throw error
    }
  },

  // 选择分类
  selectCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId })
  },

  // 重置选择
  resetSelection: () => {
    set({ selectedCategory: null })
  }
}))

// 导出选择器
export const productSelectors = {
  selectProducts: (state: ProductState) => state.products,
  selectCategories: (state: ProductState) => state.categories,
  selectSelectedCategory: (state: ProductState) => state.selectedCategory,
  selectIsLoading: (state: ProductState) => state.isLoading,
  selectError: (state: ProductState) => state.error,

  // 派生状态：按分类筛选的商品
  selectFilteredProducts: (state: ProductState) => {
    if (!state.selectedCategory) return state.products
    return state.products.filter(product => product.category === state.selectedCategory)
  },

  // 派生状态：当前分类的商品数量
  selectProductsCountByCategory: (state: ProductState) => (categoryId: string) => {
    return state.products.filter(product => product.category === categoryId).length
  }
}

export default useProductStore