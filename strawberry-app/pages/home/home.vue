<template>
  <view class="home">
    <!-- 侧边导航抽屉 -->
    <SideDrawer
      :open="drawerOpen"
      :current-page="'home'"
      @close="drawerOpen = false"
      @navigate="handleNavigate"
    />

    <!-- 顶部栏 -->
    <view class="topbar">
      <view class="topbar-menu" @tap="drawerOpen = true">
        <i class="ri-menu-2-line menu-icon"></i>
      </view>
      <view class="topbar-center">
        <text class="title-text">🍓 草莓管家</text>
        <text class="status-text">● 知识库已就绪</text>
      </view>
      <view class="topbar-right-placeholder"></view>
    </view>

    <!-- 聊天区域 -->
    <scroll-view 
      scroll-y 
      class="chat-area" 
      :scroll-top="scrollTop"
      scroll-with-animation
    >
      <view class="chat-content-wrapper">
        <view class="date-sep">今天 · {{ todayStr }}</view>

        <!-- 欢迎卡片 -->
        <view v-if="store.messages.length === 0" class="welcome-card">
          <view class="wc-icon">🍓</view>
          <text class="wc-title">您好！我是草莓管家</text>
          <text class="wc-desc">基于 GraphRAG 知识库，专为草莓种植提供精准解答。有什么想问的，直接说！</text>
          <view class="quick-questions">
            <view class="qq-btn" @tap="askQuick('草莓常见病虫害有哪些？')">🌿 草莓常见病虫害有哪些？</view>
            <view class="qq-btn" @tap="askQuick('大棚草莓怎么控温保湿？')">🌡️ 大棚草莓怎么控温保湿？</view>
            <view class="qq-btn" @tap="askQuick('草莓什么时候施肥效果最好？')">🌱 草莓什么时候施肥效果最好？</view>
          </view>
        </view>

        <!-- 消息列表容器 -->
        <view class="messages-container">
          <view 
            v-for="msg in store.messages" 
            :key="msg.id" 
            class="msg animate-msg-in"
            :class="msg.role === 'user' ? 'user' : 'bot'"
          >
            <text v-if="msg.role === 'assistant'" class="msg-name">草莓管家</text>
            <view class="msg-bubble">
              <block v-if="!msg.loading">
                <rich-text 
                  v-if="msg.role === 'assistant'" 
                  :nodes="renderMarkdown(msg.content)" 
                  class="markdown-body"
                />
                <text v-else selectable>{{ msg.content }}</text>
              </block>
              <!-- 正在输入动画 -->
              <view v-else class="dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
            </view>
            <text class="msg-time">{{ msg.time }}</text>
          </view>
        </view>
        
        <view style="height: 40rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部输入区域 -->
    <view class="input-area">
      <view class="input-wrap">
        <textarea
          v-model="inputTxt"
          class="chat-input"
          placeholder="问问草莓管家…"
          auto-height
          :maxlength="500"
          :cursor-spacing="20"
          :fixed="true"
          :adjust-position="true"
        />
        <view 
          class="input-voice-btn" 
          :class="{ recording: isRecording }"
          @touchstart="startVoice"
          @touchend="stopVoice"
        >
          <i class="ri-mic-line mic-icon"></i>
        </view>
      </view>
      <view class="send-btn" @tap="onSend">
        <i class="ri-send-plane-2-fill send-icon"></i>
      </view>
    </view>

    <!-- 语音录制遮罩 -->
    <view v-if="isRecording" class="voice-overlay">
      <view class="voice-circle animate-pulse">
        <i class="ri-mic-fill mic-large"></i>
      </view>
      <text class="voice-text">正在听… 说完后松开</text>
      <view class="voice-cancel">取消</view>
    </view>

  </view>
</template>

<script>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useChatStore } from '@/store/chat.js'
import { queryKnowledge, buildPrompt } from '@/utils/knowledge.js'
import { streamChat } from '@/utils/llm/index.js'
import SideDrawer from '@/components/side-drawer.vue'
import { marked } from '@/utils/marked.js'

export default {
  name: 'HomePage',
  components: { SideDrawer },
  setup() {
    const store = useChatStore()
    const inputTxt = ref('')
    const drawerOpen = ref(false)
    const outputMode = ref('text')
    const scrollTop = ref(0)
    const isRecording = ref(false)

    const todayStr = computed(() => {
      const d = new Date()
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    })

    onMounted(() => {
      store.load()
      scrollToBottom()
    })

    function scrollToBottom() {
      nextTick(() => {
        scrollTop.value = 99999 + Math.random()
      })
    }

    async function onSend() {
      const text = inputTxt.value.trim()
      if (!text || store.isLoading) return

      inputTxt.value = ''
      store.addUser(text)
      scrollToBottom()

      store.isLoading = true
      const assistantMsg = store.addAssistant()
      scrollToBottom()

      try {
        const kb = await queryKnowledge(text)
        const systemPrompt = buildPrompt(kb)

        let fullContent = ''
        await streamChat(store.apiMessages, {
          system: systemPrompt,
          onChunk: (delta, full) => {
            fullContent = full
            store.updateAssistant(assistantMsg.id, fullContent)
            scrollToBottom()
          },
          onDone: (full) => {
            store.updateAssistant(assistantMsg.id, full, true)
            store.isLoading = false
            scrollToBottom()
          },
          onError: (err) => {
            store.setError(assistantMsg.id, err)
            store.isLoading = false
          }
        })
      } catch (e) {
        store.setError(assistantMsg.id, '请求失败，请检查网络或配置')
        store.isLoading = false
      }
    }

    function askQuick(text) {
      inputTxt.value = text
      onSend()
    }

    function startVoice() {
      isRecording.value = true
    }

    function stopVoice() {
      isRecording.value = false
      const demo = ['草莓叶子发黄怎么办', '大棚里需要多浇水吗', '草莓什么时候成熟']
      inputTxt.value = demo[Math.floor(Math.random() * demo.length)]
    }

    function handleNavigate(page) {
      if (page === 'home') return
      if (page === 'settings') uni.navigateTo({ url: '/pages/settings/settings' })
    }

    function renderMarkdown(content) {
      if (!content) return ''
      // 基础配置，确保换行符被正确处理
      return marked.parse(content)
    }

    return { 
      store, inputTxt, drawerOpen, outputMode, scrollTop, isRecording, todayStr,
      askQuick, onSend, handleNavigate, startVoice, stopVoice, renderMarkdown 
    }
  }
}
</script>

<style lang="scss">
.home {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fdf6ec;
  overflow: hidden;
}

/* ── 顶部栏 ── */
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx 24rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: #fffcf7;
  border-bottom: 3rpx solid #efebe9;
  flex-shrink: 0;
}

.topbar-menu {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon { font-size: 52rpx; color: #2c1810; }

.topbar-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #2c1810;
  letter-spacing: 2rpx;
}

.status-text {
  font-size: 22rpx;
  color: #27ae60;
  font-weight: 500;
  margin-top: 4rpx;
}

.topbar-right-placeholder {
  width: 80rpx;
}

/* ── 聊天区域 ── */
.chat-area {
  flex: 1;
  width: 100%;
  overflow: hidden;
}

.chat-content-wrapper {
  padding: 0 40rpx; /* 统一对话区水平内边距 */
  width: 100%;
  box-sizing: border-box;
}

.messages-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.date-sep {
  text-align: center;
  font-size: 22rpx;
  color: #a1887f;
  margin: 40rpx auto 32rpx;
  padding: 6rpx 24rpx;
  background: rgba(109, 76, 65, 0.05);
  border-radius: 20rpx;
  width: fit-content;
}

/* 欢迎卡片 */
.welcome-card {
  margin: 10rpx 0 40rpx;
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, #fdecea 0%, #eafaf1 100%);
  border: 3rpx solid #f5b7b1;
  border-radius: 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.wc-icon { font-size: 100rpx; margin-bottom: 20rpx; }
.wc-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #c0392b;
  margin-bottom: 16rpx;
}
.wc-desc {
  font-size: 28rpx;
  color: #5d4037;
  line-height: 1.6;
  text-align: center;
}

.quick-questions {
  margin-top: 32rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.qq-btn {
  width: 100%;
  padding: 24rpx 32rpx;
  background: #fffcf7;
  border: 3rpx solid #f5b7b1;
  border-radius: 24rpx;
  color: #c0392b;
  font-size: 28rpx;
  font-weight: 500;
  text-align: center;
}

/* 消息气泡 */
.msg {
  display: flex;
  flex-direction: column;
  width: 100%; 
  margin-bottom: 40rpx;
}

.msg.user { align-items: flex-end; }
.msg.bot { align-items: flex-start; }

.msg-name {
  font-size: 24rpx;
  color: #a1887f;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.msg-bubble {
  padding: 24rpx 32rpx;
  border-radius: 32rpx;
  font-size: 32rpx;
  line-height: 1.6;
  width: fit-content;
  max-width: 100%; 
  box-sizing: border-box;
  word-break: break-word;
}

.msg.user .msg-bubble {
  background: #c0392b;
  color: #fff;
  border-bottom-right-radius: 8rpx;
  box-shadow: 0 6rpx 20rpx rgba(192, 57, 43, 0.15);
}

.msg.bot .msg-bubble {
  background: #fffcf7;
  color: #2c1810;
  border-bottom-left-radius: 8rpx;
  border: 3rpx solid #efebe9;
  box-shadow: 0 4rpx 12rpx rgba(109, 76, 65, 0.05);
}

.msg-time {
  font-size: 22rpx;
  color: #a1887f;
  margin-top: 12rpx;
}

.msg.user .msg-time {
  text-align: right;
}

/* ── Markdown 渲染样式 ── */
.markdown-body {
  font-size: 32rpx;
  line-height: 1.6;
  word-break: break-word;
}

:deep(.markdown-body) {
  p { margin-bottom: 16rpx; }
  p:last-child { margin-bottom: 0; }
  
  h1, h2, h3, h4, h5, h6 {
    color: #c0392b;
    font-weight: bold;
    margin: 24rpx 0 16rpx;
    line-height: 1.4;
  }
  h1 { font-size: 40rpx; }
  h2 { font-size: 36rpx; }
  h3 { font-size: 34rpx; }
  
  strong { font-weight: bold; color: #c0392b; }
  em { font-style: italic; }
  
  ul, ol {
    padding-left: 32rpx;
    margin-bottom: 16rpx;
  }
  li { margin-bottom: 8rpx; }
  
  code {
    background: rgba(109, 76, 65, 0.08);
    padding: 4rpx 8rpx;
    border-radius: 6rpx;
    font-family: monospace;
    font-size: 28rpx;
    margin: 0 4rpx;
  }
  
  pre {
    background: #fdf6ec;
    padding: 20rpx;
    border-radius: 12rpx;
    overflow-x: auto;
    margin-bottom: 16rpx;
    border: 1rpx solid #efebe9;
    code {
      background: transparent;
      padding: 0;
      margin: 0;
      display: block;
    }
  }
  
  blockquote {
    border-left: 8rpx solid #f5b7b1;
    padding: 10rpx 24rpx;
    background: rgba(245, 183, 177, 0.1);
    margin-bottom: 16rpx;
    color: #5d4037;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16rpx;
    th, td {
      border: 1rpx solid #efebe9;
      padding: 12rpx;
      text-align: left;
    }
    th { background: #fdf6ec; font-weight: bold; }
  }
}

/* 正在输入动画 */
.dots { display: flex; gap: 12rpx; align-items: center; padding: 12rpx 0; }
.dot {
  width: 14rpx; height: 14rpx;
  background: #a1887f;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-12rpx)} }

/* ── 底部输入区域 ── */
.input-area {
  width: 100%;
  max-width: 100vw;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fffcf7;
  border-top: 3rpx solid #efebe9;
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
  flex-shrink: 0;
}

.input-wrap {
  flex: 1;
  background: #fdf6ec;
  border: 3rpx solid #efebe9;
  border-radius: 48rpx;
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  min-height: 88rpx;
  overflow: hidden;
}

.chat-input {
  flex: 1;
  width: 100%;
  font-size: 32rpx;
  color: #2c1810;
  min-height: 44rpx;
  max-height: 240rpx;
  line-height: 1.5;
  padding: 4rpx 0;
}

.input-voice-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #efebe9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.input-voice-btn.recording {
  background: #c0392b;
  color: #fff;
}

.mic-icon { font-size: 40rpx; }

.send-btn {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #c0392b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8rpx 24rpx rgba(192, 57, 43, 0.35);
}

.send-icon {
  font-size: 48rpx;
  color: #fff;
}

/* ── 语音录制遮罩 ── */
.voice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 24, 16, 0.8);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
}

.voice-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: #c0392b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-large { font-size: 88rpx; color: #fff; }

.voice-text {
  color: #fff;
  font-size: 34rpx;
  font-weight: 500;
}

.voice-cancel {
  padding: 24rpx 64rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 48rpx;
  color: #fff;
  font-size: 30rpx;
}
</style>
