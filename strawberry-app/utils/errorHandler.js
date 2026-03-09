// utils/errorHandler.js — 统一错误处理模块
// 提供错误分类、用户友好消息、日志记录和重试机制

/**
 * 错误类型枚举
 */
export const ERROR_TYPES = {
  NETWORK: 'network',           // 网络错误
  AUTH: 'auth',                 // 认证错误（API Key无效等）
  RATE_LIMIT: 'rate_limit',     // 频率限制
  SERVER: 'server',             // 服务器错误（5xx）
  CLIENT: 'client',             // 客户端错误（4xx）
  VALIDATION: 'validation',     // 数据验证错误
  TIMEOUT: 'timeout',           // 超时错误
  UNKNOWN: 'unknown'            // 未知错误
}

/**
 * 错误严重程度
 */
export const ERROR_SEVERITY = {
  LOW: 'low',       // 低影响，可自动恢复
  MEDIUM: 'medium', // 中等影响，需要用户注意
  HIGH: 'high'      // 高影响，功能不可用
}

/**
 * 错误信息映射（用户友好消息）
 */
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    [ERROR_SEVERITY.LOW]: '网络不稳定，请检查连接',
    [ERROR_SEVERITY.MEDIUM]: '网络连接失败，请检查网络设置',
    [ERROR_SEVERITY.HIGH]: '无法连接到服务器，请检查网络'
  },
  [ERROR_TYPES.AUTH]: {
    [ERROR_SEVERITY.MEDIUM]: 'API Key 无效或已过期，请检查设置',
    [ERROR_SEVERITY.HIGH]: '认证失败，请重新配置API密钥'
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    [ERROR_SEVERITY.MEDIUM]: '请求频率超限，请稍后再试',
    [ERROR_SEVERITY.HIGH]: 'API调用额度已用尽，请检查配额'
  },
  [ERROR_TYPES.SERVER]: {
    [ERROR_SEVERITY.MEDIUM]: '服务器暂时不可用，请稍后再试',
    [ERROR_SEVERITY.HIGH]: '服务器错误，请联系管理员'
  },
  [ERROR_TYPES.CLIENT]: {
    [ERROR_SEVERITY.LOW]: '请求参数有误',
    [ERROR_SEVERITY.MEDIUM]: '请求格式错误，请检查输入'
  },
  [ERROR_TYPES.TIMEOUT]: {
    [ERROR_SEVERITY.MEDIUM]: '请求超时，请检查网络连接',
    [ERROR_SEVERITY.HIGH]: '连接超时，服务器响应缓慢'
  },
  [ERROR_TYPES.VALIDATION]: {
    [ERROR_SEVERITY.LOW]: '输入格式不正确',
    [ERROR_SEVERITY.MEDIUM]: '请检查输入内容是否符合要求'
  },
  [ERROR_TYPES.UNKNOWN]: {
    [ERROR_SEVERITY.MEDIUM]: '发生未知错误，请重试',
    [ERROR_SEVERITY.HIGH]: '系统错误，请重启应用或联系支持'
  }
}

/**
 * 错误分类器
 * @param {Error|string|Object} error 原始错误
 * @param {Object} context 错误上下文（API类型、请求信息等）
 * @returns {Object} 分类后的错误信息
 */
export function classifyError(error, context = {}) {
  const errorObj = normalizeError(error)
  const { message, status, code } = errorObj

  // 根据错误消息和状态码分类
  let type = ERROR_TYPES.UNKNOWN
  let severity = ERROR_SEVERITY.MEDIUM

  // 网络相关错误
  if (
    message.includes('network') ||
    message.includes('Network') ||
    message.includes('fetch') ||
    message.includes('Internet') ||
    status === 0 // 通常表示网络错误
  ) {
    type = ERROR_TYPES.NETWORK
    severity = message.includes('timeout') ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.MEDIUM
  }
  // 超时错误
  else if (message.includes('timeout') || message.includes('Timeout')) {
    type = ERROR_TYPES.TIMEOUT
    severity = ERROR_SEVERITY.MEDIUM
  }
  // 认证错误
  else if (
    message.includes('auth') ||
    message.includes('Auth') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('invalid key') ||
    message.includes('API key')
  ) {
    type = ERROR_TYPES.AUTH
    severity = ERROR_SEVERITY.HIGH
  }
  // 频率限制
  else if (message.includes('rate') || message.includes('429') || message.includes('limit')) {
    type = ERROR_TYPES.RATE_LIMIT
    severity = ERROR_SEVERITY.MEDIUM
  }
  // 服务器错误
  else if (status >= 500 || message.includes('server') || message.includes('Server')) {
    type = ERROR_TYPES.SERVER
    severity = ERROR_SEVERITY.HIGH
  }
  // 客户端错误
  else if (status >= 400 && status < 500) {
    type = ERROR_TYPES.CLIENT
    severity = ERROR_SEVERITY.MEDIUM
  }

  // 根据上下文调整严重程度
  if (context.critical) {
    severity = ERROR_SEVERITY.HIGH
  }

  return {
    type,
    severity,
    originalError: errorObj,
    message: errorObj.message,
    status: errorObj.status,
    code: errorObj.code,
    timestamp: Date.now(),
    context
  }
}

/**
 * 标准化错误对象
 * @param {*} error 各种格式的错误
 * @returns {Object} 标准化的错误对象
 */
function normalizeError(error) {
  if (error instanceof Error) {
    // 提取状态码等信息
    const statusMatch = error.message.match(/\b(\d{3})\b/)
    const status = statusMatch ? parseInt(statusMatch[1]) : 0

    return {
      message: error.message,
      stack: error.stack,
      status,
      code: error.code
    }
  } else if (typeof error === 'string') {
    return { message: error, status: 0, code: null }
  } else if (typeof error === 'object' && error !== null) {
    return {
      message: error.message || error.error || '未知错误',
      status: error.status || error.statusCode || 0,
      code: error.code || null,
      ...error
    }
  }

  return { message: '未知错误', status: 0, code: null }
}

/**
 * 获取用户友好的错误消息
 * @param {Object} classifiedError 分类后的错误信息
 * @param {string} customMessage 自定义消息（可选）
 * @returns {string} 用户友好的错误消息
 */
export function getUserFriendlyMessage(classifiedError, customMessage = null) {
  if (customMessage) {
    return customMessage
  }

  const { type, severity } = classifiedError
  const messageMap = ERROR_MESSAGES[type]

  if (messageMap && messageMap[severity]) {
    return messageMap[severity]
  }

  // 默认消息
  return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN][ERROR_SEVERITY.MEDIUM]
}

/**
 * 统一错误处理函数
 * @param {Error|string|Object} error 原始错误
 * @param {Object} options 处理选项
 * @returns {Object} 处理结果
 */
export function handleError(error, options = {}) {
  const {
    context = {},
    showToast = true,
    logToConsole = true,
    autoRetry = false,
    maxRetries = 3,
    customMessage = null
  } = options

  // 分类错误
  const classifiedError = classifyError(error, context)

  // 获取用户友好消息
  const userMessage = getUserFriendlyMessage(classifiedError, customMessage)

  // 显示 Toast 提示
  if (showToast && typeof uni !== 'undefined' && uni.showToast) {
    uni.showToast({
      title: userMessage,
      icon: 'none',
      duration: 3000
    })
  }

  // 控制台日志
  if (logToConsole) {
    console.error('[ErrorHandler]', {
      message: classifiedError.message,
      type: classifiedError.type,
      severity: classifiedError.severity,
      context,
      timestamp: new Date().toISOString()
    })

    // 开发环境记录完整错误堆栈
    if (process.env.NODE_ENV === 'development' && classifiedError.originalError.stack) {
      console.error('[ErrorHandler Stack]', classifiedError.originalError.stack)
    }
  }

  // 检查是否需要重试
  let shouldRetry = false
  let retryDelay = 0

  if (autoRetry && maxRetries > 0) {
    const retryableTypes = [
      ERROR_TYPES.NETWORK,
      ERROR_TYPES.TIMEOUT,
      ERROR_TYPES.SERVER
    ]

    if (retryableTypes.includes(classifiedError.type)) {
      shouldRetry = true
      // 根据错误类型和重试次数计算延迟
      retryDelay = calculateRetryDelay(
        classifiedError.type,
        context.retryCount || 0,
        maxRetries
      )
    }
  }

  return {
    success: false,
    error: classifiedError,
    userMessage,
    shouldRetry,
    retryDelay,
    retryCount: (context.retryCount || 0) + 1
  }
}

/**
 * 计算重试延迟（指数退避算法）
 */
function calculateRetryDelay(errorType, retryCount, maxRetries) {
  if (retryCount >= maxRetries) {
    return 0 // 不再重试
  }

  const baseDelay = 1000 // 1秒基础延迟
  const maxDelay = 30000 // 最大30秒

  // 指数退避：2^retryCount * baseDelay，加上随机抖动
  const exponentialDelay = Math.pow(2, retryCount) * baseDelay
  const jitter = Math.random() * 1000 // 0-1秒随机抖动

  let delay = Math.min(exponentialDelay + jitter, maxDelay)

  // 根据错误类型调整延迟
  if (errorType === ERROR_TYPES.NETWORK) {
    delay = Math.min(delay, 5000) // 网络错误最多等待5秒
  } else if (errorType === ERROR_TYPES.RATE_LIMIT) {
    delay = Math.max(delay, 5000) // 频率限制至少等待5秒
  }

  return Math.round(delay)
}

/**
 * 创建带重试的异步函数包装器
 * @param {Function} asyncFn 异步函数
 * @param {Object} options 重试选项
 * @returns {Function} 包装后的函数
 */
export function withRetry(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    retryCondition = null,
    onRetry = null
  } = options

  return async function (...args) {
    let lastError = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFn(...args)
        return result
      } catch (error) {
        lastError = error

        // 检查是否应该重试
        const shouldRetry = retryCondition
          ? retryCondition(error, attempt)
          : attempt < maxRetries

        if (!shouldRetry) {
          break
        }

        // 计算重试延迟
        const delay = calculateRetryDelay(
          classifyError(error).type,
          attempt,
          maxRetries
        )

        if (onRetry) {
          onRetry(error, attempt + 1, delay)
        }

        // 等待延迟
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }
}

/**
 * 验证 API Key 格式
 * @param {string} apiKey API Key
 * @param {string} expectedPrefix 预期前缀（如 'sk-'）
 * @returns {boolean} 是否有效
 */
export function validateApiKey(apiKey, expectedPrefix = null) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  if (expectedPrefix && !apiKey.startsWith(expectedPrefix)) {
    return false
  }

  // 基本长度检查
  return apiKey.trim().length >= 10
}

/**
 * 统一 API 响应包装器
 * @param {Promise} promise API Promise
 * @param {Object} options 选项
 * @returns {Promise} 包装后的 Promise
 */
export async function wrapApiCall(promise, options = {}) {
  const {
    context = {},
    showError = true,
    retryOnFailure = false
  } = options

  try {
    const result = await promise
    return { success: true, data: result }
  } catch (error) {
    const errorResult = handleError(error, {
      context,
      showToast: showError,
      autoRetry: retryOnFailure,
      ...options
    })

    return {
      success: false,
      error: errorResult.error,
      message: errorResult.userMessage,
      shouldRetry: errorResult.shouldRetry,
      retryDelay: errorResult.retryDelay
    }
  }
}