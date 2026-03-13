import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions:   [], // { id, title, date, messages }
    sessionId:  null,
    messages:   [], // 当前会话的消息列表
    isLoading:  false,
    fontSize:   'md',
    autoSpeak:  true,
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
    activeConfig: (s) => s.config[s.currentModel] || s.config.deepseek,
    // 仅返回有消息的会话作为历史记录
    historySessions: (s) => s.sessions.filter(session => session.messages && session.messages.length > 0)
  },
  actions: {
    addUser(content) {
      const m = this._msg('user', content)
      this.messages.push(m)
      this._syncToSessions()
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
      if (done) { 
        m.loading = false
        this._syncToSessions()
        this._save() 
      }
    },
    setError(id, msg) {
      const m = this.messages.find(x => x.id === id)
      if (m) { m.content = "⚠️ " + msg; m.loading = false; m.error = true }
    },
    
    // --- 会话管理 ---
    
    createNewSession() {
      // 如果当前已经是一个空会话，就没必要再创建新的了
      const currentSession = this.sessions.find(s => s.id === this.sessionId)
      if (currentSession && (!currentSession.messages || currentSession.messages.length === 0)) {
        return this.sessionId
      }

      const id = Date.now()
      const newSession = {
        id,
        title: '新对话',
        date: this._getNowStr(),
        messages: []
      }
      this.sessions.unshift(newSession)
      this.sessionId = id
      this.messages = []
      this._save()
      return id
    },
    
    switchSession(id) {
      const session = this.sessions.find(s => s.id === id)
      if (session) {
        this.sessionId = id
        this.messages = [...session.messages]
        uni.setStorageSync('current_session_id', id)
      }
    },
    
    deleteSession(id) {
      const idx = this.sessions.findIndex(s => s.id === id)
      if (idx > -1) {
        this.sessions.splice(idx, 1)
        if (this.sessionId === id) {
          if (this.sessions.length > 0) {
            // 尝试切换到最近的一个有内容的会话
            const nextSession = this.sessions.find(s => s.messages && s.messages.length > 0)
            if (nextSession) {
              this.switchSession(nextSession.id)
            } else {
              // 如果没有有内容的会话了，清空当前状态
              this.sessionId = null
              this.messages = []
              uni.removeStorageSync('current_session_id')
            }
          } else {
            this.sessionId = null
            this.messages = []
            uni.removeStorageSync('current_session_id')
          }
        }
        this._save()
      }
    },
    
    updateSessionTitle(id, title) {
      const session = this.sessions.find(s => s.id === id)
      if (session) {
        session.title = title
        this._save()
      }
    },

    clear() {
      this.sessions = []
      this.sessionId = null
      this.messages = []
      this._save()
    },
    
    load() {
      // 加载配置
      this.autoSpeak = uni.getStorageSync('auto_speak') !== false
      this.fontSize  = uni.getStorageSync('font_size') || 'md'
      this.currentModel = uni.getStorageSync('current_model') || 'deepseek'
      this.kbUrl = uni.getStorageSync('kb_url') || ''
      
      const savedConfig = uni.getStorageSync('models_config')
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          this.config = { ...this.config, ...parsed }
        } catch (e) {}
      }

      // 加载会话列表，并过滤掉空会话
      try {
        const rawSessions = uni.getStorageSync('chat_sessions')
        if (rawSessions) {
          const parsed = JSON.parse(rawSessions)
          this.sessions = parsed.filter(s => s.messages && s.messages.length > 0)
        }
      } catch (e) {}

      // 恢复当前会话
      const lastId = uni.getStorageSync('current_session_id')
      if (lastId && this.sessions.find(s => s.id === lastId)) {
        this.switchSession(lastId)
      } else if (this.sessions.length > 0) {
        this.switchSession(this.sessions[0].id)
      } else {
        // 初始状态，不强制创建 session 对象，直到用户说话
        this.sessionId = null
        this.messages = []
      }
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
    
    // --- 内部工具 ---
    
    _msg(role, content, loading = false) {
      return {
        id: Date.now() + Math.random(),
        role, content, loading,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
    },
    
    _syncToSessions() {
      const session = this.sessions.find(s => s.id === this.sessionId)
      if (session) {
        session.messages = [...this.messages]
      }
    },
    
    _save() {
      try {
        uni.setStorageSync('chat_sessions', JSON.stringify(this.sessions.slice(0, 50)))
        uni.setStorageSync('current_session_id', this.sessionId)
      } catch (_) {}
    },
    
    _getNowStr() {
      const now = new Date()
      const m = now.getMonth() + 1
      const d = now.getDate()
      const h = now.getHours().toString().padStart(2, '0')
      const min = now.getMinutes().toString().padStart(2, '0')
      return `${m}月${d}日 ${h}:${min}`
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
