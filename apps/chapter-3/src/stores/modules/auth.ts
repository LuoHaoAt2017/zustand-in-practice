import { create } from 'zustand'
import { User, LoginCredentials, LoginResponse } from '../types'
import { mockApi } from '../mockApi'

// 认证模块状态接口
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: () => boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

// 创建认证store
export const useAuthStore = create<AuthState>((set, get) => ({
  // 初始状态
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // 计算属性：检查是否已认证
  isAuthenticated: () => {
    return !!get().token
  },

  // 登录action
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null })

    try {
      const response: LoginResponse = await mockApi.login(credentials)

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        error: null
      })
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
        user: null,
        token: null
      })
      throw error // 重新抛出错误以便组件处理
    }
  },

  // 登出action
  logout: () => {
    set({
      user: null,
      token: null,
      error: null
    })
  }
}))

// 导出选择器
export const authSelectors = {
  selectUser: (state: AuthState) => state.user,
  selectToken: (state: AuthState) => state.token,
  selectIsAuthenticated: (state: AuthState) => state.isAuthenticated(),
  selectIsLoading: (state: AuthState) => state.isLoading,
  selectError: (state: AuthState) => state.error,
}

export default useAuthStore