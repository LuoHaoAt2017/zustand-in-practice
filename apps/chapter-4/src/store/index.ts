// 第4章：复杂业务场景下的Zustand - store统一导出

// 导出类型
export * from './types'

// 导出模拟API
export * from './mockApi'

// 导出异步操作store
export * from './async'

// 导出表单状态store
export * from './form'

// 导出跨模块通信store
export * from './communication'

// 导出checkout流程store
export * from './checkout'

// 示例：组合所有store的hook
import { useComplexAsyncExample } from './async'
import { useRegisterFormStore, useLoginFormStore } from './form'
import { useCommunicationManager } from './communication'
import { useCheckoutManager } from './checkout'

export const useAllStores = () => {
  return {
    // 异步操作示例
    async: useComplexAsyncExample(),

    // 表单示例
    registerForm: useRegisterFormStore(),
    loginForm: useLoginFormStore(),

    // 跨模块通信
    communication: useCommunicationManager(),

    // Checkout流程
    checkout: useCheckoutManager()
  }
}

// 初始化函数
export const initializeChapter4 = () => {
  console.log('======= 第4章：复杂业务场景下的Zustand =======')
  console.log('初始化所有store...')

  // 初始化跨模块通信
  const communication = useCommunicationManager()
  const cleanupCommunication = communication.init()

  // 模拟一些初始数据加载
  const checkoutManager = useCheckoutManager()
  setTimeout(() => {
    console.log('预加载checkout相关数据...')
    // 在实际应用中，这里可以预加载一些数据
  }, 500)

  // 返回清理函数
  return () => {
    cleanupCommunication()
    console.log('已清理第4章所有store')
  }
}