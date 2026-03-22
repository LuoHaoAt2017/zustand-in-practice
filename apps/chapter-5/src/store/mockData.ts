// 第5章：Zustand性能优化实战 - 模拟数据生成器
import {
  User, Product, Category, CartItem, Order, LargeListItem,
  UserPreferences, Address, Notification
} from './types'

// 模拟延迟
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟API错误
export const simulateError = (errorRate: number = 0.1) => {
  if (Math.random() < errorRate) {
    throw new Error('模拟API错误：请求失败')
  }
}

// 生成模拟用户
export const generateMockUser = (id: string = `user-${Date.now()}`): User => {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  const domains = ['example.com', 'test.com', 'demo.com', 'sample.com']

  const name = names[Math.floor(Math.random() * names.length)]
  const email = `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`

  return {
    id,
    name,
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    role: Math.random() > 0.8 ? 'admin' : 'user',
    preferences: {
      theme: Math.random() > 0.5 ? 'light' : 'dark',
      language: Math.random() > 0.5 ? 'zh-CN' : 'en-US',
      notifications: Math.random() > 0.3,
      fontSize: 14 + Math.floor(Math.random() * 6)
    }
  }
}

// 生成模拟商品
export const generateMockProduct = (id: string): Product => {
  const categories = [
    { id: 'cat-1', name: '电子产品' },
    { id: 'cat-2', name: '家居用品' },
    { id: 'cat-3', name: '服装配饰' },
    { id: 'cat-4', name: '图书音像' },
    { id: 'cat-5', name: '食品饮料' },
    { id: 'cat-6', name: '美妆护肤' },
    { id: 'cat-7', name: '运动户外' },
    { id: 'cat-8', name: '母婴玩具' }
  ]

  const category = categories[Math.floor(Math.random() * categories.length)]
  const productNames = [
    '高端智能手机', '无线蓝牙耳机', '智能手表', '笔记本电脑',
    '平板电脑', '数码相机', '游戏主机', '显示器',
    '机械键盘', '电竞鼠标', '移动电源', '蓝牙音箱'
  ]

  const name = productNames[Math.floor(Math.random() * productNames.length)]
  const price = Math.floor(Math.random() * 5000) + 100
  const rating = parseFloat((3 + Math.random() * 2).toFixed(1))

  return {
    id,
    name: `${name} ${id.slice(-4)}`,
    description: `这是${name}的详细描述，具有优秀的性能和品质，是您理想的选择。`,
    price,
    categoryId: category.id,
    categoryName: category.name,
    stock: Math.floor(Math.random() * 1000),
    rating,
    tags: ['新品', '热卖', '推荐'].slice(0, Math.floor(Math.random() * 3) + 1),
    imageUrl: `https://picsum.photos/400/400?random=${id}&t=${Date.now()}`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// 生成大量商品数据（用于性能测试）
export const generateLargeProductList = (count: number = 10000): LargeListItem[] => {
  const categories = ['电子产品', '家居用品', '服装配饰', '图书音像', '食品饮料']
  const tags = ['新品', '热卖', '推荐', '折扣', '限量', '进口', '国产', '环保']

  return Array.from({ length: count }, (_, i) => {
    const id = `item-${i + 1}`
    const category = categories[i % categories.length]
    const price = Math.floor(Math.random() * 10000) + 100
    const rating = parseFloat((1 + Math.random() * 4).toFixed(1))

    // 随机标签（1-3个）
    const itemTags = []
    const tagCount = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < tagCount; j++) {
      const tag = tags[Math.floor(Math.random() * tags.length)]
      if (!itemTags.includes(tag)) {
        itemTags.push(tag)
      }
    }

    // 生成随机描述（模拟大量文本数据）
    const descriptionWords = [
      '优秀', '高品质', '高性能', '实用', '美观', '耐用', '创新',
      '智能', '便捷', '可靠', '安全', '环保', '经济', '时尚'
    ]
    const descriptionLength = Math.floor(Math.random() * 10) + 5
    const description = Array.from({ length: descriptionLength }, () =>
      descriptionWords[Math.floor(Math.random() * descriptionWords.length)]
    ).join('、') + '。'

    return {
      id,
      name: `商品 ${id} - ${category}类产品`,
      description,
      price,
      category,
      stock: Math.floor(Math.random() * 10000),
      rating,
      tags: itemTags,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        weight: parseFloat((Math.random() * 10).toFixed(2)),
        dimensions: {
          width: Math.floor(Math.random() * 100),
          height: Math.floor(Math.random() * 100),
          depth: Math.floor(Math.random() * 100)
        },
        manufacturer: `制造商-${Math.floor(Math.random() * 100)}`,
        sku: `SKU-${Date.now()}-${i}`,
        barcode: `978${String(i).padStart(10, '0')}`
      }
    }
  })
}

// 生成模拟购物车商品
export const generateMockCartItem = (productId: string, productName: string, price: number): CartItem => {
  return {
    id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    productId,
    name: productName,
    price,
    quantity: Math.floor(Math.random() * 5) + 1,
    imageUrl: `https://picsum.photos/100/100?random=${productId}`,
    addedAt: new Date().toISOString()
  }
}

// 生成模拟订单
export const generateMockOrder = (userId: string, orderId: string): Order => {
  const itemCount = Math.floor(Math.random() * 5) + 1
  const items = Array.from({ length: itemCount }, (_, i) => ({
    productId: `product-${i + 1}`,
    name: `商品 ${i + 1}`,
    price: Math.floor(Math.random() * 1000) + 100,
    quantity: Math.floor(Math.random() * 3) + 1,
    imageUrl: `https://picsum.photos/100/100?random=${i + 1}`
  }))

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = subtotal > 500 ? 0 : Math.floor(Math.random() * 50) + 10
  const discount = subtotal > 1000 ? Math.floor(Math.random() * 100) + 50 : 0
  const total = subtotal + shippingFee - discount

  const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  const status = statuses[Math.floor(Math.random() * statuses.length)]

  const provinces = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '湖北省']
  const cities = {
    '北京市': ['北京市'],
    '上海市': ['上海市'],
    '广东省': ['广州市', '深圳市', '东莞市'],
    '江苏省': ['南京市', '苏州市', '无锡市'],
    '浙江省': ['杭州市', '宁波市', '温州市'],
    '四川省': ['成都市', '绵阳市', '宜宾市'],
    '湖北省': ['武汉市', '宜昌市', '襄阳市']
  }

  const province = provinces[Math.floor(Math.random() * provinces.length)]
  const cityList = cities[province as keyof typeof cities] || ['未知城市']
  const city = cityList[Math.floor(Math.random() * cityList.length)]

  return {
    id: orderId,
    userId,
    items,
    total,
    subtotal,
    shippingFee,
    discount,
    status,
    shippingAddress: {
      id: `addr-${Date.now()}`,
      name: '收货人',
      phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      province,
      city,
      district: ['区1', '区2', '区3'][Math.floor(Math.random() * 3)],
      detail: `${Math.floor(Math.random() * 100)}号`,
      isDefault: true
    },
    paymentMethod: Math.random() > 0.5 ? '支付宝' : '微信支付',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// 生成模拟通知
export const generateMockNotification = (): Notification => {
  const types: Notification['type'][] = ['info', 'success', 'warning', 'error']
  const type = types[Math.floor(Math.random() * types.length)]

  const titles = {
    info: ['系统通知', '消息提醒', '更新通知'],
    success: ['操作成功', '交易完成', '任务完成'],
    warning: ['注意提醒', '警告通知', '需要关注'],
    error: ['错误提示', '操作失败', '系统错误']
  }

  const messages = {
    info: ['系统已更新到最新版本', '您有新的消息，请查收', '系统维护通知'],
    success: ['您的订单已支付成功', '商品已成功添加到购物车', '账户设置已更新'],
    warning: ['账户存在安全风险，请及时修改密码', '商品库存不足，请尽快购买', '订单即将过期'],
    error: ['网络连接失败，请检查网络', '支付失败，请重试', '系统错误，请联系客服']
  }

  const title = titles[type][Math.floor(Math.random() * titles[type].length)]
  const message = messages[type][Math.floor(Math.random() * messages[type].length)]

  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    read: Math.random() > 0.5,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: Math.random() > 0.7 ? '/orders' : undefined
  }
}

// 生成模拟性能指标
export const generatePerformanceMetrics = (): any => {
  return {
    renderTime: Math.random() * 100,
    selectorTime: Math.random() * 50,
    memoryUsage: Math.random() * 100,
    networkLatency: Math.random() * 500
  }
}

// 批量生成数据（用于性能测试）
export const bulkGenerate = {
  // 生成大量用户
  users: (count: number = 1000) => {
    return Array.from({ length: count }, (_, i) => generateMockUser(`user-bulk-${i + 1}`))
  },

  // 生成大量商品
  products: (count: number = 5000) => {
    return Array.from({ length: count }, (_, i) => generateMockProduct(`product-bulk-${i + 1}`))
  },

  // 生成大量订单
  orders: (userId: string, count: number = 100) => {
    return Array.from({ length: count }, (_, i) =>
      generateMockOrder(userId, `order-bulk-${Date.now()}-${i + 1}`)
    )
  },

  // 生成大量通知
  notifications: (count: number = 50) => {
    return Array.from({ length: count }, () => generateMockNotification())
  }
}

// 数据生成器工具
export const dataGenerator = {
  // 获取分页数据
  getPaginatedData: <T>(data: T[], page: number, pageSize: number) => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return {
      items: data.slice(start, end),
      page,
      pageSize,
      total: data.length,
      totalPages: Math.ceil(data.length / pageSize),
      hasNext: end < data.length,
      hasPrev: page > 1
    }
  },

  // 过滤数据
  filterData: <T extends Record<string, any>>(
    data: T[],
    filters: Record<string, any>
  ): T[] => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true

        const itemValue = item[key]

        // 根据过滤器类型进行匹配
        if (Array.isArray(value)) {
          // 数组过滤器（如多选分类）
          return value.includes(itemValue)
        } else if (typeof value === 'string') {
          // 字符串搜索
          return String(itemValue).toLowerCase().includes(value.toLowerCase())
        } else if (typeof value === 'number') {
          // 数值比较
          return itemValue === value
        } else if (typeof value === 'boolean') {
          // 布尔值比较
          return itemValue === value
        } else if (Array.isArray(value) && value.length === 2) {
          // 范围过滤器 [min, max]
          return itemValue >= value[0] && itemValue <= value[1]
        }

        return true
      })
    })
  },

  // 排序数据
  sortData: <T extends Record<string, any>>(
    data: T[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): T[] => {
    return [...data].sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  },

  // 搜索数据
  searchData: <T extends Record<string, any>>(
    data: T[],
    query: string,
    fields: string[] = ['name', 'description']
  ): T[] => {
    if (!query.trim()) return data

    const lowerQuery = query.toLowerCase()
    return data.filter(item => {
      return fields.some(field => {
        const value = item[field]
        return value && String(value).toLowerCase().includes(lowerQuery)
      })
    })
  }
}

// 导出所有数据生成函数
export default {
  generateMockUser,
  generateMockProduct,
  generateLargeProductList,
  generateMockCartItem,
  generateMockOrder,
  generateMockNotification,
  generatePerformanceMetrics,
  bulkGenerate,
  dataGenerator,
  delay,
  simulateError
}