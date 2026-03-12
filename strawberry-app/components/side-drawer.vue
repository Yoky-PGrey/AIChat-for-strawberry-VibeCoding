<template>
  <view
    class="side-drawer"
    :class="{ 'drawer-open': open }"
    @tap="handleBackdropTap"
  >
    <view class="drawer-content" @tap.stop>
      <!-- 顶部栏 (同步 HTML 设计) -->
      <view class="drawer-header">
        <view class="logo-box">🍓</view>
        <view class="title-box">
          <text class="main-title">草莓管家</text>
          <text class="sub-title">GraphRAG 智能问答</text>
        </view>
      </view>

      <!-- 新建对话按钮 -->
      <view class="new-chat-btn" @tap="newChat">
        <i class="ri-add-circle-line plus-icon"></i>
        <text class="btn-text">新建对话</text>
      </view>

      <!-- 对话记录 -->
      <view class="section-label">历史记录</view>
      <scroll-view scroll-y class="history-list">
        <view
          v-for="(item, idx) in historyList"
          :key="idx"
          class="history-item"
          :class="{ 'history-active': currentPage === 'chat' && idx === 0 }"
          @tap="openHistory(item.id)"
        >
          <view class="hi-content">
            <text class="hi-title">{{ item.title }}</text>
            <text class="hi-date">{{ item.date || '今天 14:32' }}</text>
          </view>
          <view class="hi-del" @tap.stop="deleteHistory(idx)">
            <i class="ri-close-line"></i>
          </view>
        </view>
      </scroll-view>

      <!-- 底部设置区 -->
      <view class="drawer-footer">
        <view class="nav-btn" @tap="navigate('settings')">
          <i class="ri-settings-3-line nav-icon"></i>
          <text class="nav-text">设置</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SideDrawer',
  props: {
    open: { type: Boolean, default: false },
    currentPage: { type: String, default: 'home' }
  },
  emits: ['close', 'navigate'],
  setup(props, { emit }) {
    const historyList = ref([
      { id: 1, title: '草莓根腐病怎么处理？', date: '今天 14:32' },
      { id: 2, title: '红颜草莓和章姬的区别', date: '昨天 09:15' },
      { id: 3, title: '草莓授粉期间注意事项', date: '3天前' }
    ])

    function navigate(page) {
      emit('navigate', page)
      if (page === 'home') {
        uni.reLaunch({ url: '/pages/home/home' })
      } else if (page === 'settings') {
        uni.navigateTo({ url: '/pages/settings/settings' })
        close()
      }
    }

    function newChat() {
      emit('navigate', 'home')
      uni.reLaunch({ url: '/pages/home/home' })
    }

    function close() {
      emit('close')
    }

    function handleBackdropTap() {
      close()
    }

    function openHistory(id) {
      emit('navigate', 'home')
      close()
    }

    function deleteHistory(idx) {
      historyList.value.splice(idx, 1)
    }

    return { historyList, navigate, newChat, close, handleBackdropTap, openHistory, deleteHistory }
  }
}
</script>

<style lang="scss">
.side-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
  background: rgba(44, 24, 16, 0);
  transition: background 0.3s;
}

.drawer-open {
  pointer-events: auto;
  background: rgba(44, 24, 16, 0.45);
}

.drawer-content {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 78vw;
  background: #fffcf7; /* $warm-white */
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 3rpx solid #f5b7b1; /* $red-mid */
  overflow: hidden;
}

.drawer-open .drawer-content {
  transform: translateX(0);
}

/* ── 顶部栏 ── */
.drawer-header {
  padding: 40rpx 40rpx 36rpx;
  padding-top: calc(40rpx + env(safe-area-inset-top));
  background: linear-gradient(160deg, #c0392b 0%, #922b21 100%);
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.logo-box {
  width: 96rpx;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
}

.title-box {
  display: flex;
  flex-direction: column;
}

.main-title {
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.sub-title {
  color: #fff;
  font-size: 24rpx;
  opacity: 0.8;
  margin-top: 6rpx;
}

/* ── 新建对话按钮 ── */
.new-chat-btn {
  margin: 32rpx 28rpx 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 36rpx;
  background: #fdecea; /* $red-soft */
  border: 3rpx solid #f5b7b1; /* $red-mid */
  border-radius: 24rpx;
  transition: background 0.15s, transform 0.1s;
}

.new-chat-btn:active {
  background: #f5b7b1;
  transform: scale(0.97);
}

.plus-icon {
  font-size: 44rpx;
  color: #c0392b;
  font-weight: normal;
}

.btn-text {
  font-size: 32rpx;
  color: #c0392b;
  font-weight: 600;
}

/* ── 对话记录 ── */
.section-label {
  padding: 40rpx 36rpx 16rpx;
  font-size: 24rpx;
  color: #a1887f;
  letter-spacing: 2rpx;
  font-weight: 600;
  text-transform: uppercase;
}

.history-list {
  flex: 1;
  padding: 0 20rpx;
}

.history-item {
  padding: 28rpx 24rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #efebe9;
  position: relative;
  transition: background 0.15s;
  margin-bottom: 4rpx;
}

.history-item:active, .history-active {
  background: #fdecea;
}

.hi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hi-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #2c1810;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hi-date {
  font-size: 22rpx;
  color: #a1887f;
  margin-top: 8rpx;
}

.hi-del {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a1887f;
  font-size: 40rpx;
  opacity: 0.5;
}

/* ── 底部设置区 ── */
.drawer-footer {
  padding: 24rpx 28rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #efebe9;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 32rpx;
  border-radius: 24rpx;
  transition: background 0.15s;
}

.nav-btn:active {
  background: #efebe9;
}

.nav-icon {
  font-size: 48rpx;
}

.nav-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #5d4037;
}
</style>
