import { streamChat as deepseekChat } from './deepseek.js'

/**
 * 统一流式对话入口
 */
export async function streamChat(messages, opts = {}) {
  const { model, config, ...rest } = opts

  switch (model) {
    case 'deepseek':
      return await deepseekChat(messages, { ...rest, config })
    case 'kimi':
      return await deepseekChat(messages, { ...rest, config, modelOverride: 'moonshot-v1-8k' })
    case 'qwen':
      return await deepseekChat(messages, { ...rest, config, modelOverride: 'qwen-plus' })
    default:
      return await deepseekChat(messages, { ...rest, config })
  }
}
