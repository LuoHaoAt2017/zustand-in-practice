// 第4章：复杂业务场景下的Zustand - 模拟API

import { User, Product, Category, Order, Address, PaymentMethod, PaginatedResponse } from './types'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟API错误
const simulateError = (errorRate: number = 0.1) => {
  if (Math.random() < errorRate) {
    throw new Error('模拟API错误：请求失败')
  }
}

// 用户API
export const userApi = {
  // 登录
  login: async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    await delay(800)
    simulateError(0.2) // 20%错误率

    if (credentials.email === 'error@example.com') {
      throw new Error('用户名或密码错误')
    }

    return {
      user: {
        id: 'user-123',
        name: '测试用户',
        email: credentials.email,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
      },
      token: 'mock-jwt-token-123456'
    }
  },

  // 登出
  logout: async (): Promise<void> => {
    await delay(300)
  },

  // 注册
  register: async (userData: { name: string; email: string; password: string }): Promise<User> => {
    await delay(1000)
    simulateError(0.1)

    return {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email
    }
  },

  // 检查用户名是否可用
  checkUsernameAvailable: async (username: string): Promise<boolean> => {
    await delay(500)
    // 模拟一些已存在的用户名
    const takenUsernames = ['admin', 'user', 'test', 'demo']
    return !takenUsernames.includes(username.toLowerCase())
  },

  // 检查邮箱是否可用
  checkEmailAvailable: async (email: string): Promise<boolean> => {
    await delay(500)
    // 模拟一些已存在的邮箱
    const takenEmails = ['test@example.com', 'admin@example.com', 'user@example.com']
    return !takenEmails.includes(email.toLowerCase())
  }
}

// 商品API
export const productApi = {
  // 获取商品列表（分页）
  getProducts: async (page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Product>> => {
    await delay(600)

    // 模拟商品数据
    const products: Product[] = Array.from({ length: 100 }, (_, i) => ({
      id: `product-${i + 1}`,
      name: `商品 ${i + 1}`,
      description: `这是商品 ${i + 1} 的描述，这是一个非常好的商品，推荐购买`,
      price: Math.floor(Math.random() * 1000) + 100,
      categoryId: `category-${(i % 5) + 1}`,
      stock: Math.floor(Math.random() * 100),
      imageUrl: `https://picsum.photos/200/200?random=${i + 1}`
    }))

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedItems = products.slice(start, end)

    return {
      items: paginatedItems,
      page,
      total: products.length,
      pageSize,
      hasMore: end < products.length
    }
  },

  // 搜索商品
  searchProducts: async (query: string, page: number = 1): Promise<PaginatedResponse<Product>> => {
    await delay(800)
    simulateError(0.05)

    const allProducts = Array.from({ length: 50 }, (_, i) => ({
      id: `product-${i + 1}`,
      name: `商品 ${i + 1}`,
      description: `商品描述 ${i + 1}`,
      price: Math.floor(Math.random() * 500) + 50,
      categoryId: `category-${(i % 5) + 1}`,
      stock: Math.floor(Math.random() * 50),
      imageUrl: `https://picsum.photos/200/200?random=${i + 1}`
    }))

    // 过滤商品
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
    )

    const pageSize = 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedItems = filtered.slice(start, end)

    return {
      items: paginatedItems,
      page,
      total: filtered.length,
      pageSize,
      hasMore: end < filtered.length
    }
  },

  // 获取商品分类
  getCategories: async (): Promise<Category[]> => {
    await delay(400)

    return [
      { id: 'category-1', name: '电子产品' },
      { id: 'category-2', name: '家居用品' },
      { id: 'category-3', name: '服装配饰' },
      { id: 'category-4', name: '图书音像' },
      { id: 'category-5', name: '食品饮料' }
    ]
  }
}

// 购物车API
export const cartApi = {
  // 添加到购物车
  addToCart: async (productId: string, quantity: number): Promise<void> => {
    await delay(300)
    simulateError(0.05)
  },

  // 从购物车移除
  removeFromCart: async (productId: string): Promise<void> => {
    await delay(200)
  },

  // 更新购物车数量
  updateCartQuantity: async (productId: string, quantity: number): Promise<void> => {
    await delay(250)
    simulateError(0.05)
  }
}

// 订单API
export const orderApi = {
  // 创建订单
  createOrder: async (orderData: {
    userId: string
    items: Array<{ productId: string; quantity: number; price: number }>
    shippingAddress: Address
    paymentMethod: PaymentMethod
  }): Promise<Order> => {
    await delay(1200)
    simulateError(0.1)

    const total = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return {
      id: `order-${Date.now()}`,
      userId: orderData.userId,
      items: orderData.items.map(item => ({
        productId: item.productId,
        name: `商品 ${item.productId}`,
        price: item.price,
        quantity: item.quantity
      })),
      total,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  },

  // 获取订单历史
  getOrders: async (userId: string, page: number = 1): Promise<PaginatedResponse<Order>> => {
    await delay(700)

    const orders: Order[] = Array.from({ length: 25 }, (_, i) => ({
      id: `order-${1000 + i}`,
      userId,
      items: [
        {
          productId: `product-${i % 10 + 1}`,
          name: `商品 ${i % 10 + 1}`,
          price: Math.floor(Math.random() * 200) + 50,
          quantity: Math.floor(Math.random() * 3) + 1
        }
      ],
      total: Math.floor(Math.random() * 1000) + 200,
      status: ['pending', 'processing', 'shipped', 'delivered'][i % 4] as any,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }))

    const pageSize = 5
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      items: orders.slice(start, end),
      page,
      total: orders.length,
      pageSize,
      hasMore: end < orders.length
    }
  }
}

// 地址API
export const addressApi = {
  // 获取用户地址
  getUserAddresses: async (userId: string): Promise<Address[]> => {
    await delay(500)

    return [
      {
        id: 'address-1',
        name: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detail: '建国门外大街1号',
        isDefault: true
      },
      {
        id: 'address-2',
        name: '张三',
        phone: '13800138001',
        province: '上海市',
        city: '上海市',
        district: '浦东新区',
        detail: '陆家嘴环路1000号',
        isDefault: false
      }
    ]
  },

  // 添加地址
  addAddress: async (address: Omit<Address, 'id'>): Promise<Address> => {
    await delay(600)

    return {
      ...address,
      id: `address-${Date.now()}`
    }
  }
}

// 支付API
export const paymentApi = {
  // 获取支付方式
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    await delay(400)

    return [
      {
        id: 'payment-1',
        type: 'credit_card',
        name: '信用卡',
        lastFour: '1234'
      },
      {
        id: 'payment-2',
        type: 'alipay',
        name: '支付宝'
      },
      {
        id: 'payment-3',
        type: 'wechat_pay',
        name: '微信支付'
      }
    ]
  },

  // 处理支付
  processPayment: async (paymentData: {
    orderId: string
    paymentMethodId: string
    amount: number
  }): Promise<{ success: boolean; transactionId: string }> => {
    await delay(800)
    simulateError(0.15)

    return {
      success: true,
      transactionId: `txn-${Date.now()}`
    }
  }
}

// 表单验证API
export const validationApi = {
  // 验证表单字段
  validateField: async (fieldName: string, value: any): Promise<{ valid: boolean; message?: string }> => {
    await delay(300)

    const validations: Record<string, (val: any) => { valid: boolean; message?: string }> = {
      username: (val) => {
        if (!val) return { valid: false, message: '用户名不能为空' }
        if (val.length < 3) return { valid: false, message: '用户名至少3个字符' }
        if (val.length > 20) return { valid: false, message: '用户名最多20个字符' }
        return { valid: true }
      },
      email: (val) => {
        if (!val) return { valid: false, message: '邮箱不能为空' }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(val)) return { valid: false, message: '邮箱格式不正确' }
        return { valid: true }
      },
      password: (val) => {
        if (!val) return { valid: false, message: '密码不能为空' }
        if (val.length < 6) return { valid: false, message: '密码至少6个字符' }
        return { valid: true }
      },
      phone: (val) => {
        if (!val) return { valid: false, message: '手机号不能为空' }
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(val)) return { valid: false, message: '手机号格式不正确' }
        return { valid: true }
      }
    }

    const validator = validations[fieldName]
    return validator ? validator(value) : { valid: true }
  }
}

export default {
  user: userApi,
  product: productApi,
  cart: cartApi,
  order: orderApi,
  address: addressApi,
  payment: paymentApi,
  validation: validationApi
}