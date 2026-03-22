// 第4章：复杂业务场景下的Zustand - 跨模块通信
import { create } from 'zustand'
import { EventName, EventMap } from './types'

// ==================== 模式1：事件总线模式 ====================

// 事件总线接口
interface EventBus {
  on<T extends EventName>(event: T, handler: (data: EventMap[T]) => void): () => void
  emit<T extends EventName>(event: T, data: EventMap[T]): void
  off<T extends EventName>(event: T, handler: (data: EventMap[T]) => void): void
  clear(event?: EventName): void
}

// 创建事件总线
const createEventBus = (): EventBus => {
  const listeners = new Map<EventName, Set<Function>>()

  return {
    on<T extends EventName>(event: T, handler: (data: EventMap[T]) => void) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set())
      }
      listeners.get(event)!.add(handler as Function)

      // 返回取消订阅函数
      return () => {
        this.off(event, handler)
      }
    },

    emit<T extends EventName>(event: T, data: EventMap[T]) {
      const eventListeners = listeners.get(event)
      if (!eventListeners) return

      console.log(`📡 事件触发: ${event}`, data)
      eventListeners.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`事件处理器错误 ${event}:`, error)
        }
      })
    },

    off<T extends EventName>(event: T, handler: (data: EventMap[T]) => void) {
      const eventListeners = listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(handler as Function)
        if (eventListeners.size === 0) {
          listeners.delete(event)
        }
      }
    },

    clear(event?: EventName) {
      if (event) {
        listeners.delete(event)
      } else {
        listeners.clear()
      }
      console.log(event ? `已清除事件: ${event}` : '已清除所有事件')
    }
  }
}

// 全局事件总线实例
export const eventBus = createEventBus()

// ==================== 模式2：观察者模式 ====================

// 观察者store接口
interface ObserverStore {
  observers: Map<string, Set<Function>>
  subscribe: (key: string, callback: Function) => () => void
  notify: (key: string, data?: any) => void
  unsubscribe: (key: string, callback: Function) => void
  clear: (key?: string) => void
}

// 创建观察者store
export const useObserverStore = create<ObserverStore>((set, get) => ({
  observers: new Map(),

  subscribe: (key, callback) => {
    const { observers } = get()
    if (!observers.has(key)) {
      observers.set(key, new Set())
    }
    observers.get(key)!.add(callback)

    console.log(`👁️ 观察者订阅: ${key}，当前观察者数量: ${observers.get(key)!.size}`)

    // 返回取消订阅函数
    return () => {
      get().unsubscribe(key, callback)
    }
  },

  notify: (key, data) => {
    const { observers } = get()
    const callbacks = observers.get(key)
    if (!callbacks || callbacks.size === 0) return

    console.log(`📢 通知观察者: ${key}`, data)
    callbacks.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`观察者回调错误 ${key}:`, error)
      }
    })
  },

  unsubscribe: (key, callback) => {
    const { observers } = get()
    const callbacks = observers.get(key)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        observers.delete(key)
      }
      console.log(`👋 观察者取消订阅: ${key}，剩余观察者数量: ${callbacks.size}`)
    }
  },

  clear: (key) => {
    const { observers } = get()
    if (key) {
      observers.delete(key)
      console.log(`已清除观察者: ${key}`)
    } else {
      observers.clear()
      console.log('已清除所有观察者')
    }
  }
}))

// ==================== 模式3：共享派生状态 ====================

// 示例：基于多个store的派生状态
export const useDerivedState = () => {
  // 注意：这里只是类型示例，实际使用时需要导入具体的store
  // 在实际项目中，这些store应该从其他模块导入

  return {
    // 示例派生状态1：用户购物车总价值
    // cartTotalValue: cartItems.reduce((total, item) => {
    //   const product = products.find(p => p.id === item.productId)
    //   return total + (product?.price || 0) * item.quantity
    // }, 0),

    // 示例派生状态2：用户是否是VIP
    // isVIP: user && cartTotalValue > 1000
  }
}

// ==================== 模块间通信示例 ====================

// 示例1：购物车store（使用事件总线）
export const createCartStoreWithEvents = () => {
  return create<{
    items: Array<{ id: string; name: string; price: number; quantity: number }>
    addItem: (item: { id: string; name: string; price: number }) => void
    removeItem: (itemId: string) => void
    clearCart: () => void
  }>((set, get) => ({
    items: [],

    addItem: (item) => {
      set((state) => {
        const existingItem = state.items.find(i => i.id === item.id)
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          }
        } else {
          return {
            items: [...state.items, { ...item, quantity: 1 }]
          }
        }
      })

      // 触发事件
      const { items } = get()
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      eventBus.emit('cart:updated', { itemCount, total })
      eventBus.emit('cart:itemAdded', {
        productId: item.id,
        productName: item.name,
        quantity: 1
      })
    },

    removeItem: (itemId) => {
      set((state) => {
        const item = state.items.find(i => i.id === itemId)
        if (!item) return state

        eventBus.emit('cart:itemRemoved', {
          productId: item.id,
          productName: item.name
        })

        return {
          items: state.items.filter(i => i.id !== itemId)
        }
      })

      const { items } = get()
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      eventBus.emit('cart:updated', { itemCount, total })
    },

    clearCart: () => {
      set({ items: [] })
      eventBus.emit('cart:updated', { itemCount: 0, total: 0 })
    }
  }))
}

// 示例2：通知store（监听事件）
export const createNotificationStoreWithEvents = () => {
  return create<{
    notifications: Array<{ id: string; type: string; message: string; timestamp: Date }>
    addNotification: (type: string, message: string) => void
    removeNotification: (id: string) => void
    clearNotifications: () => void
    initEventListeners: () => () => void // 返回清理函数
  }>((set, get) => ({
    notifications: [],

    addNotification: (type, message) => {
      const newNotification = {
        id: `notif-${Date.now()}`,
        type,
        message,
        timestamp: new Date()
      }

      set((state) => ({
        notifications: [newNotification, ...state.notifications].slice(0, 10) // 最多保留10条
      }))

      console.log(`📨 新通知: [${type}] ${message}`)
    },

    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }))
    },

    clearNotifications: () => {
      set({ notifications: [] })
    },

    initEventListeners: () => {
      console.log('初始化通知store事件监听器')

      // 监听购物车事件
      const unsubscribeCartUpdated = eventBus.on('cart:updated', ({ itemCount, total }) => {
        get().addNotification('info', `购物车已更新，共${itemCount}件商品，总计¥${total}`)
      })

      const unsubscribeCartItemAdded = eventBus.on('cart:itemAdded', ({ productName }) => {
        get().addNotification('success', `已添加 "${productName}" 到购物车`)
      })

      const unsubscribeCartItemRemoved = eventBus.on('cart:itemRemoved', ({ productName }) => {
        get().addNotification('warning', `已从购物车移除 "${productName}"`)
      })

      // 监听用户事件
      const unsubscribeUserLoggedIn = eventBus.on('user:loggedIn', ({ userName }) => {
        get().addNotification('success', `欢迎回来，${userName}!`)
      })

      const unsubscribeUserLoggedOut = eventBus.on('user:loggedOut', () => {
        get().addNotification('info', '您已成功登出')
      })

      // 监听订单事件
      const unsubscribeOrderCreated = eventBus.on('order:created', ({ orderId, total }) => {
        get().addNotification('success', `订单 #${orderId} 创建成功，金额: ¥${total}`)
      })

      // 返回清理函数
      return () => {
        unsubscribeCartUpdated()
        unsubscribeCartItemAdded()
        unsubscribeCartItemRemoved()
        unsubscribeUserLoggedIn()
        unsubscribeUserLoggedOut()
        unsubscribeOrderCreated()
        console.log('已清理通知store事件监听器')
      }
    }
  }))
}

// ==================== 跨模块通信管理器 ====================

export const useCommunicationManager = () => {
  // 创建示例store实例
  const cartStore = createCartStoreWithEvents()
  const notificationStore = createNotificationStoreWithEvents()

  return {
    // store实例
    cart: cartStore,
    notifications: notificationStore,

    // 事件总线
    eventBus,

    // 观察者store
    observerStore: useObserverStore,

    // 初始化所有通信
    init: () => {
      console.log('初始化跨模块通信系统...')

      // 初始化事件监听
      const cleanupNotifications = notificationStore.getState().initEventListeners()

      // 触发一些示例事件
      setTimeout(() => {
        eventBus.emit('user:loggedIn', { userId: 'user-123', userName: '测试用户' })
      }, 1000)

      setTimeout(() => {
        eventBus.emit('product:searched', { query: '手机', resultCount: 24 })
      }, 2000)

      // 返回清理函数
      return () => {
        cleanupNotifications()
        eventBus.clear()
        useObserverStore.getState().clear()
        console.log('已清理跨模块通信系统')
      }
    }
  }
}