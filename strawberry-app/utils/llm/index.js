import { useChatStore } from '@/store/chat.js'
import { streamChat as deepseekChat } from './deepseek.js'

/**
 * 统一流式对话入口
 */
export async function streamChat(messages, opts = {}) {
  const store = useChatStore()
  const model = store.currentModel

  switch (model) {
    case 'deepseek':
      return await deepseekChat(messages, opts)
    case 'kimi':
      // 暂时复用 deepseek 的逻辑，因为它们都兼容 OpenAI 格式
      return await deepseekChat(messages, { ...opts, modelOverride: 'moonshot-v1-8k' })
    case 'qwen':
      return await deepseekChat(messages, { ...opts, modelOverride: 'qwen-plus' })
    default:
      return await deepseekChat(messages, opts)
  }
}
