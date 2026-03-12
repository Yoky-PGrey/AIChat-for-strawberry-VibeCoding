import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages:   [],
    isLoading:  false,
    fontSize:   'md',
    autoSpeak:  true,
    sessionId:  Date.now(),
    loadingStage: 'idle',
    loadingProgress: 0,
    currentModel: 'deepseek',
    config: {
      deepseek: { key: '', url: 'https://api.deepseek.com/v1' },
      kimi:     { key: '', url: 'https://api.moonshot.cn/v1' },
      qwen:     { key: '', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' }
    },
    kbUrl: ''
  }),
  getters: {
    fontSizeRpx: (s) => ({ sm: 28, md: 34, lg: 40, xl: 48 }[s.fontSize] || 34),
    apiMessages: (s) =>
      s.messages
        .filter(m => !m.loading && m.content)
        .map(({ role, content }) => ({ role, content }))
        .slice(-20),
    activeConfig: (s) => s.config[s.currentModel] || s.config.deepseek
  },
  actions: {
    addUser(content) {
      const m = this._msg('user', content)
      this.messages.push(m)
      this._save()
      return m
    },
    addAssistant() {
      const m = this._msg('assistant', '', true)
      this.messages.push(m)
      return m
    },
    updateAssistant(id, content, done = false) {
      const m = this.messages.find(x => x.id === id)
      if (!m) return
      m.content = content
      if (done) { m.loading = false; this._save() }
    },
    setError(id, msg) {
      const m = this.messages.find(x => x.id === id)
      if (m) { m.content = "⚠️ " + msg; m.loading = false; m.error = true }
    },
    clear() {
      this.messages = []
      this.sessionId = Date.now()
      uni.removeStorageSync('chat_msgs')
    },
    load() {
      try {
        const raw = uni.getStorageSync('chat_msgs')
        if (raw) this.messages = JSON.parse(raw)
      } catch (_) {}
      this.autoSpeak = uni.getStorageSync('auto_speak') !== false
      this.fontSize  = uni.getStorageSync('font_size') || 'md'
      this.currentModel = uni.getStorageSync('current_model') || 'deepseek'
      const savedConfig = uni.getStorageSync('models_config')
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          this.config = { ...this.config, ...parsed }
        } catch (e) {}
      }
      this.kbUrl = uni.getStorageSync('kb_url') || ''
    },
    setModel(model) {
      this.currentModel = model
      uni.setStorageSync('current_model', model)
    },
    updateConfig(model, { key, url }) {
      if (this.config[model]) {
        if (key !== undefined) this.config[model].key = key
        if (url !== undefined) this.config[model].url = url
        uni.setStorageSync('models_config', JSON.stringify(this.config))
      }
    },
    setKbUrl(url) {
      this.kbUrl = url
      uni.setStorageSync('kb_url', url)
    },
    setFontSize(v) {
      this.fontSize = v
      uni.setStorageSync('font_size', v)
    },
    setAutoSpeak(v) {
      this.autoSpeak = v
      uni.setStorageSync('auto_speak', v)
    },
    _msg(role, content, loading = false) {
      return {
        id: Date.now() + Math.random(),
        role, content, loading,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
    },
    _save() {
      try { uni.setStorageSync('chat_msgs', JSON.stringify(this.messages.slice(-50))) } catch (_) {}
    },
    setLoadingStage(stage) {
      this.loadingStage = stage
      const stageProgress = { idle: 0, kb_query: 20, ai_processing: 40, streaming: 60 }
      this.loadingProgress = stageProgress[stage] || 0
    },
    setLoadingProgress(progress) {
      this.loadingProgress = Math.max(0, Math.min(100, progress))
    },
    resetLoading() {
      this.isLoading = false
      this.loadingStage = 'idle'
      this.loadingProgress = 0
    }
  }
})
