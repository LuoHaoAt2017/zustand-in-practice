import { create } from 'zustand'
import { Order, CartItem } from '../types'
import { mockApi } from '../mockApi'
import { useAuthStore } from './auth'
import { useCartStore } from './cart'

// 订单模块状态接口
export interface OrderState {
  orders: Order[]
  isLoading: boolean
  error: string | null

  // Actions
  createOrder: (cartItems: CartItem[]) => Promise<Order>
  fetchOrders: () => Promise<void>
  clearOrders: () => void
}

// 创建订单store工厂（依赖注入模式）
export const createOrderStore = (dependencies: {
  authStore: typeof useAuthStore
  cartStore: typeof useCartStore
}) => {
  return create<OrderState>((set) => ({
    // 初始状态
    orders: [],
    isLoading: false,
    error: null,

    // 创建订单
    createOrder: async (cartItems: CartItem[]) => {
      set({ isLoading: true, error: null })

      try {
        // 通过依赖获取当前状态
        const { user } = dependencies.authStore.getState()
        const { clearCart } = dependencies.cartStore.getState()

        if (!user) {
          throw new Error('用户未登录，请先登录')
        }

        if (cartItems.length === 0) {
          throw new Error('购物车为空，无法创建订单')
        }

        // 调用API创建订单
        const order = await mockApi.createOrder({
          userId: user.id,
          items: cartItems
        })

        // 更新状态
        set((state) => ({
          orders: [...state.orders, order],
          isLoading: false,
          error: null
        }))

        // 清空购物车
        clearCart()

        return order
      } catch (error) {
        set({
          isLoading: false,
          error: (error as Error).message
        })
        throw error
      }
    },

    // 获取订单历史（模拟）
    fetchOrders: async () => {
      set({ isLoading: true, error: null })

      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))

        // 这里可以添加实际的API调用
        // const orders = await api.fetchOrders()

        set({
          isLoading: false,
          error: null
          // orders: orders
        })
      } catch (error) {
        set({
          isLoading: false,
          error: (error as Error).message
        })
        throw error
      }
    },

    // 清空订单历史
    clearOrders: () => {
      set({ orders: [] })
    }
  }))
}

// 创建默认的订单store实例（注入依赖）
export const useOrderStore = createOrderStore({
  authStore: useAuthStore,
  cartStore: useCartStore
})

// 导出选择器
export const orderSelectors = {
  selectOrders: (state: OrderState) => state.orders,
  selectIsLoading: (state: OrderState) => state.isLoading,
  selectError: (state: OrderState) => state.error,

  // 派生状态：按日期排序的订单
  selectSortedOrders: (state: OrderState) => {
    return [...state.orders].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  // 派生状态：订单总金额
  selectTotalOrderAmount: (state: OrderState) => {
    return state.orders.reduce((sum, order) => sum + order.total, 0)
  }
}

export default useOrderStore