// utils/knowledge.js — GraphRAG 知识库封装
// 拿到地址后：① 在设置页填入，或 ② 修改下面 fallbackUrl
import { handleError } from './errorHandler.js'

const fallbackUrl = '' // 可选：硬编码备用地址

export function getKbUrl() {
  return uni.getStorageSync('kb_url') || fallbackUrl
}

/**
 * 查询草莓知识库
 * @param   {string} question
 * @returns {string} 相关知识片段（空字符串表示未配置或查询失败）
 */
export async function queryKnowledge(question) {
  const url = getKbUrl()
  if (!url) return ''

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question, method: 'local', top_k: 5 })
    })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()

    // 兼容多种返回格式
    if (typeof data === 'string')    return data
    if (data.result)                 return data.result
    if (data.answer)                 return data.answer
    if (Array.isArray(data.context)) return data.context.map(c => c.text || c).join('\n\n')
    if (data.context)                return String(data.context)
    return ''
  } catch (error) {
    handleError(error, {
      context: {
        type: 'knowledge_api',
        url: url,
        question: question.substring(0, 50) // 记录前50个字符
      },
      showToast: false, // 不显示Toast，静默失败
      logToConsole: true
    })
    return '' // 静默失败，返回空字符串
  }
}

/**
 * 拼装系统提示词（含知识库内容）
 */
export function buildPrompt(kb) {
  if (!kb) return ''
  return `请根据以下草莓种植知识库内容回答用户问题，内容不够时可补充通用知识，但不要与知识库矛盾：

【知识库参考】
${kb}
`
}
