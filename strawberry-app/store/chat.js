// store/chat.js — 对话状态管理 (Pinia)
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages:   [],        // { id, role, content, time, loading }
    isLoading:  false,
    fontSize:   'md',      // 'sm' | 'md' | 'lg' | 'xl'
    autoSpeak:  true,      // AI回复自动朗读
    sessionId:  Date.now(), // 当前会话ID
    loadingStage: 'idle',  // 'idle' | 'kb_query' | 'ai_processing' | 'streaming'
    loadingProgress: 0     // 0-100
  }),

  getters: {
    fontSizeRpx: (s) => ({ sm: 28, md: 34, lg: 40, xl: 48 }[s.fontSize] || 34),
    apiMessages: (s) =>
      s.messages
        .filter(m => !m.loading && m.content)
        .map(({ role, content }) => ({ role, content }))
        .slice(-20)
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
      if (m) { m.content = `⚠️ ${msg}`; m.loading = false; m.error = true }
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

    /**
     * 设置加载阶段
     * @param {'idle'|'kb_query'|'ai_processing'|'streaming'} stage 加载阶段
     */
    setLoadingStage(stage) {
      this.loadingStage = stage
      // 根据阶段设置默认进度
      const stageProgress = {
        idle: 0,
        kb_query: 20,
        ai_processing: 40,
        streaming: 60
      }
      this.loadingProgress = stageProgress[stage] || 0
    },

    /**
     * 设置加载进度
     * @param {number} progress 进度值 (0-100)
     */
    setLoadingProgress(progress) {
      this.loadingProgress = Math.max(0, Math.min(100, progress))
    },

    /**
     * 重置加载状态
     */
    resetLoading() {
      this.isLoading = false
      this.loadingStage = 'idle'
      this.loadingProgress = 0
    }
  }
})
