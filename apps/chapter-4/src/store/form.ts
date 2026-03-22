// 第4章：复杂业务场景下的Zustand - 表单状态管理
import { create } from 'zustand'
import { FormField, FormValidator } from './types'
import { userApi, validationApi } from './mockApi'

// 基础表单状态接口
export interface FormState {
  fields: Record<string, FormField>
  submitting: boolean
  isValid: boolean
  submitError: string | null
  submitSuccess: boolean

  // 字段操作
  setFieldValue: (name: string, value: any) => void
  setFieldError: (name: string, error?: string) => void
  setFieldTouched: (name: string, touched: boolean) => void
  validateField: (name: string) => Promise<void>
  validateAllFields: () => Promise<boolean>

  // 表单操作
  submit: () => Promise<boolean>
  reset: () => void
  clearErrors: () => void
}

// 表单配置
export interface FormConfig {
  initialValues: Record<string, any>
  validators?: Record<string, (value: any) => string | undefined>
  asyncValidators?: Record<string, (value: any) => Promise<string | undefined>>
  onSubmit: (values: Record<string, any>) => Promise<any>
}

// 创建表单store的工厂函数
export const createFormStore = (config: FormConfig) => {
  const { initialValues, validators = {}, asyncValidators = {}, onSubmit } = config

  // 初始化字段
  const initialFields = Object.entries(initialValues).reduce((acc, [key, value]) => {
    acc[key] = { value, touched: false }
    return acc
  }, {} as Record<string, FormField>)

  return create<FormState>((set, get) => ({
    fields: initialFields,
    submitting: false,
    isValid: true,
    submitError: null,
    submitSuccess: false,

    // 设置字段值
    setFieldValue: (name, value) => {
      const field = get().fields[name]
      if (!field) return

      set((state) => ({
        fields: {
          ...state.fields,
          [name]: { ...field, value, error: undefined }
        }
      }))

      // 自动验证（如果字段已被触摸）
      if (field.touched) {
        get().validateField(name)
      }
    },

    // 设置字段错误
    setFieldError: (name, error) => {
      const field = get().fields[name]
      if (!field) return

      set((state) => ({
        fields: {
          ...state.fields,
          [name]: { ...field, error }
        }
      }))
    },

    // 设置字段触摸状态
    setFieldTouched: (name, touched) => {
      const field = get().fields[name]
      if (!field) return

      set((state) => ({
        fields: {
          ...state.fields,
          [name]: { ...field, touched }
        }
      }))

      // 第一次触摸时进行验证
      if (touched && !field.touched) {
        get().validateField(name)
      }
    },

    // 验证单个字段
    validateField: async (name) => {
      const field = get().fields[name]
      if (!field) return

      // 同步验证
      const syncValidator = validators[name]
      if (syncValidator) {
        const error = syncValidator(field.value)
        if (error) {
          get().setFieldError(name, error)
          return
        }
      }

      // 异步验证
      const asyncValidator = asyncValidators[name]
      if (asyncValidator) {
        try {
          const error = await asyncValidator(field.value)
          if (error) {
            get().setFieldError(name, error)
          } else {
            get().setFieldError(name, undefined)
          }
        } catch (error) {
          get().setFieldError(name, '验证过程出错')
        }
      } else {
        // 没有异步验证器时清除错误
        get().setFieldError(name, undefined)
      }
    },

    // 验证所有字段
    validateAllFields: async () => {
      const { fields } = get()
      let isValid = true

      // 首先标记所有字段为已触摸
      Object.keys(fields).forEach(name => {
        get().setFieldTouched(name, true)
      })

      // 验证所有字段
      const validationPromises = Object.keys(fields).map(name => get().validateField(name))
      await Promise.all(validationPromises)

      // 检查是否有错误
      const updatedFields = get().fields
      const hasErrors = Object.values(updatedFields).some(field => field.error)

      set({ isValid: !hasErrors })
      return !hasErrors
    },

    // 提交表单
    submit: async () => {
      // 验证所有字段
      const isValid = await get().validateAllFields()
      if (!isValid) {
        console.log('表单验证失败，无法提交')
        return false
      }

      set({ submitting: true, submitError: null, submitSuccess: false })

      try {
        // 收集表单值
        const values = Object.entries(get().fields).reduce((acc, [key, field]) => {
          acc[key] = field.value
          return acc
        }, {} as Record<string, any>)

        console.log('提交表单数据:', values)
        const result = await onSubmit(values)

        set({
          submitting: false,
          submitSuccess: true,
          submitError: null
        })

        console.log('表单提交成功:', result)
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '提交失败'
        set({
          submitting: false,
          submitSuccess: false,
          submitError: errorMessage
        })

        console.error('表单提交失败:', error)
        return false
      }
    },

    // 重置表单
    reset: () => {
      set({
        fields: initialFields,
        submitting: false,
        isValid: true,
        submitError: null,
        submitSuccess: false
      })
      console.log('表单已重置')
    },

    // 清除所有错误
    clearErrors: () => {
      const { fields } = get()
      const updatedFields = { ...fields }
      Object.keys(updatedFields).forEach(name => {
        updatedFields[name] = { ...updatedFields[name], error: undefined }
      })

      set({
        fields: updatedFields,
        isValid: true,
        submitError: null
      })
      console.log('已清除所有错误')
    }
  }))
}

// 示例：用户注册表单
export const useRegisterFormStore = createFormStore({
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  },

  validators: {
    username: (value) => {
      if (!value) return '用户名不能为空'
      if (value.length < 3) return '用户名至少3个字符'
      if (value.length > 20) return '用户名最多20个字符'
      return undefined
    },
    email: (value) => {
      if (!value) return '邮箱不能为空'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return '邮箱格式不正确'
      return undefined
    },
    password: (value) => {
      if (!value) return '密码不能为空'
      if (value.length < 6) return '密码至少6个字符'
      return undefined
    },
    confirmPassword: (value) => {
      // 这个验证需要访问其他字段，所以在validateAllFields中处理
      return undefined
    },
    agreeToTerms: (value) => {
      if (!value) return '请同意服务条款'
      return undefined
    }
  },

  asyncValidators: {
    username: async (value) => {
      if (!value || value.length < 3) return undefined
      try {
        const available = await userApi.checkUsernameAvailable(value)
        return available ? undefined : '用户名已存在'
      } catch {
        return '验证服务暂时不可用'
      }
    },
    email: async (value) => {
      if (!value) return undefined
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return undefined // 格式错误已在同步验证中处理

      try {
        const available = await userApi.checkEmailAvailable(value)
        return available ? undefined : '邮箱已被注册'
      } catch {
        return '验证服务暂时不可用'
      }
    }
  },

  onSubmit: async (values) => {
    // 额外验证：确认密码
    if (values.password !== values.confirmPassword) {
      throw new Error('两次输入的密码不一致')
    }

    return await userApi.register({
      name: values.username,
      email: values.email,
      password: values.password
    })
  }
})

// 示例：登录表单
export const useLoginFormStore = createFormStore({
  initialValues: {
    email: '',
    password: '',
    rememberMe: false
  },

  validators: {
    email: (value) => {
      if (!value) return '邮箱不能为空'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return '邮箱格式不正确'
      return undefined
    },
    password: (value) => {
      if (!value) return '密码不能为空'
      return undefined
    }
  },

  onSubmit: async (values) => {
    return await userApi.login({
      email: values.email,
      password: values.password
    })
  }
})

// 表单字段hook（用于组件集成）
export const useFormField = (store: ReturnType<typeof createFormStore>, name: string) => {
  const field = store((state) => state.fields[name])
  const setValue = store((state) => state.setFieldValue)
  const setTouched = store((state) => state.setFieldTouched)
  const validateField = store((state) => state.validateField)

  return {
    value: field?.value || '',
    error: field?.error,
    touched: field?.touched || false,
    onChange: (value: any) => {
      setValue(name, value)
    },
    onBlur: () => {
      setTouched(name, true)
      validateField(name)
    }
  }
}