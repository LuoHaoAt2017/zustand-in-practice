// 共享类型定义

// 用户相关类型
export interface User {
  id: string
  username: string
  email: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

// 商品相关类型
export interface Product {
  id: string
  name: string
  price: number
  category: string
  description?: string
}

export interface Category {
  id: string
  name: string
}

// 购物车相关类型
export interface CartItem extends Product {
  quantity: number
}

// 订单相关类型
export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  createdAt: string
}

// 模拟API响应
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

// 模拟API函数类型
export interface MockApi {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>
  getProducts: () => Promise<Product[]>
  getCategories: () => Promise<Category[]>
  createOrder: (orderData: { userId: string; items: CartItem[] }) => Promise<Order>
}