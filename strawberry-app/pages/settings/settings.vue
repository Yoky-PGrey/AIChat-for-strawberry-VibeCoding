<template>
  <view class="settings-page">
    <!-- 顶部栏 -->
    <view class="settings-topbar">
      <view class="back-btn" @tap="goBack">
        <i class="ri-arrow-left-s-line back-icon"></i>
      </view>
      <text class="topbar-title">设置</text>
    </view>

    <scroll-view scroll-y class="settings-body">
      <!-- 显示设置 -->
      <view class="settings-section">
        <view class="section-title">显示</view>
        <view class="settings-card">
          <view class="settings-row col">
            <view class="row-header">
              <text class="sr-label">字体大小</text>
              <text class="sr-sub">调整后全局生效</text>
            </view>
            <view class="font-preview" :style="{ fontSize: store.fontSizeRpx + 'rpx' }">
              草莓管家，您好！
            </view>
            <view class="font-size-btns">
              <view 
                v-for="f in fontOptions" 
                :key="f.key"
                class="fs-btn"
                :class="{ active: store.fontSize === f.key }"
                @tap="store.setFontSize(f.key)"
              >{{ f.label }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- AI模型配置 -->
      <view class="settings-section">
        <view class="section-title">大模型配置</view>
        <view class="settings-card">
          <view class="settings-row col">
            <text class="sr-label">API 密钥 (Key)</text>
            <view class="input-relative">
              <input 
                v-model="apiKey" 
                class="settings-input" 
                :password="!showKey"
                placeholder="sk-xxxxxxxxxxxxxxxx"
              />
              <view class="key-show-btn" @tap="showKey = !showKey">
                <i :class="showKey ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
              </view>
            </view>
          </view>
          <view class="settings-row">
            <view>
              <text class="sr-label">模型选择</text>
              <text class="sr-sub">推荐使用 DeepSeek</text>
            </view>
            <picker :range="models" @change="onModelChange">
              <view class="settings-select">{{ currentModel }}</view>
            </picker>
          </view>
          <view class="settings-row col">
            <text class="sr-label">API 地址</text>
            <input 
              v-model="apiUrl" 
              class="settings-input" 
              placeholder="https://api.deepseek.com/v1"
            />
          </view>
        </view>
      </view>

      <!-- 知识库配置 -->
      <view class="settings-section">
        <view class="section-title">知识库配置</view>
        <view class="settings-card">
          <view class="settings-row col">
            <text class="sr-label">GraphRAG 服务地址</text>
            <input 
              v-model="kbUrl" 
              class="settings-input" 
              placeholder="http://192.168.x.x:8000/query"
            />
          </view>
          <view class="settings-row">
            <text class="sr-label">连接状态</text>
            <text :class="kbStatus.ok ? 'st-ok' : 'st-off'">{{ kbStatus.text }}</text>
          </view>
        </view>
        <view class="test-btn" @tap="testKb">
          <text>🔗 测试知识库连接</text>
        </view>
      </view>

      <!-- 语音设置 -->
      <view class="settings-section">
        <view class="section-title">语音设置</view>
        <view class="settings-card">
          <view class="settings-row">
            <view>
              <text class="sr-label">语音输出</text>
              <text class="sr-sub">回答自动朗读</text>
            </view>
            <switch :checked="store.autoSpeak" color="#c0392b" @change="e => store.setAutoSpeak(e.detail.value)" />
          </view>
          <view class="settings-row">
            <view>
              <text class="sr-label">语音输入</text>
              <text class="sr-sub">长按麦克风说话</text>
            </view>
            <switch checked color="#c0392b" />
          </view>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view class="save-btn" @tap="save">
        <text>保 存 设 置</text>
      </view>

      <!-- 关于 -->
      <view class="about-section">
        <text class="about-logo">🍓</text>
        <text class="about-name">草莓管家</text>
        <text class="about-info">版本 1.0.0 · GraphRAG 驱动</text>
        <text class="about-info">专为草莓种植户打造</text>
      </view>

      <view style="height: 80rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useChatStore } from '@/store/chat.js'

export default {
  name: 'SettingsPage',
  setup() {
    const store = useChatStore()
    const apiKey = ref('')
    const apiUrl = ref('https://api.deepseek.com/v1')
    const kbUrl = ref('')
    const showKey = ref(false)
    const kbStatus = ref({ ok: false, text: '未测试' })
    
    const models = ['DeepSeek-V3', 'DeepSeek-R1', 'GPT-4o', 'Qwen-Plus']
    const currentModel = ref('DeepSeek-V3')

    const fontOptions = [
      { key: 'sm', label: '小' },
      { key: 'md', label: '标准' },
      { key: 'lg', label: '大' },
      { key: 'xl', label: '特大' }
    ]

    onMounted(() => {
      store.load()
      apiKey.value = uni.getStorageSync('ds_api_key') || ''
      apiUrl.value = uni.getStorageSync('ds_api_url') || 'https://api.deepseek.com/v1'
      kbUrl.value = uni.getStorageSync('kb_url') || ''
    })

    function onModelChange(e) {
      currentModel.value = models[e.detail.value]
    }

    function save() {
      uni.setStorageSync('ds_api_key', apiKey.value.trim())
      uni.setStorageSync('ds_api_url', apiUrl.value.trim())
      uni.setStorageSync('kb_url', kbUrl.value.trim())
      uni.showToast({ title: '保存成功 ✅', icon: 'none' })
    }

    async function testKb() {
      const url = kbUrl.value.trim()
      if (!url) { uni.showToast({ title: '请先填写地址', icon: 'none' }); return }
      kbStatus.value = { ok: false, text: '测试中…' }
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '草莓', method: 'local', top_k: 1 })
        })
        kbStatus.value = r.ok ? { ok: true, text: '连接成功 ✅' } : { ok: false, text: '失败 ❌' }
      } catch {
        kbStatus.value = { ok: false, text: '无法连接 ❌' }
      }
    }

    function goBack() { uni.navigateBack() }

    return { 
      store, apiKey, apiUrl, kbUrl, showKey, kbStatus, models, currentModel, fontOptions,
      onModelChange, save, testKb, goBack 
    }
  }
}
</script>

<style lang="scss">
.settings-page {
  height: 100vh;
  background: #fdf6ec; /* $cream */
  display: flex;
  flex-direction: column;
}

.settings-topbar {
  padding: 20rpx 32rpx 28rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: #fffcf7; /* $warm-white */
  border-bottom: 3rpx solid #efebe9;
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 88rpx;
}

.back-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon { font-size: 52rpx; color: #2c1810; }

.topbar-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #2c1810;
}

.settings-body {
  flex: 1;
  padding: 24rpx 28rpx;
}

.settings-section {
  margin-bottom: 40rpx;
}

.section-title {
  padding: 24rpx 32rpx 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #a1887f;
  letter-spacing: 2rpx;
  text-transform: uppercase;
}

.settings-card {
  background: #fffcf7;
  border-radius: 36rpx;
  border: 3rpx solid #efebe9;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(109, 76, 65, 0.05);
}

.settings-row {
  padding: 32rpx 36rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #efebe9;
  gap: 24rpx;
}

.settings-row:last-child { border-bottom: none; }
.settings-row.col { flex-direction: column; align-items: flex-start; }

.sr-label { font-size: 32rpx; font-weight: 600; color: #2c1810; }
.sr-sub { font-size: 24rpx; color: #a1887f; margin-top: 6rpx; display: block; }

/* 字体预览 */
.font-preview {
  width: 100%;
  text-align: center;
  padding: 24rpx;
  background: #fdf6ec;
  border-radius: 24rpx;
  color: #2c1810;
  margin: 24rpx 0;
  border: 1rpx solid #efebe9;
  transition: font-size 0.2s;
}

.font-size-btns {
  display: flex;
  width: 100%;
  gap: 20rpx;
}

.fs-btn {
  flex: 1;
  padding: 24rpx 0;
  border-radius: 24rpx;
  border: 3rpx solid #efebe9;
  background: #fdf6ec;
  font-size: 30rpx;
  font-weight: 600;
  color: #5d4037;
  text-align: center;
  transition: all 0.15s;
}

.fs-btn.active {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
  box-shadow: 0 6rpx 20rpx rgba(192, 57, 43, 0.3);
}

/* 输入框 */
.input-relative { position: relative; width: 100%; margin-top: 20rpx; }

.settings-input {
  width: 100%;
  padding: 24rpx 32rpx;
  border: 3rpx solid #efebe9;
  border-radius: 24rpx;
  background: #fdf6ec;
  font-size: 30rpx;
  color: #2c1810;
}

.key-show-btn {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  padding: 12rpx;
  font-size: 36rpx;
  color: #a1887f;
  display: flex;
  align-items: center;
}

.settings-select {
  padding: 20rpx 32rpx;
  border: 3rpx solid #efebe9;
  border-radius: 24rpx;
  background: #fdf6ec;
  font-size: 30rpx;
  color: #2c1810;
  min-width: 280rpx;
  text-align: right;
}

.st-ok { color: #27ae60; font-weight: 700; }
.st-off { color: #c0392b; }

.test-btn {
  margin-top: 24rpx;
  background: #fdecea;
  border-radius: 24rpx;
  padding: 28rpx;
  text-align: center;
  transition: transform 0.1s;
}
.test-btn:active { transform: scale(0.98); }
.test-btn text { font-size: 30rpx; color: #c0392b; font-weight: 700; }

.save-btn {
  margin: 48rpx 0;
  background: linear-gradient(135deg, #c0392b, #922b21);
  border-radius: 40rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 12rpx 32rpx rgba(192, 57, 43, 0.35);
  transition: transform 0.1s;
}
.save-btn:active { transform: scale(0.98); }
.save-btn text { font-size: 36rpx; color: #fff; font-weight: 700; letter-spacing: 6rpx; }

/* 关于 */
.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.about-logo { font-size: 100rpx; margin-bottom: 16rpx; }
.about-name { font-size: 40rpx; font-weight: 700; color: #c0392b; margin-bottom: 12rpx; }
.about-info { font-size: 26rpx; color: #a1887f; margin-top: 6rpx; }
</style>
