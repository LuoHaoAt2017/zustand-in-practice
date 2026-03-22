// 第5章：Zustand性能优化实战 - store统一导出

// 导出类型
export * from './types'

// 导出模拟数据
export * from './mockData'

// 导出选择器优化store
export * from './selectorOptimization'

// 导出状态优化store
export * from './stateOptimization'

// 导出大型列表优化store
export * from './largeListOptimization'

// 组合所有store的hook
import { useOptimizedSelectors, usePerformanceDemo } from './selectorOptimization'
import { useStateOptimizationManager } from './stateOptimization'
import { useLargeListOptimizationManager } from './largeListOptimization'

export const useAllStores = () => {
  return {
    // 选择器优化
    selectors: useOptimizedSelectors(),
    performanceDemo: usePerformanceDemo(),

    // 状态优化
    stateOptimization: useStateOptimizationManager(),

    // 大型列表优化
    largeList: useLargeListOptimizationManager()
  }
}

// 初始化函数
export const initializeChapter5 = () => {
  console.log('======= 第5章：Zustand性能优化实战 =======')
  console.log('初始化性能优化示例...')

  // 启动性能监控
  const { largeList } = useAllStores()
  largeList.performanceMonitor.getState().startMonitoring()

  // 模拟一些初始数据加载
  setTimeout(() => {
    console.log('预加载性能测试数据...')
    // 这里可以触发一些初始加载
  }, 1000)

  // 返回清理函数
  return () => {
    const { largeList } = useAllStores()
    largeList.performanceMonitor.getState().stopMonitoring()
    console.log('已清理第5章所有store')
  }
}

// 性能测试工具
export const runPerformanceTests = async () => {
  console.log('🧪 开始综合性能测试...')

  const { performanceDemo, stateOptimization, largeList } = useAllStores()

  // 运行选择器性能测试
  await performanceDemo.runPerformanceTest()

  // 运行状态优化测试
  await stateOptimization.runOptimizationTests()

  // 运行大型列表测试
  await largeList.runPerformanceTests()

  console.log('🎉 所有性能测试完成！')
}

// 获取优化建议
export const getOptimizationRecommendations = () => {
  const { largeList } = useAllStores()
  const monitor = largeList.performanceMonitor

  const report = monitor.getState().generateReport()
  const suggestions = largeList.getOptimizationSuggestions()

  return {
    performanceReport: report,
    suggestions,
    config: monitor.getState().config
  }
}