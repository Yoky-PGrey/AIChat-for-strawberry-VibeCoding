<template>
  <view class="chat-page">

    <!-- 顶栏 -->
    <view class="topbar">
      <view class="back" @tap="goBack"><text>‹ 返回</text></view>
      <view class="topbar-center">
        <text class="topbar-icon">🍓</text>
        <text class="topbar-title">草莓管家</text>
      </view>
      <view class="topbar-right">
        <view class="icon-btn" @tap="toggleSpeak" :title="store.autoSpeak ? '关闭朗读':'开启朗读'">
          <text>{{ store.autoSpeak ? '🔊' : '🔇' }}</text>
        </view>
        <view class="icon-btn" @tap="clearConfirm">
          <text>🗑️</text>
        </view>
      </view>
    </view>

    <!-- 消息区 -->
    <scroll-view
      class="msg-list"
      scroll-y
      :scroll-top="scrollTop"
      scroll-with-animation
      :style="{ fontSize: store.fontSizeRpx + 'rpx' }"
    >
      <!-- 加载状态指示器 -->
      <view v-if="store.loadingStage !== 'idle'" class="loading-indicator">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: store.loadingProgress + '%' }"/>
        </view>
        <text class="stage-text">{{ getStageText(store.loadingStage) }}</text>
        <view v-if="store.loadingStage === 'streaming' && store.loadingProgress < 90" class="cancel-btn" @tap="cancelRequest">
          <text>取消</text>
        </view>
      </view>

      <!-- 欢迎提示 -->
      <view v-if="!store.messages.length && store.loadingStage === 'idle'" class="welcome">
        <text class="w-icon">🍓</text>
        <text class="w-title">您好，我是草莓管家！</text>
        <text class="w-sub">有什么草莓种植问题，请随时问我</text>
        <view class="w-hints">
          <view v-for="h in hints" :key="h" class="w-hint" @tap="sendMsg(h)">
            <text>{{ h }}</text>
          </view>
        </view>
      </view>

      <!-- 消息列表 -->
      <view
        v-for="m in store.messages"
        :key="m.id"
        class="msg-row animate-slide-up-in"
        :class="m.role === 'user' ? 'row-user' : 'row-ai'"
      >
        <!-- AI 头像 -->
        <view v-if="m.role==='assistant'" class="avatar ai-av"><text>🤖</text></view>

        <view class="bubble-col" :class="m.role==='user' ? 'col-right':'col-left'">
          <view
            class="bubble"
            :class="[m.role==='user' ? 'bbl-user':'bbl-ai', m.error ? 'bbl-err':'']"
          >
            <!-- 打字动画 -->
            <view v-if="m.loading && !m.content" class="typing">
              <view class="dot d1"/><view class="dot d2"/><view class="dot d3"/>
            </view>
            <text v-else class="bbl-txt" selectable>{{ m.content }}</text>
          </view>

          <!-- AI 气泡操作 -->
          <view v-if="m.role==='assistant' && !m.loading && m.content" class="bbl-actions">
            <view class="bbl-act" @tap="readAloud(m.content)"><text>🔊 朗读</text></view>
            <view class="bbl-act" @tap="copyText(m.content)"><text>📋 复制</text></view>
          </view>

          <text class="msg-time">{{ m.time }}</text>
        </view>

        <!-- 用户头像 -->
        <view v-if="m.role==='user'" class="avatar usr-av"><text>👤</text></view>
      </view>

      <view style="height:24rpx;" />
    </scroll-view>

    <!-- 输入区 -->
    <view class="input-wrap">

      <!-- 文字 / 语音 切换标签 -->
      <view class="mode-tabs">
        <view class="m-tab" :class="mode==='text'?'m-active':''" @tap="mode='text'">
          <text>⌨️ 文字</text>
        </view>
        <view class="m-tab" :class="mode==='voice'?'m-active':''" @tap="mode='voice'">
          <text>🎤 语音</text>
        </view>
      </view>

      <!-- 文字输入 -->
      <view v-if="mode==='text'" class="text-row">
        <textarea
          v-model="inputTxt"
          class="txt-input"
          placeholder="在这里输入您的问题..."
          :auto-height="true"
          :max-height="400"
          :disabled="store.isLoading"
          confirm-type="send"
          @confirm="onSendText"
          :style="{ fontSize: store.fontSizeRpx + 'rpx' }"
        />
        <view
          class="send-btn"
          :class="inputTxt.trim() && !store.isLoading ? 'send-active':''"
          @tap="onSendText"
        >
          <text>发送</text>
        </view>
      </view>

      <!-- 语音输入 -->
      <view v-else class="voice-row">
        <view
          class="voice-btn"
          :class="recording ? 'vbtn-active' : ''"
          @touchstart.prevent="startRec"
          @touchend.prevent="stopRec"
          @touchcancel.prevent="cancelRec"
        >
          <text class="vbtn-icon">{{ recording ? '🎙️' : '🎤' }}</text>
          <text class="vbtn-txt">{{ recording ? '松开 发送' : '按 住 说 话' }}</text>
        </view>
      </view>

    </view>

    <!-- 录音遮罩 -->
    <view v-if="recording" class="rec-mask">
      <view class="rec-modal">
        <view class="rec-waves">
          <view v-for="i in 5" :key="i" class="wave" :style="`animation-delay:${i*0.1}s`"/>
        </view>
        <text class="rec-txt">正在录音…</text>
        <text class="rec-hint">松开手指发送</text>
      </view>
    </view>

  </view>
</template>

<script>
import { ref, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/store/chat.js'
import { streamChat } from '@/utils/deepseek.js'
import { queryKnowledge, buildPrompt } from '@/utils/knowledge.js'
import { speak, stopSpeak } from '@/utils/tts.js'
import { recognizeSpeech, testASRConfig } from '@/utils/asr.js'
import { AnimationHelper, ANIMATIONS } from '@/utils/animations.js'

export default {
  name: 'ChatPage',
  setup() {
    const store    = useChatStore()
    const inputTxt = ref('')
    const scrollTop= ref(0)
    const mode     = ref('text')
    const recording= ref(false)
    let   recMgr   = null
    let   cancelled= false
    const abortController = ref(null)

    const hints = ['草莓怎么浇水？','叶子发黄怎么办？','草莓施什么肥？','怎么防灰霉病？']

    onMounted(() => {
      store.load()
      initRec()
      // 接收快捷提问 / 语音模式参数
      const pages = getCurrentPages()
      const cur   = pages[pages.length - 1]
      const opts  = cur?.$page?.options || {}
      if (opts.mode === 'voice') mode.value = 'voice'
      if (opts.q) {
        nextTick(() => sendMsg(decodeURIComponent(opts.q)))
      }
      scrollBottom()
    })

    function scrollBottom() {
      nextTick(() => { scrollTop.value = 999999 })
    }

    async function sendMsg(text) {
      text = text?.trim()
      if (!text || store.isLoading) return
      inputTxt.value = ''
      store.isLoading = true
      store.setLoadingStage('kb_query')
      store.setLoadingProgress(10)
      store.addUser(text)
      scrollBottom()

      // 创建 AbortController 用于取消请求
      const controller = new AbortController()
      abortController.value = controller

      const aiMsg = store.addAssistantMessage
        ? store.addAssistant()
        : null
      scrollBottom()

      try {
        // 知识库查询阶段
        store.setLoadingStage('kb_query')
        store.setLoadingProgress(30)
        const kb = await queryKnowledge(text)

        // AI处理阶段
        store.setLoadingStage('ai_processing')
        store.setLoadingProgress(50)
        const system = buildPrompt(kb)

        // 流式响应阶段
        store.setLoadingStage('streaming')
        let chunkCount = 0

        await streamChat(store.apiMessages, {
          system,
          abortSignal: controller.signal,
          onChunk: (_, full) => {
            store.updateAssistant(aiMsg.id, full, false)
            scrollBottom()

            // 更新进度（基于文本长度估算）
            chunkCount++
            if (full.length > 0) {
              const estimatedProgress = 50 + Math.min(40, (full.length / 500) * 40)
              store.setLoadingProgress(estimatedProgress)
            }
          },
          onDone: (full) => {
            abortController.value = null
            store.updateAssistant(aiMsg.id, full, true)
            store.setLoadingProgress(100)
            store.resetLoading()
            scrollBottom()
            if (store.autoSpeak && full) speak(full)
          },
          onError: (err) => {
            abortController.value = null
            store.setError(aiMsg.id, err || '请求失败，请检查网络和API Key')
            store.resetLoading()
          }
        })
      } catch (e) {
        abortController.value = null
        store.setError(aiMsg.id, e.message)
        store.resetLoading()
      }
    }

    function onSendText() {
      const t = inputTxt.value.trim()
      if (t) sendMsg(t)
    }

    // ── 录音 ──
    function initRec() {
      // #ifdef APP-PLUS || MP
      recMgr = uni.getRecorderManager()
      recMgr.onStop(res => {
        if (cancelled) return
        handleAudio(res.tempFilePath)
      })
      recMgr.onError(() => {
        recording.value = false
        uni.showToast({ title: '录音失败', icon: 'none' })
      })
      // #endif
    }

    function startRec() {
      if (store.isLoading) return
      cancelled = false
      recording.value = true
      stopSpeak()
      // #ifdef APP-PLUS || MP
      recMgr?.start({ duration: 60000, sampleRate: 16000, numberOfChannels: 1, format: 'mp3' })
      // #endif
    }

    function stopRec() {
      if (!recording.value) return
      recording.value = false
      // #ifdef APP-PLUS || MP
      recMgr?.stop()
      // #endif
    }

    function cancelRec() {
      cancelled = true
      recording.value = false
      // #ifdef APP-PLUS || MP
      recMgr?.stop()
      // #endif
      uni.showToast({ title: '已取消', icon: 'none' })
    }

    /**
     * 将音频文件转换为 base64 格式
     * @param {string} filePath 文件路径
     * @returns {Promise<string>} base64 字符串（包含 data:audio/mp3;base64, 前缀）
     */
    async function fileToBase64(filePath) {
      return new Promise((resolve, reject) => {
        // #ifdef H5
        // H5 环境：使用 FileReader
        if (typeof FileReader !== 'undefined') {
          // 注意：H5 环境可能需要不同的文件获取方式
          // 这里假设 filePath 是 blob URL 或 data URL
          if (filePath.startsWith('data:') || filePath.startsWith('blob:')) {
            resolve(filePath)
          } else {
            // 尝试通过 fetch 获取文件
            fetch(filePath)
              .then(res => res.blob())
              .then(blob => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              .catch(reject)
          }
          return
        }
        // #endif

        // #ifdef APP-PLUS || MP
        // App 和小程序环境：使用 uni.getFileSystemManager
        try {
          const fs = uni.getFileSystemManager()
          fs.readFile({
            filePath: filePath,
            encoding: 'base64',
            success: (res) => {
              // 根据文件类型添加正确的 MIME 类型前缀
              // 录音格式为 mp3，所以使用 audio/mp3
              resolve(`data:audio/mp3;base64,${res.data}`)
            },
            fail: reject
          })
        } catch (err) {
          reject(err)
        }
        // #endif
      })
    }

    // ASR 识别（讯飞接口）
    async function handleAudio(filePath) {
      uni.showLoading({ title: '识别中…', mask: true })
      try {
        // 将录音文件转换为 base64
        const audioBase64 = await fileToBase64(filePath)
        if (!audioBase64) {
          throw new Error('音频文件读取失败')
        }

        // 调用讯飞 ASR
        const txt = await recognizeSpeech(audioBase64)
        uni.hideLoading()

        if (txt?.trim()) {
          sendMsg(txt)
        } else {
          uni.showToast({ title: '未识别到有效内容', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()

        // 分级错误处理
        const errorMessage = error.message || '识别失败'
        if (errorMessage.includes('网络') || errorMessage.includes('Network')) {
          uni.showToast({ title: '网络连接失败，请检查网络设置', icon: 'none' })
        } else if (errorMessage.includes('认证') || errorMessage.includes('APPID') || errorMessage.includes('API Key')) {
          uni.showToast({ title: 'ASR 配置错误，请检查设置', icon: 'none' })
        } else if (errorMessage.includes('频率') || errorMessage.includes('超限')) {
          uni.showToast({ title: '识别频率超限，请稍后再试', icon: 'none' })
        } else {
          uni.showToast({ title: `识别失败: ${errorMessage}`, icon: 'none' })
        }

        console.error('ASR 识别失败:', error)
      }
    }


    function getStageText(stage) {
      const stageTexts = {
        idle: '就绪',
        kb_query: '查询知识库…',
        ai_processing: 'AI思考中…',
        streaming: 'AI回复中…'
      }
      return stageTexts[stage] || '处理中…'
    }

    function cancelRequest() {
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }
      store.resetLoading()
      uni.showToast({ title: '已取消', icon: 'none' })
    }

    function readAloud(txt) { speak(txt) }
    function copyText(txt) {
      uni.setClipboardData({ data: txt, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
    }

    function toggleSpeak() { store.setAutoSpeak(!store.autoSpeak) }

    function clearConfirm() {
      uni.showModal({
        title: '清空对话',
        content: '确定清空所有聊天记录吗？',
        success: r => { if (r.confirm) store.clear() }
      })
    }

    function goBack() { uni.navigateBack() }

    return {
      store, inputTxt, scrollTop, mode, recording, hints,
      onSendText, sendMsg, startRec, stopRec, cancelRec,
      readAloud, copyText, toggleSpeak, clearConfirm, goBack
    }
  }
}
</script>

<style>
page { background: #FDF6F0; height: 100%; }

.chat-page {
  display: flex; flex-direction: column; height: 100vh;
  background: #FDF6F0;
}

/* ── 顶栏 ── */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 44rpx 28rpx 20rpx;
  padding-top: calc(44rpx + env(safe-area-inset-top));
  background: #fff;
  border-bottom: 1rpx solid #F0E4DC;
  box-shadow: 0 2rpx 12rpx rgba(200,80,60,0.06);
}
.back text { color: #E8314A; font-size: 34rpx; font-weight: 600; }
.topbar-center { display: flex; align-items: center; gap: 10rpx; }
.topbar-icon   { font-size: 40rpx; }
.topbar-title  { font-size: 36rpx; font-weight: 700; color: #2C1810; }
.topbar-right  { display: flex; gap: 16rpx; }
.icon-btn {
  width: 88rpx; height: 88rpx; border-radius: 44rpx;
  background: #FFF0EE; display: flex; align-items: center; justify-content: center;
  font-size: 36rpx;
  min-width: 88rpx; min-height: 88rpx;
}

/* ── 消息列表 ── */
.msg-list {
  flex: 1; padding: 24rpx 20rpx 0; overflow: hidden;
}

/* 欢迎页 */
.welcome {
  display: flex; flex-direction: column; align-items: center;
  padding: 80rpx 40rpx 40rpx; gap: 16rpx;
}
.w-icon  { font-size: 120rpx; }
.w-title { font-size: 40rpx; font-weight: 700; color: #2C1810; }
.w-sub   { font-size: 30rpx; color: #888; }
.w-hints { display: flex; flex-wrap: wrap; gap: 16rpx; justify-content: center; margin-top: 16rpx; }
.w-hint {
  background: #fff; border: 2rpx solid #F5D0C8;
  border-radius: 40rpx; padding: 16rpx 30rpx;
  font-size: 30rpx; color: #E8314A;
}
.w-hint:active { background: #FFF0EE; }

/* 消息行 */
.msg-row {
  display: flex; align-items: flex-end; gap: 16rpx; margin-bottom: 28rpx;
}
.row-user { flex-direction: row-reverse; }
.row-ai   { flex-direction: row; }

.avatar {
  width: 80rpx; height: 80rpx; border-radius: 40rpx; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 44rpx;
}
.ai-av  { background: #FFF0EE; }
.usr-av { background: #EEF8F0; }

.bubble-col { max-width: 72%; display: flex; flex-direction: column; }
.col-right  { align-items: flex-end; }
.col-left   { align-items: flex-start; }

.bubble {
  padding: 24rpx 30rpx; border-radius: 24rpx; word-break: break-all;
}
.bbl-user {
  background: #E8314A; border-bottom-right-radius: 6rpx;
}
.bbl-ai {
  background: #fff; border-bottom-left-radius: 6rpx;
  box-shadow: 0 4rpx 16rpx rgba(200,80,60,0.1);
  border: 1rpx solid #F5E0DA;
}
.bbl-err { background: #FFF3F3; border-color: #FFBABA; }
.bbl-txt { line-height: 1.7; display: block; }
.bbl-user .bbl-txt { color: #fff; }
.bbl-ai .bbl-txt   { color: #2C1810; }

/* 气泡操作 */
.bbl-actions {
  display: flex; gap: 16rpx; margin-top: 10rpx;
}
.bbl-act {
  background: #FFF0EE; border-radius: 24rpx; padding: 14rpx 24rpx;
  min-height: 88rpx;
  display: flex; align-items: center; justify-content: center;
}
.bbl-act text { font-size: 24rpx; color: #E8314A; }

.msg-time { font-size: 22rpx; color: #bbb; margin-top: 8rpx; }

/* 打字动画 */
.typing { display: flex; gap: 10rpx; align-items: center; padding: 8rpx 0; }
.dot {
  width: 18rpx; height: 18rpx; border-radius: 50%;
  background: #E8314A; opacity: 0.4;
  animation: pulse 1.2s ease-in-out infinite;
}
.d1 { animation-delay: 0s; }
.d2 { animation-delay: .2s; }
.d3 { animation-delay: .4s; }
@keyframes pulse {
  0%,80%,100% { transform: scale(.8); opacity:.3; }
  40%         { transform: scale(1.1); opacity:1; }
}

/* ── 输入区 ── */
.input-wrap {
  background: #fff;
  border-top: 1rpx solid #F0E4DC;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 24rpx rgba(200,80,60,0.06);
}

.mode-tabs {
  display: flex; gap: 12rpx; margin-bottom: 16rpx;
}
.m-tab {
  flex: 1; padding: 20rpx; border-radius: 24rpx;
  background: #F5F0EE; text-align: center;
  min-height: 88rpx;
  display: flex; align-items: center; justify-content: center;
}
.m-tab text { font-size: 28rpx; color: #888; }
.m-active { background: #FFF0EE; }
.m-active text { color: #E8314A; font-weight: 700; }

/* 文字输入 */
.text-row { display: flex; align-items: flex-end; gap: 16rpx; }
.txt-input {
  flex: 1; min-height: 80rpx;
  background: #F5F0EE; border-radius: 24rpx;
  padding: 20rpx 28rpx; color: #2C1810; line-height: 1.6;
}
.send-btn {
  width: 140rpx; height: 88rpx; border-radius: 24rpx;
  background: #ddd; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .2s;
  cursor: pointer;
}
.send-btn text { font-size: 32rpx; color: #fff; font-weight: 600; }
.send-btn:active {
  transform: scale(0.95);
}
.send-active { background: #E8314A; }

/* 语音按钮 */
.voice-row { padding: 8rpx 0; }
.voice-btn {
  width: 100%; height: 120rpx; border-radius: 60rpx;
  background: linear-gradient(135deg, #E8314A, #C0392B);
  display: flex; align-items: center; justify-content: center;
  gap: 20rpx; transition: transform .1s;
  box-shadow: 0 8rpx 30rpx rgba(232,49,74,0.4);
}
.voice-btn:active, .vbtn-active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 16rpx rgba(232,49,74,0.6);
  background: linear-gradient(135deg, #C0392B, #A93226);
}
.vbtn-icon { font-size: 56rpx; }
.vbtn-txt  { font-size: 40rpx; font-weight: 700; color: #fff; letter-spacing: 4rpx; }

/* 录音遮罩 */
.rec-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 999;
}
.rec-modal {
  background: rgba(30,10,10,0.85); border-radius: 32rpx;
  padding: 60rpx 80rpx;
  display: flex; flex-direction: column; align-items: center; gap: 24rpx;
}
.rec-waves { display: flex; gap: 8rpx; align-items: center; height: 60rpx; }
.wave {
  width: 10rpx; border-radius: 10rpx; background: #E8314A;
  animation: wave 0.8s ease-in-out infinite alternate;
}
.wave:nth-child(1) { height: 20rpx; }
.wave:nth-child(2) { height: 40rpx; }
.wave:nth-child(3) { height: 56rpx; }
.wave:nth-child(4) { height: 40rpx; }
.wave:nth-child(5) { height: 20rpx; }
@keyframes wave { to { height: 56rpx; opacity: 1; } from { height: 16rpx; opacity: .5; } }
.rec-txt  { font-size: 40rpx; color: #fff; font-weight: 600; }
.rec-hint { font-size: 28rpx; color: rgba(255,255,255,.6); }
/* 加载状态指示器 */
.loading-indicator {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 24rpx 30rpx;
  margin: 20rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid #F0E4DC;
}

.progress-bar {
  width: 100%;
  height: 12rpx;
  background: #F5F0EE;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #E8314A, #FF6B35);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.stage-text {
  font-size: 28rpx;
  color: #2C1810;
  font-weight: 500;
}

.cancel-btn {
  background: #FFF0EE;
  border: 2rpx solid #E8314A;
  border-radius: 16rpx;
  padding: 12rpx 24rpx;
  margin-top: 8rpx;
}

.cancel-btn text {
  font-size: 26rpx;
  color: #E8314A;
  font-weight: 600;
}
</style>
