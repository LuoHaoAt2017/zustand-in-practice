// 第5章：Zustand性能优化实战 - 类型定义

// 用户类型
export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: 'admin' | 'user' | 'guest'
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
  fontSize: number
}

// 商品类型
export interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  categoryName: string
  stock: number
  rating: number
  tags: string[]
  imageUrl: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  productCount: number
}

// 购物车类型
export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  addedAt: string
}

// 订单类型
export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  subtotal: number
  shippingFee: number
  discount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: Address
  paymentMethod: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
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

// 通知类型
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  timestamp: string
  actionUrl?: string
}

// 性能指标类型
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
}

export interface RenderMetrics {
  componentName: string
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  lastUpdate: string
}

export interface SelectorMetrics {
  selectorName: string
  executionCount: number
  totalTime: number
  averageTime: number
  lastExecution: string
}

// 大型列表相关类型
export interface LargeListItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  rating: number
  tags: string[]
  createdAt: string
  // 添加更多字段以模拟大数据量
  metadata?: Record<string, any>
}

export interface VirtualScrollState {
  visibleStart: number
  visibleEnd: number
  itemHeight: number
  totalHeight: number
  overscan: number
}

// 持久化配置类型
export interface PersistenceConfig {
  name: string
  version: number
  migrate?: (persistedState: any, version: number) => any
  partialize?: (state: any) => any
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB'
}

// 选择器配置类型
export interface SelectorConfig<T, R> {
  name: string
  dependencies: Array<(state: T) => any>
  selector: (deps: any[]) => R
  memoize?: boolean
  maxCacheSize?: number
}

// 性能优化配置
export interface PerformanceConfig {
  enableProfiling: boolean
  logRenderMetrics: boolean
  logSelectorMetrics: boolean
  warnOnSlowRender: number // 毫秒
  warnOnSlowSelector: number // 毫秒
  batchUpdates: boolean
  enableVirtualization: boolean
  enableDebouncing: boolean
  debounceDelay: number
}

// 存储引擎类型
export interface StorageEngine {
  getItem: (key: string) => Promise<any>
  setItem: (key: string, value: any) => Promise<void>
  removeItem: (key: string) => Promise<void>
  clear: () => Promise<void>
}

// 分页和过滤类型
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FilterState {
  searchQuery: string
  categories: string[]
  priceRange: [number, number]
  sortBy: 'name' | 'price' | 'rating' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  inStock: boolean
}

// 缓存状态类型
export interface CacheEntry<T> {
  key: string
  data: T
  timestamp: number
  ttl: number // 生存时间（毫秒）
  hits: number
  lastAccess: number
}

export interface CacheState<T> {
  entries: Map<string, CacheEntry<T>>
  maxSize: number
  hits: number
  misses: number
  hitRate: number
}

// Web Worker消息类型
export interface WorkerMessage<T = any> {
  type: string
  payload: T
  id?: string
}

export interface WorkerResponse<T = any> {
  type: string
  payload: T
  error?: string
  id?: string
}

// 批量更新类型
export interface BatchUpdate<T> {
  type: 'set' | 'merge' | 'delete' | 'clear'
  path?: string
  value?: T
  timestamp: number
}

// 防抖/节流配置
export interface ThrottleDebounceConfig {
  delay: number
  leading: boolean
  trailing: boolean
  maxWait?: number
}