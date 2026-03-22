import { create } from 'zustand'
import { Product, CartItem } from '../types'

// 购物车模块状态接口
export interface CartState {
  items: CartItem[]

  // Getters (计算属性)
  get total(): number
  get itemCount(): number

  // Actions
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void

  // 工具方法
  isInCart: (productId: string) => boolean
  getItem: (productId: string) => CartItem | undefined
}

// 创建购物车store
export const useCartStore = create<CartState>((set, get) => ({
  // 初始状态
  items: [],

  // 计算属性：购物车总价
  get total() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  // 计算属性：购物车商品总数
  get itemCount() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  // 添加商品到购物车
  addItem: (product: Product, quantity: number) => {
    set((state) => {
      // 检查是否已经在购物车中
      const existingItemIndex = state.items.findIndex(item => item.id === product.id)

      if (existingItemIndex >= 0) {
        // 更新现有商品数量
        const updatedItems = [...state.items]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        }

        return { items: updatedItems }
      } else {
        // 添加新商品
        const newItem: CartItem = {
          ...product,
          quantity
        }

        return { items: [...state.items, newItem] }
      }
    })
  },

  // 从购物车移除商品
  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId)
    }))
  },

  // 更新商品数量
  updateQuantity: (productId: string, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        // 如果数量为0或负数，移除商品
        return { items: state.items.filter((item) => item.id !== productId) }
      }

      // 更新商品数量
      const updatedItems = state.items.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )

      return { items: updatedItems }
    })
  },

  // 清空购物车
  clearCart: () => {
    set({ items: [] })
  },

  // 检查商品是否在购物车中
  isInCart: (productId: string) => {
    return get().items.some(item => item.id === productId)
  },

  // 获取购物车中的商品
  getItem: (productId: string) => {
    return get().items.find(item => item.id === productId)
  }
}))

// 导出选择器
export const cartSelectors = {
  selectItems: (state: CartState) => state.items,
  selectTotal: (state: CartState) => state.total,
  selectItemCount: (state: CartState) => state.itemCount,

  // 派生状态：按商品ID分组
  selectGroupedItems: (state: CartState) => {
    return state.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, CartItem[]>)
  }
}

export default useCartStore