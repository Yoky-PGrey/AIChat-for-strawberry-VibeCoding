// utils/deepseek.js — DeepSeek 流式对话封装
import { handleError, ERROR_TYPES } from './errorHandler.js'

const API_URL = 'https://api.deepseek.com/chat/completions'
const MODEL   = 'deepseek-chat'

export function getApiKey() {
  return uni.getStorageSync('ds_api_key') || ''
}

/**
 * 流式对话
 * @param {Array}    messages      [{role, content}, ...]
 * @param {Object}   opts
 * @param {string}   opts.system   系统提示词
 * @param {Function} opts.onChunk  (delta, fullText) => void
 * @param {Function} opts.onDone   (fullText) => void
 * @param {Function} opts.onError  (msg) => void
 */
export async function streamChat(messages, opts = {}) {
  const { system = '', onChunk, onDone, onError, abortSignal } = opts
  const key = getApiKey()
  if (!key) {
    const errorResult = handleError(
      new Error('DeepSeek API Key 未配置'),
      {
        context: { type: 'deepseek_api', stage: 'validation' },
        showToast: false, // 不显示Toast，由调用方处理
        customMessage: '请先在设置页填写 DeepSeek API Key'
      }
    )
    onError?.(errorResult.userMessage)
    return
  }

  const payload = {
    model: MODEL,
    stream: true,
    max_tokens: 2048,
    temperature: 0.6,
    messages: [
      { role: 'system', content: system || defaultSystem() },
      ...messages
    ]
  }

  try {
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(payload)
    }

    if (abortSignal) {
      fetchOptions.signal = abortSignal
    }

    const res = await fetch(API_URL, fetchOptions)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let full = '', buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        const s = line.trim()
        if (!s.startsWith('data:')) continue
        const raw = s.slice(5).trim()
        if (raw === '[DONE]') { onDone?.(full); return }
        try {
          const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content
          if (delta) { full += delta; onChunk?.(delta, full) }
        } catch (_) {}
      }
    }
    onDone?.(full)
  } catch (error) {
    const errorResult = handleError(error, {
      context: {
        type: 'deepseek_api',
        stage: 'streaming',
        messagesCount: messages.length
      },
      showToast: false, // 不显示Toast，由调用方处理
      customMessage: error.message || 'DeepSeek API 请求失败'
    })
    onError?.(errorResult.userMessage)
  }
}

function defaultSystem() {
  return `你是一位专业的草莓种植顾问，拥有丰富的草莓栽培、病虫害防治、施肥管理和采收销售经验。
请用简单易懂、亲切的语言回答农民朋友的问题，避免使用过于专业的术语。
如果知识库中有相关信息，优先参考知识库内容。
回答要简洁清晰，重点突出，方便阅读。`
}
