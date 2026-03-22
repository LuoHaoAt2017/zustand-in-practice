import {
  User,
  LoginCredentials,
  LoginResponse,
  Product,
  Category,
  Order,
  CartItem,
  MockApi
} from './types'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟数据
const mockUsers: User[] = [
  { id: '1', username: 'testuser', email: 'test@example.com' }
]

const mockProducts: Product[] = [
  { id: '1', name: '商品A', price: 100, category: 'electronics', description: '电子产品A' },
  { id: '2', name: '商品B', price: 200, category: 'electronics', description: '电子产品B' },
  { id: '3', name: '商品C', price: 150, category: 'clothing', description: '服装C' },
  { id: '4', name: '商品D', price: 300, category: 'clothing', description: '服装D' },
]

const mockCategories: Category[] = [
  { id: 'electronics', name: '电子产品' },
  { id: 'clothing', name: '服装' },
]

let orderCounter = 1

// 模拟API实现
export const mockApi: MockApi = {
  // 模拟登录
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    await delay(500) // 模拟网络延迟

    const user = mockUsers.find(u => u.username === credentials.username)

    if (!user || credentials.password !== 'password') {
      throw new Error('用户名或密码错误')
    }

    return {
      user,
      token: 'mock-jwt-token'
    }
  },

  // 获取商品列表
  getProducts: async (): Promise<Product[]> => {
    await delay(300)
    return mockProducts
  },

  // 获取分类列表
  getCategories: async (): Promise<Category[]> => {
    await delay(200)
    return mockCategories
  },

  // 创建订单
  createOrder: async (orderData: { userId: string; items: CartItem[] }): Promise<Order> => {
    await delay(800)

    const total = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const order: Order = {
      id: `order-${orderCounter++}`,
      userId: orderData.userId,
      items: orderData.items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total,
      createdAt: new Date().toISOString()
    }

    return order
  }
}

// 导出默认实例
export default mockApi