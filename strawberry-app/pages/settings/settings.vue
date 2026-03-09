<template>
  <view class="settings-page">

    <view class="topbar">
      <view class="back" @tap="goBack"><text>‹ 返回</text></view>
      <text class="topbar-title">🍓 设置</text>
      <view style="width:100rpx;" />
    </view>

    <scroll-view scroll-y class="content">

      <!-- 字体大小 -->
      <view class="section">
        <text class="sec-title">字体大小</text>
        <view class="card">
          <view class="font-row">
            <view
              v-for="f in fontOptions"
              :key="f.key"
              class="font-opt"
              :class="store.fontSize === f.key ? 'font-active':''"
              @tap="store.setFontSize(f.key)"
            >
              <text :style="{ fontSize: f.rpx + 'rpx' }">字</text>
              <text class="font-label">{{ f.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 语音设置 -->
      <view class="section">
        <text class="sec-title">语音播报</text>
        <view class="card">
          <view class="row-item">
            <view>
              <text class="row-label">AI回复自动朗读</text>
              <text class="row-desc">开启后AI回答会自动读出来</text>
            </view>
            <switch :checked="store.autoSpeak" color="#E8314A"
              @change="e => store.setAutoSpeak(e.detail.value)" />
          </view>
        </view>
      </view>

      <!-- DeepSeek -->
      <view class="section">
        <text class="sec-title">AI 接口配置</text>
        <view class="card">
          <view class="row-item col">
            <text class="row-label">DeepSeek API Key</text>
            <view class="key-row">
              <input
                v-model="apiKey"
                class="key-input"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                :password="!showKey"
              />
              <view class="eye" @tap="showKey=!showKey">
                <text>{{ showKey ? '🙈':'👁️' }}</text>
              </view>
            </view>
          </view>
        </view>
        <text class="sec-hint">在 platform.deepseek.com 申请免费 API Key</text>
      </view>

      <!-- 知识库 -->
      <view class="section">
        <text class="sec-title">知识库配置</text>
        <view class="card">
          <view class="row-item col">
            <text class="row-label">GraphRAG 服务地址</text>
            <input
              v-model="kbUrl"
              class="key-input"
              placeholder="http://192.168.x.x:8000/query"
            />
          </view>
          <view class="divider" />
          <view class="row-item">
            <text class="row-label">连接状态</text>
            <text :class="kbStatus.ok ? 'st-ok':'st-off'">{{ kbStatus.text }}</text>
          </view>
        </view>
        <view class="test-btn" @tap="testKb">
          <text>🔗 测试知识库连接</text>
        </view>
      </view>

      <!-- 语音识别配置 -->
      <view class="section">
        <text class="sec-title">语音识别配置 (讯飞ASR)</text>
        <view class="card">
          <view class="row-item col">
            <text class="row-label">APPID</text>
            <input
              v-model="asrAppId"
              class="key-input"
              placeholder="您的讯飞APPID"
            />
          </view>
          <view class="divider" />
          <view class="row-item col">
            <text class="row-label">API Key</text>
            <view class="key-row">
              <input
                v-model="asrApiKey"
                class="key-input"
                placeholder="讯飞API Key"
                :password="!showASRKey"
              />
              <view class="eye" @tap="showASRKey=!showASRKey">
                <text>{{ showASRKey ? '🙈':'👁️' }}</text>
              </view>
            </view>
          </view>
          <view class="divider" />
          <view class="row-item col">
            <text class="row-label">API Secret</text>
            <view class="key-row">
              <input
                v-model="asrApiSecret"
                class="key-input"
                placeholder="讯飞API Secret"
                :password="!showASRKey"
              />
              <view class="eye" @tap="showASRKey=!showASRKey">
                <text>{{ showASRKey ? '🙈':'👁️' }}</text>
              </view>
            </view>
          </view>
          <view class="divider" />
          <view class="row-item">
            <text class="row-label">连接状态</text>
            <text :class="asrStatus.ok ? 'st-ok':'st-off'">{{ asrStatus.text }}</text>
          </view>
        </view>
        <view class="test-btn" @tap="testASR">
          <text>🎤 测试语音识别连接</text>
        </view>
        <text class="sec-hint">前往讯飞开放平台 (xfyun.cn) 申请语音识别服务</text>
      </view>

      <!-- 保存 -->
      <view class="save-btn" @tap="save">
        <text>保 存 设 置</text>
      </view>

      <!-- 关于 -->
      <view class="section">
        <view class="about-card">
          <text class="about-logo">🍓</text>
          <text class="about-name">草莓管家</text>
          <text class="about-ver">v1.0.0</text>
          <text class="about-desc">专为草莓种植者打造的AI问答助手</text>
        </view>
      </view>

      <view style="height:60rpx;" />
    </scroll-view>

  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useChatStore } from '@/store/chat.js'
import { testASRConfig } from '@/utils/asr.js'

export default {
  name: 'SettingsPage',
  setup() {
    const store   = useChatStore()
    const apiKey  = ref('')
    const kbUrl   = ref('')
    const showKey = ref(false)
    const kbStatus= ref({ ok: false, text: '未测试' })
    const asrAppId    = ref('')
    const asrApiKey   = ref('')
    const asrApiSecret= ref('')
    const asrStatus   = ref({ ok: false, text: '未测试' })
    const showASRKey  = ref(false)

    const fontOptions = [
      { key: 'sm', label: '小', rpx: 28 },
      { key: 'md', label: '中', rpx: 36 },
      { key: 'lg', label: '大', rpx: 44 },
      { key: 'xl', label: '特大', rpx: 52 },
    ]

    onMounted(() => {
      store.load()
      apiKey.value = uni.getStorageSync('ds_api_key') || ''
      kbUrl.value  = uni.getStorageSync('kb_url')     || ''
      asrAppId.value     = uni.getStorageSync('asr_appid')      || ''
      asrApiKey.value    = uni.getStorageSync('asr_api_key')    || ''
      asrApiSecret.value = uni.getStorageSync('asr_api_secret') || ''
    })

    function save() {
      if (!apiKey.value.trim()) {
        uni.showToast({ title: '请填写 DeepSeek API Key', icon: 'none' }); return
      }
      uni.setStorageSync('ds_api_key', apiKey.value.trim())
      uni.setStorageSync('kb_url',     kbUrl.value.trim())
      uni.setStorageSync('asr_appid',      asrAppId.value.trim())
      uni.setStorageSync('asr_api_key',    asrApiKey.value.trim())
      uni.setStorageSync('asr_api_secret', asrApiSecret.value.trim())
      uni.showToast({ title: '保存成功 ✅', icon: 'none' })
    }

    async function testKb() {
      const url = kbUrl.value.trim()
      if (!url) { uni.showToast({ title: '请先填写知识库地址', icon: 'none' }); return }
      kbStatus.value = { ok: false, text: '测试中…' }
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '草莓', method: 'local', top_k: 1 })
        })
        kbStatus.value = r.ok
          ? { ok: true,  text: '连接成功 ✅' }
          : { ok: false, text: `失败 (${r.status}) ❌` }
      } catch {
        kbStatus.value = { ok: false, text: '无法连接 ❌' }
      }
    }

    async function testASR() {
      const appId = asrAppId.value.trim()
      const apiKey = asrApiKey.value.trim()
      const apiSecret = asrApiSecret.value.trim()

      if (!appId || !apiKey || !apiSecret) {
        uni.showToast({ title: '请先填写完整的 ASR 配置', icon: 'none' })
        asrStatus.value = { ok: false, text: '配置不完整 ❌' }
        return
      }

      asrStatus.value = { ok: false, text: '测试中…' }

      // 先保存配置，以便测试函数可以读取
      uni.setStorageSync('asr_appid', appId)
      uni.setStorageSync('asr_api_key', apiKey)
      uni.setStorageSync('asr_api_secret', apiSecret)

      try {
        const result = await testASRConfig()
        asrStatus.value = result.success
          ? { ok: true, text: '连接成功 ✅' }
          : { ok: false, text: `失败: ${result.message} ❌` }
      } catch (error) {
        asrStatus.value = { ok: false, text: `测试异常: ${error.message} ❌` }
      }
    }

    function goBack() { uni.navigateBack() }

    return { store, apiKey, kbUrl, showKey, kbStatus, asrAppId, asrApiKey, asrApiSecret, asrStatus, showASRKey, fontOptions, save, testKb, testASR, goBack }
  }
}
</script>

<style>
page { background: #FDF6F0; }
.settings-page {
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
.back text    { color: #E8314A; font-size: 34rpx; font-weight: 600; }
.topbar-title { font-size: 36rpx; font-weight: 700; color: #2C1810; }

.content { padding: 28rpx; }
.section { margin-bottom: 36rpx; }
.sec-title {
  font-size: 26rpx; color: #999; text-transform: uppercase;
  letter-spacing: 2rpx; margin-bottom: 14rpx; margin-left: 6rpx; display: block;
}
.sec-hint { font-size: 24rpx; color: #aaa; margin-top: 10rpx; margin-left: 6rpx; display: block; }

.card { background: #fff; border-radius: 24rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(200,80,60,0.06); }

/* 字体选择 */
.font-row { display: flex; padding: 24rpx; gap: 16rpx; }
.font-opt {
  flex: 1; background: #F5F0EE; border-radius: 16rpx; padding: 20rpx 0;
  display: flex; flex-direction: column; align-items: center; gap: 10rpx;
  border: 3rpx solid transparent;
}
.font-active { background: #FFF0EE; border-color: #E8314A; }
.font-label  { font-size: 22rpx; color: #888; }
.font-active .font-label { color: #E8314A; font-weight: 600; }

/* 行 */
.row-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28rpx 30rpx; gap: 20rpx;
}
.row-item.col { flex-direction: column; align-items: flex-start; }
.row-label { font-size: 32rpx; color: #2C1810; font-weight: 500; }
.row-desc  { font-size: 24rpx; color: #aaa; margin-top: 6rpx; display: block; }
.divider   { height: 1rpx; background: #F5F0EE; margin: 0 30rpx; }

/* Key输入 */
.key-row { display: flex; align-items: center; gap: 16rpx; width: 100%; margin-top: 12rpx; }
.key-input {
  flex: 1; background: #F5F0EE; border-radius: 16rpx;
  padding: 18rpx 24rpx; font-size: 28rpx; color: #2C1810;
}
.eye { font-size: 36rpx; }

.st-ok  { color: #3D7A4F; font-size: 30rpx; font-weight: 600; }
.st-off { color: #E8314A; font-size: 30rpx; }

.test-btn {
  margin-top: 16rpx; background: #FFF0EE;
  border-radius: 16rpx; padding: 24rpx; text-align: center;
  transition: all .15s;
  cursor: pointer;
}
.test-btn text { font-size: 30rpx; color: #E8314A; font-weight: 600; }
.test-btn:active {
  transform: scale(0.97);
}

.save-btn {
  background: linear-gradient(135deg, #E8314A, #C0392B);
  border-radius: 24rpx; padding: 36rpx;
  text-align: center; margin-bottom: 36rpx;
  box-shadow: 0 8rpx 24rpx rgba(232,49,74,0.3);
}
.save-btn text { font-size: 36rpx; color: #fff; font-weight: 700; letter-spacing: 6rpx; }

/* 关于 */
.about-card {
  background: #fff; border-radius: 24rpx; padding: 40rpx;
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
}
.about-logo { font-size: 80rpx; }
.about-name { font-size: 36rpx; font-weight: 700; color: #2C1810; }
.about-ver  { font-size: 24rpx; color: #aaa; }
.about-desc { font-size: 28rpx; color: #888; text-align: center; line-height: 1.6; }
</style>
