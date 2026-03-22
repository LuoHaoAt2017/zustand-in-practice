# 第 4 章：复杂业务场景下的 Zustand（异步、表单、跨模块）

## 概述
在真实业务场景中，我们需要处理复杂的异步操作、表单状态管理和跨模块通信。本章将深入探讨如何在这些复杂场景下高效使用Zustand。

## 学习目标
- 掌握复杂异步操作的处理模式
- 学习表单状态管理的最佳实践
- 理解跨模块通信的多种方案
- 掌握错误处理和加载状态管理

## 异步操作处理

### 基础异步模式
```typescript
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  reset: () => void
}

const createAsyncStore = <T>(fetcher: () => Promise<T>) => {
  return create<AsyncState<T>>((set) => ({
    data: null,
    loading: false,
    error: null,
    fetch: async () => {
      set({ loading: true, error: null })
      try {
        const data = await fetcher()
        set({ data, loading: false })
      } catch (error) {
        set({ error: error.message, loading: false })
      }
    },
    reset: () => set({ data: null, loading: false, error: null }),
  }))
}

// 使用
const useProductsStore = createAsyncStore(() => api.getProducts())
```

### 高级异步模式：带参数和缓存
```typescript
interface PaginatedState<T> {
  items: T[]
  page: number
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  fetchPage: (page: number, force?: boolean) => Promise<void>
  loadMore: () => Promise<void>
}

const createPaginatedStore = <T>(fetcher: (page: number) => Promise<PaginatedResponse<T>>) => {
  return create<PaginatedState<T>>((set, get) => ({
    items: [],
    page: 0,
    total: 0,
    loading: false,
    error: null,
    get hasMore() {
      const { items, total } = get()
      return items.length < total
    },

    fetchPage: async (page, force = false) => {
      // 避免重复请求
      if (get().loading) return

      set({ loading: true, error: null })
      try {
        const response = await fetcher(page)
        set((state) => ({
          items: page === 1 || force ? response.items : [...state.items, ...response.items],
          page,
          total: response.total,
          loading: false,
        }))
      } catch (error) {
        set({ error: error.message, loading: false })
      }
    },

    loadMore: async () => {
      const { page, hasMore } = get()
      if (hasMore && !get().loading) {
        await get().fetchPage(page + 1)
      }
    },
  }))
}
```

### 竞态处理
```typescript
const useSearchStore = create((set, get) => {
  let currentRequestId = 0

  return {
    query: '',
    results: [],
    loading: false,

    search: async (query: string) => {
      const requestId = ++currentRequestId
      set({ query, loading: true })

      try {
        const results = await api.search(query)

        // 只处理最新的请求结果
        if (requestId === currentRequestId) {
          set({ results, loading: false })
        }
      } catch (error) {
        if (requestId === currentRequestId) {
          set({ loading: false })
        }
      }
    },
  }
})
```

## 表单状态管理

### 基础表单store
```typescript
interface FormField<T> {
  value: T
  error?: string
  touched: boolean
}

interface FormState {
  fields: Record<string, FormField<any>>
  submitting: boolean
  isValid: boolean

  setFieldValue: (name: string, value: any) => void
  setFieldError: (name: string, error?: string) => void
  setFieldTouched: (name: string, touched: boolean) => void
  validateForm: () => boolean
  submit: () => Promise<void>
  reset: () => void
}

const createFormStore = (initialValues: Record<string, any>, validator?: FormValidator) => {
  return create<FormState>((set, get) => {
    const initialFields = Object.entries(initialValues).reduce((acc, [key, value]) => {
      acc[key] = { value, touched: false }
      return acc
    }, {} as Record<string, FormField<any>>)

    return {
      fields: initialFields,
      submitting: false,
      get isValid() {
        if (!validator) return true
        return validator.validate(get().fields)
      },

      setFieldValue: (name, value) => {
        set((state) => ({
          fields: {
            ...state.fields,
            [name]: { ...state.fields[name], value },
          },
        }))
      },

      setFieldError: (name, error) => {
        set((state) => ({
          fields: {
            ...state.fields,
            [name]: { ...state.fields[name], error },
          },
        }))
      },

      setFieldTouched: (name, touched) => {
        set((state) => ({
          fields: {
            ...state.fields,
            [name]: { ...state.fields[name], touched },
          },
        }))
      },

      validateForm: () => {
        if (!validator) return true
        const { fields } = get()
        const errors = validator.validateAll(fields)

        Object.entries(errors).forEach(([name, error]) => {
          get().setFieldError(name, error)
        })

        return Object.keys(errors).length === 0
      },

      submit: async () => {
        if (!get().validateForm()) return

        set({ submitting: true })
        try {
          const values = Object.entries(get().fields).reduce((acc, [key, field]) => {
            acc[key] = field.value
            return acc
          }, {} as Record<string, any>)

          await api.submitForm(values)
          set({ submitting: false })
        } catch (error) {
          set({ submitting: false })
          throw error
        }
      },

      reset: () => set({ fields: initialFields, submitting: false }),
    }
  })
}
```

### 表单组件集成
```typescript
// hooks/useFormField.ts
export const useFormField = (name: string) => {
  const field = useFormStore((state) => state.fields[name])
  const setValue = useFormStore((state) => state.setFieldValue)
  const setTouched = useFormStore((state) => state.setFieldTouched)

  return {
    value: field?.value || '',
    error: field?.error,
    touched: field?.touched || false,
    onChange: (value: any) => setValue(name, value),
    onBlur: () => setTouched(name, true),
  }
}

// 组件中使用
function EmailInput() {
  const { value, error, touched, onChange, onBlur } = useFormField('email')

  return (
    <div>
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {touched && error && <span className="error">{error}</span>}
    </div>
  )
}
```

## 跨模块通信

### 模式1：事件总线模式
```typescript
// store/events.ts
interface EventMap {
  'user:loggedIn': { userId: string }
  'cart:updated': { itemCount: number }
  'order:created': { orderId: string }
}

type EventName = keyof EventMap
type EventHandler<T extends EventName> = (data: EventMap[T]) => void

const createEventBus = () => {
  const listeners = new Map<EventName, Set<Function>>()

  return {
    on<T extends EventName>(event: T, handler: EventHandler<T>) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set())
      }
      listeners.get(event)!.add(handler as Function)

      return () => {
        listeners.get(event)?.delete(handler as Function)
      }
    },

    emit<T extends EventName>(event: T, data: EventMap[T]) {
      listeners.get(event)?.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    },
  }
}

export const eventBus = createEventBus()

// 在其他store中使用
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => {
    set((state) => ({ items: [...state.items, item] }))
    eventBus.emit('cart:updated', { itemCount: get().items.length + 1 })
  },
}))

const useNotificationStore = create(() => ({
  notifications: [],

  init: () => {
    // 监听购物车更新事件
    return eventBus.on('cart:updated', ({ itemCount }) => {
      console.log(`购物车已更新，当前有 ${itemCount} 件商品`)
    })
  },
}))
```

### 模式2：观察者模式
```typescript
// store/observers.ts
const createObserverStore = () => {
  return create<{
    observers: Map<string, Set<Function>>
    subscribe: (key: string, callback: Function) => () => void
    notify: (key: string, data?: any) => void
  }>((set, get) => ({
    observers: new Map(),

    subscribe: (key, callback) => {
      if (!get().observers.has(key)) {
        get().observers.set(key, new Set())
      }
      get().observers.get(key)!.add(callback)

      return () => {
        get().observers.get(key)?.delete(callback)
      }
    },

    notify: (key, data) => {
      get().observers.get(key)?.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in observer for ${key}:`, error)
        }
      })
    },
  }))
}

export const useObserverStore = createObserverStore()

// 模块间通信示例
const useModuleA = create((set, get) => ({
  data: null,
  fetchData: async () => {
    const data = await api.getData()
    set({ data })

    // 通知其他模块
    useObserverStore.getState().notify('moduleA:dataFetched', data)
  },
}))

const useModuleB = create(() => ({
  relatedData: null,

  init: () => {
    // 订阅moduleA的事件
    return useObserverStore.getState().subscribe('moduleA:dataFetched', (data) => {
      // 根据moduleA的数据更新自己的状态
      useModuleB.setState({ relatedData: processData(data) })
    })
  },
}))
```

### 模式3：共享派生状态
```typescript
// store/derived.ts
export const useDerivedState = () => {
  const user = useAuthStore((state) => state.user)
  const cartItems = useCartStore((state) => state.items)
  const products = useProductStore((state) => state.products)

  // 派生状态：用户购物车总价值
  const cartTotalValue = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      return total + (product?.price || 0) * item.quantity
    }, 0)
  }, [cartItems, products])

  // 派生状态：用户是否是VIP（基于订单历史）
  const isVIP = useMemo(() => {
    if (!user) return false
    // 根据业务逻辑判断
    return cartTotalValue > 1000 // 示例：消费超过1000为VIP
  }, [user, cartTotalValue])

  return {
    cartTotalValue,
    isVIP,
  }
}
```

## 复杂业务场景示例

### 场景：电商 checkout 流程
```typescript
// store/checkout.ts
interface CheckoutState {
  step: 'cart' | 'shipping' | 'payment' | 'review'
  shippingAddress: Address | null
  paymentMethod: PaymentMethod | null
  loading: boolean
  error: string | null

  // Actions
  setShippingAddress: (address: Address) => void
  setPaymentMethod: (method: PaymentMethod) => void
  goToNextStep: () => void
  goToPrevStep: () => void
  placeOrder: () => Promise<Order>
}

const useCheckoutStore = create<CheckoutState>((set, get) => {
  // 依赖其他store
  const cartStore = useCartStore
  const authStore = useAuthStore
  const orderStore = useOrderStore

  return {
    step: 'cart',
    shippingAddress: null,
    paymentMethod: null,
    loading: false,
    error: null,

    setShippingAddress: (address) => set({ shippingAddress: address }),
    setPaymentMethod: (method) => set({ paymentMethod: method }),

    goToNextStep: () => {
      const { step } = get()
      const steps: CheckoutState['step'][] = ['cart', 'shipping', 'payment', 'review']
      const currentIndex = steps.indexOf(step)
      if (currentIndex < steps.length - 1) {
        set({ step: steps[currentIndex + 1] })
      }
    },

    goToPrevStep: () => {
      const { step } = get()
      const steps: CheckoutState['step'][] = ['cart', 'shipping', 'payment', 'review']
      const currentIndex = steps.indexOf(step)
      if (currentIndex > 0) {
        set({ step: steps[currentIndex - 1] })
      }
    },

    placeOrder: async () => {
      const { shippingAddress, paymentMethod } = get()
      const { items } = cartStore.getState()
      const { user } = authStore.getState()

      if (!user) throw new Error('用户未登录')
      if (!shippingAddress) throw new Error('请选择配送地址')
      if (!paymentMethod) throw new Error('请选择支付方式')
      if (items.length === 0) throw new Error('购物车为空')

      set({ loading: true, error: null })
      try {
        const order = await orderStore.getState().createOrder({
          userId: user.id,
          items,
          shippingAddress,
          paymentMethod,
        })

        // 清空购物车
        cartStore.getState().clearCart()
        // 重置checkout状态
        set({
          step: 'cart',
          shippingAddress: null,
          paymentMethod: null,
          loading: false,
        })

        return order
      } catch (error) {
        set({ error: error.message, loading: false })
        throw error
      }
    },
  }
})
```

## 本章案例设计

### 案例：用户注册表单 + 异步验证
我们将实现一个完整的用户注册流程，包含：
1. **表单管理**：多字段表单状态管理
2. **异步验证**：实时检查用户名/邮箱是否可用
3. **跨模块通信**：注册成功后自动登录并更新用户状态
4. **错误处理**：表单验证错误和API错误处理

### 技术要点
- 表单store设计
- 防抖异步验证
- 竞态处理
- 跨store状态同步

## 总结
在复杂业务场景下，Zustand提供了灵活的模式来处理异步操作、表单状态和跨模块通信。通过合理的设计模式，可以构建出健壮、可维护的状态管理方案。

---

**下一章**：我们将深入探讨Zustand的性能优化技巧。
