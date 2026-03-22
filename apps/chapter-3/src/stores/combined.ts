import { useMemo, useCallback } from 'react'
import { useAuthStore } from './modules/auth'
import { useProductStore } from './modules/product'
import { useCartStore } from './modules/cart'
import { useOrderStore } from './modules/order'
import { Product, CartItem } from './types'

/**
 * 组合hook：用于需要访问多个store的场景
 * 提供了跨模块的派生状态
 */
export const useAppStore = () => {
  // 从各个store中订阅需要的数据
  const user = useAuthStore((state) => state.user)
  const products = useProductStore((state) => state.products)
  const cartItems = useCartStore((state) => state.items)
  const orders = useOrderStore((state) => state.orders)

  // 派生状态：购物车商品详情（包含完整的商品信息）
  const cartProducts = useMemo(() => {
    return cartItems.map((item) => {
      const product = products.find((p) => p.id === item.id)
      return product ? { ...product, quantity: item.quantity } : null
    }).filter(Boolean) as (Product & { quantity: number })[]
  }, [cartItems, products])

  // 派生状态：按分类统计购物车商品
  const cartByCategory = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = {
          items: [],
          total: 0,
          count: 0
        }
      }
      acc[category].items.push(item)
      acc[category].total += item.price * item.quantity
      acc[category].count += item.quantity
      return acc
    }, {} as Record<string, { items: CartItem[]; total: number; count: number }>)
  }, [cartItems])

  // 派生状态：用户订单统计
  const orderStats = useMemo(() => {
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

    return {
      totalOrders,
      totalSpent,
      averageOrderValue
    }
  }, [orders])

  return {
    // 原始状态
    user,
    products,
    cartItems,
    orders,

    // 派生状态
    cartProducts,
    cartByCategory,
    orderStats,

    // 计算属性
    isAuthenticated: !!user,
    cartTotal: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    cartItemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }
}

/**
 * 组合action：跨模块的操作
 */
export const useCombinedActions = () => {
  // 获取各个store的actions
  const { addItem } = useCartStore()
  const { products } = useProductStore()
  const { user } = useAuthStore()
  const { createOrder } = useOrderStore()
  const { clearCart } = useCartStore()

  // 组合action：添加商品到购物车（包含商品查找）
  const addProductToCart = useCallback((productId: string, quantity: number = 1) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      addItem(product, quantity)
      return true
    }
    return false
  }, [products, addItem])

  // 组合action：快速结账（登录+创建订单）
  const quickCheckout = useCallback(async (productId: string, quantity: number = 1) => {
    // 1. 检查是否已登录
    if (!user) {
      throw new Error('请先登录')
    }

    // 2. 添加商品到购物车
    const product = products.find((p) => p.id === productId)
    if (!product) {
      throw new Error('商品不存在')
    }

    addItem(product, quantity)

    // 3. 获取当前购物车（包含刚添加的商品）
    const cartItems = useCartStore.getState().items

    // 4. 创建订单
    const order = await createOrder(cartItems)

    return order
  }, [user, products, addItem, createOrder])

  // 组合action：清空用户所有数据（登出时使用）
  const clearUserData = useCallback(() => {
    // 清空购物车
    clearCart()
    // 这里还可以清空其他用户相关数据
  }, [clearCart])

  // 组合action：批量添加商品
  const addMultipleProducts = useCallback((productIds: string[]) => {
    productIds.forEach(productId => {
      const product = products.find((p) => p.id === productId)
      if (product) {
        addItem(product, 1)
      }
    })
  }, [products, addItem])

  return {
    addProductToCart,
    quickCheckout,
    clearUserData,
    addMultipleProducts
  }
}

/**
 * 组合选择器：跨模块的选择器
 */
export const useCombinedSelectors = () => {
  // 组合选择器：获取用户购物车中的商品（包含分类信息）
  const getUserCartWithCategory = useCallback(() => {
    const cartItems = useCartStore.getState().items
    const categories = useProductStore.getState().categories

    return cartItems.map(item => {
      const category = categories.find(c => c.id === item.category)
      return {
        ...item,
        categoryName: category ? category.name : item.category
      }
    })
  }, [])

  // 组合选择器：获取用户推荐商品（未在购物车中的商品）
  const getRecommendedProducts = useCallback(() => {
    const products = useProductStore.getState().products
    const cartItems = useCartStore.getState().items
    const cartProductIds = new Set(cartItems.map(item => item.id))

    return products.filter(product => !cartProductIds.has(product.id))
  }, [])

  // 组合选择器：获取用户订单摘要
  const getUserOrderSummary = useCallback(() => {
    const orders = useOrderStore.getState().orders
    const cartTotal = useCartStore.getState().total

    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    const pendingAmount = cartTotal

    return {
      totalOrders,
      totalSpent,
      pendingAmount,
      totalAll: totalSpent + pendingAmount
    }
  }, [])

  return {
    getUserCartWithCategory,
    getRecommendedProducts,
    getUserOrderSummary
  }
}