// 统一导出所有store和工具

// 导入模块store
import { useAuthStore } from './modules/auth'
import { useProductStore } from './modules/product'
import { useCartStore } from './modules/cart'
import { useOrderStore } from './modules/order'

// 导出类型
export * from './types'
export * from './mockApi'

// 导出模块store
export { useAuthStore, authSelectors } from './modules/auth'
export { useProductStore, productSelectors } from './modules/product'
export { useCartStore, cartSelectors } from './modules/cart'
export { useOrderStore, orderSelectors, createOrderStore } from './modules/order'

// 导出组合工具
export { useAppStore, useCombinedActions, useCombinedSelectors } from './combined'

// 导出类型别名（方便使用）
export type { AuthState } from './modules/auth'
export type { ProductState } from './modules/product'
export type { CartState } from './modules/cart'
export type { OrderState } from './modules/order'

// 工具函数：重置所有store（用于测试或登出）
export const resetAllStores = () => {
  console.log('重置所有store状态')

  // 重置认证store
  useAuthStore.getState().logout()

  // 重置商品store
  useProductStore.setState({
    products: [],
    categories: [],
    selectedCategory: null,
    isLoading: false,
    error: null
  })

  // 重置购物车store
  useCartStore.getState().clearCart()

  // 重置订单store
  useOrderStore.setState({
    orders: [],
    isLoading: false,
    error: null
  })
}

// 工具函数：初始化应用状态（模拟数据）
export const initializeMockData = async () => {
  console.log('初始化模拟数据')

  try {
    // 模拟登录
    await useAuthStore.getState().login({
      username: 'testuser',
      password: 'password'
    })

    // 获取商品和分类
    await useProductStore.getState().fetchProducts()
    await useProductStore.getState().fetchCategories()

    // 添加一些商品到购物车
    const products = useProductStore.getState().products
    if (products.length >= 2) {
      useCartStore.getState().addItem(products[0], 1)
      useCartStore.getState().addItem(products[1], 2)
    }

    console.log('模拟数据初始化完成')
  } catch (error) {
    console.error('初始化模拟数据失败:', error)
  }
}

// 开发工具：打印所有store状态
export const logStoreStates = () => {
  console.group('Store States')
  console.log('Auth Store:', useAuthStore.getState())
  console.log('Product Store:', useProductStore.getState())
  console.log('Cart Store:', useCartStore.getState())
  console.log('Order Store:', useOrderStore.getState())
  console.groupEnd()
}