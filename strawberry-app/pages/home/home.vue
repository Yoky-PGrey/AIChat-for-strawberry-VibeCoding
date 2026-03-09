<template>
  <view class="home">

    <!-- 头部横幅 -->
    <view class="hero">
      <view class="hero-bg">
        <view class="circle c1" /><view class="circle c2" /><view class="circle c3" />
      </view>
      <view class="hero-content">
        <view class="logo-row">
          <text class="logo-icon">🍓</text>
          <view>
            <text class="app-name">草莓管家</text>
            <text class="app-sub">种草莓·问专家·不出门</text>
          </view>
        </view>
        <view class="kb-badge" :class="kbReady ? 'badge-on' : 'badge-off'">
          <text class="badge-dot" />
          <text class="badge-txt">{{ kbReady ? '知识库已连接' : '知识库未连接' }}</text>
        </view>
      </view>
    </view>

    <!-- 主操作按钮 -->
    <view class="main-actions">
      <view class="action-btn btn-voice animate-scale-in" @tap="goChat('voice')">
        <text class="btn-icon">🎤</text>
        <text class="btn-label">按住说话</text>
        <text class="btn-sub">语音提问更方便</text>
      </view>
      <view class="action-btn btn-text" @tap="goChat('text')">
        <text class="btn-icon">⌨️</text>
        <text class="btn-label">文字提问</text>
        <text class="btn-sub">打字输入问题</text>
      </view>
    </view>

    <!-- 快捷提问 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">💬</text>
        <text class="section-title">常见问题，一点就问</text>
      </view>
      <view class="quick-grid">
        <view
          v-for="(q, index) in quickQuestions"
          :key="q.id"
          class="quick-card animate-slide-up-in"
          :style="{ animationDelay: `${index * 0.08}s` }"
          @tap="askQuick(q.text)"
        >
          <text class="quick-emoji">{{ q.emoji }}</text>
          <text class="quick-text">{{ q.text }}</text>
        </view>
      </view>
    </view>

    <!-- 种植小贴士 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">📋</text>
        <text class="section-title">今日小贴士</text>
      </view>
      <view class="tip-card">
        <view class="tip-tag">
          <text>{{ tipOfDay.tag }}</text>
        </view>
        <text class="tip-content">{{ tipOfDay.content }}</text>
        <view class="tip-ask" @tap="askQuick(tipOfDay.question)">
          <text>继续了解 →</text>
        </view>
      </view>
    </view>

    <!-- 底部导航 -->
    <view class="tabbar">
      <view class="tab active">
        <text class="tab-icon">🏠</text>
        <text class="tab-label">首页</text>
      </view>
      <view class="tab" @tap="goChat('')">
        <text class="tab-icon">💬</text>
        <text class="tab-label">问答</text>
      </view>
      <view class="tab" @tap="goHistory">
        <text class="tab-icon">📜</text>
        <text class="tab-label">记录</text>
      </view>
      <view class="tab" @tap="goSettings">
        <text class="tab-icon">⚙️</text>
        <text class="tab-label">设置</text>
      </view>
    </view>

  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/store/chat.js'
import { getKbUrl } from '@/utils/knowledge.js'
import { AnimationHelper } from '@/utils/animations.js'

export default {
  name: 'HomePage',
  setup() {
    const store  = useChatStore()
    const kbReady = ref(false)

    onMounted(() => {
      store.load()
      kbReady.value = !!getKbUrl()
    })

    const quickQuestions = [
      { id:1,  emoji:'🌱', text:'草莓怎么育苗？' },
      { id:2,  emoji:'💧', text:'草莓怎么浇水？' },
      { id:3,  emoji:'🌿', text:'草莓叶子发黄怎么办？' },
      { id:4,  emoji:'🐛', text:'草莓有虫子怎么治？' },
      { id:5,  emoji:'🧪', text:'草莓施什么肥好？' },
      { id:6,  emoji:'🍓', text:'草莓什么时候可以采摘？' },
      { id:7,  emoji:'❄️', text:'草莓冬天怎么保暖？' },
      { id:8,  emoji:'🦠', text:'草莓灰霉病怎么防治？' },
    ]

    const tips = [
      { tag:'浇水技巧', content:'草莓根系较浅，喜湿怕涝。建议早晨浇水，避免傍晚浇水导致夜间湿度过高引发病害。', question:'草莓正确的浇水方法是什么？' },
      { tag:'施肥要点', content:'草莓开花结果期对钾肥需求大，适当补充磷钾肥可以让果实更甜、颜色更鲜艳。', question:'草莓结果期怎么施肥？' },
      { tag:'病害预防', content:'草莓灰霉病高发于低温多湿环境，及时清除枯叶、保持通风是最好的预防措施。', question:'如何预防草莓灰霉病？' },
      { tag:'采摘时机', content:'草莓果实整体变红、略有弹性时口感最佳。过早采摘酸味重，过晚则容易软烂。', question:'草莓最佳采摘时间怎么判断？' },
    ]
    const tipOfDay = computed(() => tips[new Date().getDate() % tips.length])

    function goChat(mode) {
      uni.navigateTo({ url: `/pages/chat/chat${mode ? '?mode=' + mode : ''}` })
    }
    function goHistory()  { uni.navigateTo({ url: '/pages/history/history' }) }
    function goSettings() { uni.navigateTo({ url: '/pages/settings/settings' }) }

    function askQuick(text) {
      uni.navigateTo({ url: `/pages/chat/chat?q=${encodeURIComponent(text)}` })
    }

    return { store, kbReady, quickQuestions, tipOfDay, goChat, goHistory, goSettings, askQuick }
  }
}
</script>

<style>
page { background: #FDF6F0; height: 100%; }

.home {
  min-height: 100vh;
  background: #FDF6F0;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  font-family: -apple-system, 'PingFang SC', sans-serif;
}

/* ── Hero ── */
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #C0392B 0%, #E8314A 45%, #FF6B7A 100%);
  padding: 60rpx 40rpx 50rpx;
  padding-top: calc(60rpx + env(safe-area-inset-top));
  border-radius: 0 0 60rpx 60rpx;
}
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.circle {
  position: absolute; border-radius: 50%;
  background: rgba(255,255,255,0.08);
}
.c1 { width: 300rpx; height: 300rpx; top: -80rpx; right: -60rpx; }
.c2 { width: 200rpx; height: 200rpx; bottom: -60rpx; left: 20rpx; }
.c3 { width: 120rpx; height: 120rpx; top: 40rpx; left: 50%; }
.hero-content { position: relative; z-index: 1; }

.logo-row {
  display: flex; align-items: center; gap: 24rpx; margin-bottom: 28rpx;
}
.logo-icon { font-size: 88rpx; line-height: 1; }
.app-name {
  display: block; font-size: 52rpx; font-weight: 800;
  color: #fff; letter-spacing: 2rpx;
}
.app-sub {
  display: block; font-size: 26rpx;
  color: rgba(255,255,255,0.75); margin-top: 6rpx;
}
.kb-badge {
  display: inline-flex; align-items: center; gap: 10rpx;
  padding: 10rpx 24rpx; border-radius: 40rpx;
}
.badge-on  { background: rgba(255,255,255,0.2); }
.badge-off { background: rgba(0,0,0,0.15); }
.badge-dot {
  width: 14rpx; height: 14rpx; border-radius: 50%;
  background: #7DFFB3; display: block;
}
.badge-off .badge-dot { background: #FFD580; }
.badge-txt { font-size: 26rpx; color: rgba(255,255,255,0.9); }

/* ── 主操作按钮 ── */
.main-actions {
  display: flex; gap: 24rpx;
  padding: 40rpx 30rpx 10rpx;
}
.action-btn {
  flex: 1; border-radius: 32rpx; padding: 40rpx 20rpx;
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.12);
  transition: transform .15s, box-shadow .15s;
  cursor: pointer;
}
.action-btn:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}
.btn-voice { background: #E8314A; }
.btn-text  { background: #3D7A4F; }
.btn-icon  { font-size: 72rpx; }
.btn-label { font-size: 38rpx; font-weight: 700; color: #fff; }
.btn-sub   { font-size: 24rpx; color: rgba(255,255,255,0.75); }

/* ── Section ── */
.section { padding: 36rpx 30rpx 0; }
.section-header {
  display: flex; align-items: center; gap: 12rpx; margin-bottom: 24rpx;
}
.section-icon { font-size: 38rpx; }
.section-title { font-size: 34rpx; font-weight: 700; color: #2C1810; }

/* ── 快捷提问 ── */
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}
.quick-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx 24rpx;
  display: flex; align-items: center; gap: 18rpx;
  box-shadow: 0 4rpx 16rpx rgba(200,80,60,0.08);
  border: 2rpx solid #FCE8E4;
  transition: transform .15s, box-shadow .15s, background .15s;
  cursor: pointer;
}
.quick-card:active {
  transform: scale(0.97);
  background: #FFF5F3;
}
.quick-emoji { font-size: 44rpx; flex-shrink: 0; }
.quick-text  { font-size: 30rpx; color: #3D1A10; font-weight: 500; line-height: 1.4; }

/* ── 小贴士 ── */
.tip-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx;
  border-left: 8rpx solid #E8314A;
  box-shadow: 0 4rpx 20rpx rgba(200,80,60,0.1);
}
.tip-tag {
  display: inline-block;
  background: #FFF0EE; border-radius: 10rpx; padding: 8rpx 20rpx;
  margin-bottom: 20rpx;
}
.tip-tag text { font-size: 26rpx; color: #E8314A; font-weight: 600; }
.tip-content { font-size: 32rpx; color: #3D1A10; line-height: 1.7; display: block; }
.tip-ask {
  margin-top: 24rpx;
  text-align: right;
}
.tip-ask text { font-size: 28rpx; color: #E8314A; font-weight: 600; }

/* ── Tabbar ── */
.tabbar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex;
  background: #fff;
  border-top: 1rpx solid #F0E8E4;
  padding: 16rpx 0;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 24rpx rgba(0,0,0,0.06);
}
.tab {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 8rpx; padding: 12rpx 0;
  min-height: 88rpx;
}
.tab-icon  { font-size: 44rpx; }
.tab-label { font-size: 24rpx; color: #999; }
.tab.active .tab-label { color: #E8314A; font-weight: 600; }
</style>
