// 第4章：复杂业务场景下的Zustand - 类型定义

// 用户相关类型
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

// 商品相关类型
export interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  stock: number
  imageUrl: string
}

export interface Category {
  id: string
  name: string
}

// 购物车相关类型
export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
}

// 订单相关类型
export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

// 表单字段类型
export interface FormField<T = any> {
  value: T
  error?: string
  touched: boolean
}

// 地址类型
export interface Address {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

// 支付方式类型
export interface PaymentMethod {
  id: string
  type: 'credit_card' | 'alipay' | 'wechat_pay'
  name: string
  lastFour?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  page: number
  total: number
  pageSize: number
  hasMore: boolean
}

// 搜索响应类型
export interface SearchResult<T> {
  query: string
  results: T[]
  total: number
  took: number // 搜索耗时(ms)
}

// 事件类型
export type EventName =
  | 'user:loggedIn'
  | 'user:loggedOut'
  | 'cart:updated'
  | 'cart:itemAdded'
  | 'cart:itemRemoved'
  | 'order:created'
  | 'order:statusUpdated'
  | 'product:searched'
  | 'form:submitted'
  | 'form:validated'

export interface EventMap {
  'user:loggedIn': { userId: string; userName: string }
  'user:loggedOut': { userId: string }
  'cart:updated': { itemCount: number; total: number }
  'cart:itemAdded': { productId: string; productName: string; quantity: number }
  'cart:itemRemoved': { productId: string; productName: string }
  'order:created': { orderId: string; total: number }
  'order:statusUpdated': { orderId: string; oldStatus: string; newStatus: string }
  'product:searched': { query: string; resultCount: number }
  'form:submitted': { formName: string; success: boolean }
  'form:validated': { formName: string; isValid: boolean }
}

// 表单验证器类型
export interface FormValidator {
  validate: (fields: Record<string, FormField>) => boolean
  validateAll: (fields: Record<string, FormField>) => Record<string, string>
}

// Checkout流程步骤
export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review' | 'complete'