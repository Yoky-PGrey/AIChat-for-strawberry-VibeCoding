<template>
  <view class="history-page">

    <view class="topbar">
      <view class="back" @tap="goBack"><text>‹ 返回</text></view>
      <text class="topbar-title">🍓 问答记录</text>
      <view style="width:100rpx;" />
    </view>

    <scroll-view scroll-y class="list">
      <view v-if="!qaList.length" class="empty">
        <text class="empty-icon">📜</text>
        <text class="empty-txt">还没有问答记录</text>
        <view class="empty-btn" @tap="goChat"><text>去提问 →</text></view>
      </view>

      <view
        v-for="(item, idx) in qaList"
        :key="idx"
        class="qa-card animate-slide-up-in"
        :style="{ animationDelay: `${idx * 0.08}s` }"
      >
        <view class="qa-q">
          <text class="qa-label">问</text>
          <text class="qa-text">{{ item.q }}</text>
          <text class="qa-time">{{ item.time }}</text>
        </view>
        <view class="qa-a">
          <text class="qa-label qa-label-a">答</text>
          <text class="qa-text">{{ item.a }}</text>
        </view>
        <view class="qa-actions">
          <view class="qa-act" @tap="speak(item.a)"><text>🔊 朗读回答</text></view>
          <view class="qa-act" @tap="askAgain(item.q)"><text>🔄 再次提问</text></view>
        </view>
      </view>
    </scroll-view>

  </view>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useChatStore } from '@/store/chat.js'
import { speak as ttsSpeak } from '@/utils/tts.js'
import { AnimationHelper } from '@/utils/animations.js'

export default {
  name: 'HistoryPage',
  setup() {
    const store = useChatStore()
    onMounted(() => store.load())

    // 把消息配对成 Q&A
    const qaList = computed(() => {
      const msgs = store.messages.filter(m => !m.loading && m.content)
      const pairs = []
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === 'user' && msgs[i+1].role === 'assistant') {
          pairs.push({ q: msgs[i].content, a: msgs[i+1].content, time: msgs[i].time })
          i++
        }
      }
      return pairs.reverse()
    })

    function speak(txt) { ttsSpeak(txt) }
    function goBack()   { uni.navigateBack() }
    function goChat()   { uni.navigateTo({ url: '/pages/chat/chat' }) }
    function askAgain(q) {
      uni.navigateTo({ url: `/pages/chat/chat?q=${encodeURIComponent(q)}` })
    }

    return { qaList, speak, goBack, goChat, askAgain }
  }
}
</script>

<style>
page { background: #FDF6F0; }
.history-page {
  min-height: 100vh;
  background: #FDF6F0;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 44rpx 28rpx 20rpx;
  padding-top: calc(44rpx + env(safe-area-inset-top));
  background: #fff; border-bottom: 1rpx solid #F0E4DC;
}
.back text  { color: #E8314A; font-size: 34rpx; font-weight: 600; }
.topbar-title { font-size: 36rpx; font-weight: 700; color: #2C1810; }

.list { padding: 24rpx 28rpx; }

.empty {
  display: flex; flex-direction: column; align-items: center;
  padding-top: 160rpx; gap: 20rpx;
}
.empty-icon { font-size: 100rpx; }
.empty-txt  { font-size: 34rpx; color: #888; }
.empty-btn  {
  background: #E8314A; border-radius: 40rpx; padding: 20rpx 60rpx;
}
.empty-btn text { color: #fff; font-size: 32rpx; font-weight: 600; }

.qa-card {
  background: #fff; border-radius: 28rpx; margin-bottom: 28rpx;
  overflow: hidden; box-shadow: 0 4rpx 20rpx rgba(200,80,60,0.08);
  border: 1rpx solid #F5E0DA;
}
.qa-q, .qa-a {
  padding: 28rpx; display: flex; gap: 16rpx; align-items: flex-start;
}
.qa-a { background: #FFF9F7; border-top: 1rpx solid #F5E0DA; }
.qa-label {
  flex-shrink: 0; width: 56rpx; height: 56rpx; border-radius: 14rpx;
  background: #E8314A; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 700;
  min-width: 56rpx; min-height: 56rpx;
}
.qa-label-a { background: #3D7A4F; }
.qa-text  { flex: 1; font-size: 32rpx; color: #2C1810; line-height: 1.6; }
.qa-time  { font-size: 22rpx; color: #aaa; flex-shrink: 0; margin-top: 4rpx; }
.qa-actions {
  display: flex; gap: 0; border-top: 1rpx solid #F5E0DA;
}
.qa-act {
  flex: 1; padding: 28rpx; text-align: center;
  border-right: 1rpx solid #F5E0DA;
  min-height: 88rpx;
  display: flex; align-items: center; justify-content: center;
}
.qa-act:last-child { border-right: none; }
.qa-act text { font-size: 28rpx; color: #E8314A; font-weight: 500; }
.qa-act:active { background: #FFF0EE; }
</style>
