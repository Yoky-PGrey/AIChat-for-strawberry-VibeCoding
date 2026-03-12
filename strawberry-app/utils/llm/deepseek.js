import { handleError } from '../errorHandler.js'

/**
 * 通用 OpenAI 兼容流式对话
 */
export async function streamChat(messages, opts = {}) {
  const { system = '', onChunk, onDone, onError, abortSignal, modelOverride, config } = opts
  
  if (!config || !config.key) {
    onError?.('请先在设置页填写 API Key')
    return
  }

  const key = config.key
  const apiUrl = config.url.endsWith('/chat/completions') 
    ? config.url 
    : config.url.replace(/\/+$/, '') + '/chat/completions'

  const payload = {
    model: modelOverride || 'deepseek-chat',
    stream: true,
    max_tokens: 2048,
    temperature: 0.6,
    messages: [
      { role: 'system', content: system || defaultSystem() },
      ...messages
    ]
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload),
      signal: abortSignal
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error?.message || `HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let full = '', buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()

      for (const line of lines) {
        const s = line.trim()
        if (!s || s === 'data: [DONE]') continue

        if (s.startsWith('data:')) {
          const raw = s.replace(/^data:\s*/, '')
          try {
            const json = JSON.parse(raw)
            const delta = json.choices?.[0]?.delta?.content || ''
            if (delta) {
              full += delta
              onChunk?.(delta, full)
            }
          } catch (e) {}
        }
      }
    }
    onDone?.(full)
  } catch (error) {
    const errorResult = handleError(error, {
      context: { type: 'llm_api' },
      showToast: false
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
