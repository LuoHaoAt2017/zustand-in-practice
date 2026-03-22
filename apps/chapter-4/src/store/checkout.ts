// 第4章：复杂业务场景下的Zustand - 电商checkout流程
import { create } from 'zustand'
import { CheckoutStep, Address, PaymentMethod, Order } from './types'
import { orderApi, addressApi, paymentApi } from './mockApi'
import { eventBus } from './communication'

// Checkout状态接口
export interface CheckoutState {
  // 当前步骤
  step: CheckoutStep
  loading: boolean
  error: string | null

  // 购物车信息
  cartItems: Array<{ id: string; name: string; price: number; quantity: number }>
  cartTotal: number

  // 配送信息
  shippingAddress: Address | null
  availableAddresses: Address[]
  isAddingNewAddress: boolean

  // 支付信息
  paymentMethod: PaymentMethod | null
  availablePaymentMethods: PaymentMethod[]

  // 订单确认信息
  orderSummary: {
    subtotal: number
    shippingFee: number
    discount: number
    total: number
  }

  // Actions
  // 步骤导航
  goToStep: (step: CheckoutStep) => void
  goToNextStep: () => void
  goToPrevStep: () => void

  // 地址管理
  loadAddresses: () => Promise<void>
  selectAddress: (addressId: string) => void
  addNewAddress: (address: Omit<Address, 'id'>) => Promise<void>
  startAddingNewAddress: () => void
  cancelAddingNewAddress: () => void

  // 支付管理
  loadPaymentMethods: () => Promise<void>
  selectPaymentMethod: (methodId: string) => void

  // 订单处理
  calculateOrderSummary: () => void
  placeOrder: () => Promise<Order>
  resetCheckout: () => void
}

// 创建checkout store
export const useCheckoutStore = create<CheckoutState>((set, get) => {
  // 模拟购物车数据
  const initialCartItems = [
    { id: 'item-1', name: '智能手机', price: 2999, quantity: 1 },
    { id: 'item-2', name: '无线耳机', price: 499, quantity: 2 },
    { id: 'item-3', name: '手机壳', price: 89, quantity: 1 }
  ]

  const initialCartTotal = initialCartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  return {
    // 初始状态
    step: 'cart',
    loading: false,
    error: null,

    // 购物车
    cartItems: initialCartItems,
    cartTotal: initialCartTotal,

    // 配送
    shippingAddress: null,
    availableAddresses: [],
    isAddingNewAddress: false,

    // 支付
    paymentMethod: null,
    availablePaymentMethods: [],

    // 订单摘要
    orderSummary: {
      subtotal: initialCartTotal,
      shippingFee: 0,
      discount: 0,
      total: initialCartTotal
    },

    // ============ Actions ============

    // 步骤导航
    goToStep: (step) => {
      console.log(`跳转到步骤: ${step}`)
      set({ step })
    },

    goToNextStep: () => {
      const { step } = get()
      const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'review', 'complete']
      const currentIndex = steps.indexOf(step)

      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1]
        console.log(`下一步: ${step} -> ${nextStep}`)
        set({ step: nextStep })

        // 自动加载下一步需要的数据
        if (nextStep === 'shipping') {
          get().loadAddresses()
        } else if (nextStep === 'payment') {
          get().loadPaymentMethods()
        } else if (nextStep === 'review') {
          get().calculateOrderSummary()
        }
      }
    },

    goToPrevStep: () => {
      const { step } = get()
      const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'review', 'complete']
      const currentIndex = steps.indexOf(step)

      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1]
        console.log(`上一步: ${step} -> ${prevStep}`)
        set({ step: prevStep })
      }
    },

    // 地址管理
    loadAddresses: async () => {
      set({ loading: true, error: null })
      try {
        // 模拟用户ID，实际项目中应该从auth store获取
        const userId = 'user-123'
        const addresses = await addressApi.getUserAddresses(userId)

        set({
          availableAddresses: addresses,
          shippingAddress: addresses.find(addr => addr.isDefault) || addresses[0] || null,
          loading: false
        })

        console.log(`加载了${addresses.length}个配送地址`)
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载地址失败',
          loading: false
        })
        console.error('加载配送地址失败:', error)
      }
    },

    selectAddress: (addressId) => {
      const { availableAddresses } = get()
      const address = availableAddresses.find(addr => addr.id === addressId)

      if (address) {
        set({ shippingAddress: address })
        console.log(`选择配送地址: ${address.name} - ${address.detail}`)

        // 重新计算订单摘要（配送费可能变化）
        get().calculateOrderSummary()
      }
    },

    addNewAddress: async (addressData) => {
      set({ loading: true, error: null })
      try {
        const newAddress = await addressApi.addAddress(addressData)

        set((state) => ({
          availableAddresses: [newAddress, ...state.availableAddresses],
          shippingAddress: newAddress,
          isAddingNewAddress: false,
          loading: false
        }))

        console.log('新增配送地址成功:', newAddress)

        // 重新计算订单摘要
        get().calculateOrderSummary()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '添加地址失败',
          loading: false
        })
        console.error('添加配送地址失败:', error)
      }
    },

    startAddingNewAddress: () => {
      set({ isAddingNewAddress: true })
      console.log('开始添加新地址')
    },

    cancelAddingNewAddress: () => {
      set({ isAddingNewAddress: false })
      console.log('取消添加新地址')
    },

    // 支付管理
    loadPaymentMethods: async () => {
      set({ loading: true, error: null })
      try {
        const paymentMethods = await paymentApi.getPaymentMethods()

        set({
          availablePaymentMethods: paymentMethods,
          paymentMethod: paymentMethods[0] || null,
          loading: false
        })

        console.log(`加载了${paymentMethods.length}种支付方式`)
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载支付方式失败',
          loading: false
        })
        console.error('加载支付方式失败:', error)
      }
    },

    selectPaymentMethod: (methodId) => {
      const { availablePaymentMethods } = get()
      const method = availablePaymentMethods.find(m => m.id === methodId)

      if (method) {
        set({ paymentMethod: method })
        console.log(`选择支付方式: ${method.name}`)
      }
    },

    // 订单处理
    calculateOrderSummary: () => {
      const { cartTotal, shippingAddress } = get()

      // 计算配送费（根据地址）
      let shippingFee = 0
      if (shippingAddress) {
        // 简单逻辑：根据地区计算配送费
        if (shippingAddress.province.includes('北京') || shippingAddress.province.includes('上海')) {
          shippingFee = 10 // 一线城市
        } else if (shippingAddress.province.includes('江苏') || shippingAddress.province.includes('浙江')) {
          shippingFee = 15 // 江浙沪
        } else {
          shippingFee = 20 // 其他地区
        }

        // 购物车满199免运费
        if (cartTotal >= 199) {
          shippingFee = 0
        }
      }

      // 计算优惠（这里简单实现，实际可能更复杂）
      let discount = 0
      if (cartTotal >= 1000) {
        discount = 50 // 满1000减50
      }

      const subtotal = cartTotal
      const total = subtotal + shippingFee - discount

      const orderSummary = {
        subtotal,
        shippingFee,
        discount,
        total
      }

      set({ orderSummary })
      console.log('计算订单摘要:', orderSummary)

      return orderSummary
    },

    placeOrder: async () => {
      const { shippingAddress, paymentMethod, cartItems, orderSummary } = get()
      const userId = 'user-123' // 模拟用户ID

      // 验证必需信息
      if (!shippingAddress) {
        throw new Error('请选择配送地址')
      }
      if (!paymentMethod) {
        throw new Error('请选择支付方式')
      }
      if (cartItems.length === 0) {
        throw new Error('购物车为空')
      }

      set({ loading: true, error: null })
      console.log('开始创建订单...')

      try {
        // 准备订单数据
        const orderData = {
          userId,
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress,
          paymentMethod
        }

        // 创建订单
        const order = await orderApi.createOrder(orderData)

        // 处理支付
        const paymentResult = await paymentApi.processPayment({
          orderId: order.id,
          paymentMethodId: paymentMethod.id,
          amount: orderSummary.total
        })

        if (!paymentResult.success) {
          throw new Error('支付失败')
        }

        // 更新状态
        set({
          step: 'complete',
          loading: false,
          error: null
        })

        console.log('订单创建成功:', order)
        console.log('支付成功，交易ID:', paymentResult.transactionId)

        // 触发事件
        eventBus.emit('order:created', {
          orderId: order.id,
          total: order.total
        })

        // 发送通知事件
        eventBus.emit('form:submitted', {
          formName: 'checkout',
          success: true
        })

        return order
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '订单创建失败'
        set({
          error: errorMessage,
          loading: false
        })

        console.error('订单创建失败:', error)

        // 触发失败事件
        eventBus.emit('form:submitted', {
          formName: 'checkout',
          success: false
        })

        throw error
      }
    },

    resetCheckout: () => {
      console.log('重置checkout流程')
      set({
        step: 'cart',
        loading: false,
        error: null,
        shippingAddress: null,
        paymentMethod: null,
        isAddingNewAddress: false
        // 注意：不重置购物车数据，因为用户可能想重新购买
      })
    }
  }
})

// Checkout流程管理器
export const useCheckoutManager = () => {
  const checkoutStore = useCheckoutStore

  return {
    // store状态
    state: checkoutStore,

    // 快捷方法
    getCurrentStep: () => checkoutStore.getState().step,
    isStepComplete: (step: CheckoutStep) => {
      const currentStep = checkoutStore.getState().step
      const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'review', 'complete']
      return steps.indexOf(currentStep) >= steps.indexOf(step)
    },

    // 流程控制
    startCheckout: () => {
      console.log('开始checkout流程')
      checkoutStore.getState().goToStep('cart')
    },

    completeCheckout: async () => {
      try {
        const order = await checkoutStore.getState().placeOrder()
        return { success: true, order }
      } catch (error) {
        return { success: false, error }
      }
    },

    // 验证当前步骤
    validateCurrentStep: () => {
      const { step, shippingAddress, paymentMethod, cartItems } = checkoutStore.getState()

      switch (step) {
        case 'cart':
          return cartItems.length > 0 ? { valid: true } : { valid: false, message: '购物车为空' }
        case 'shipping':
          return shippingAddress ? { valid: true } : { valid: false, message: '请选择配送地址' }
        case 'payment':
          return paymentMethod ? { valid: true } : { valid: false, message: '请选择支付方式' }
        case 'review':
          return { valid: true } // 前面步骤都通过了，review步骤总是有效
        default:
          return { valid: false, message: '未知步骤' }
      }
    },

    // 获取步骤详情
    getStepDetails: () => {
      const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'review', 'complete']
      return steps.map((step, index) => ({
        step,
        index,
        title: getStepTitle(step),
        description: getStepDescription(step),
        isCurrent: checkoutStore.getState().step === step,
        isCompleted: steps.indexOf(checkoutStore.getState().step) > index
      }))
    }
  }
}

// 辅助函数
const getStepTitle = (step: CheckoutStep): string => {
  switch (step) {
    case 'cart': return '购物车'
    case 'shipping': return '配送信息'
    case 'payment': return '支付方式'
    case 'review': return '订单确认'
    case 'complete': return '完成'
    default: return step
  }
}

const getStepDescription = (step: CheckoutStep): string => {
  switch (step) {
    case 'cart': return '确认购物车商品'
    case 'shipping': return '填写配送地址'
    case 'payment': return '选择支付方式'
    case 'review': return '确认订单信息'
    case 'complete': return '订单创建完成'
    default: return ''
  }
}