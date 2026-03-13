<template>
	<view class="gemini-container">
		<view class="fixed-header">
			<view class="picker-wrapper">
				<text class="label">当前助手：</text>
				<picker @change="handleAssistantChange" :value="assistantIndex" :range="assistants" range-key="name">
					<view class="picker-value">
						<text>{{ assistants[assistantIndex].name }}</text>
						<uni-icons type="bottom" size="14" color="#666" style="margin-left: 8rpx" />
					</view>
				</picker>
			</view>
		</view>

		<scroll-view class="chat-scroll-view" scroll-y :scroll-into-view="scrollTarget" scroll-with-animation>
			<view style="height: 120rpx"></view>

			<view v-for="(item, index) in messages" :key="index" :id="'msg' + index" :class="['message-row', item.role]">
				<view class="content-wrapper">
					<view class="text-card">
						<text class="content-text" selectable>{{ item.content }}</text>
						<view v-if="item.role === 'ai' && item.content === ''" class="typing-dot"></view>
					</view>
				</view>
			</view>

			<view id="scroll-bottom-anchor" style="height: 240rpx"></view>
		</scroll-view>

		<view class="fixed-input-section">
			<view class="input-pill">
				<textarea
					class="input-box"
					v-model="inputValue"
					placeholder="输入你的问题..."
					confirm-type="send"
					auto-height
					:fixed="true"
					:cursor-spacing="20"
					:disable-default-padding="true"
					@confirm="sendMessage"
				/>
				<view class="send-action" @click="sendMessage">
					<uni-icons type="up" size="24" :color="inputValue.trim() ? '#4285f4' : '#ccc'" />
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { getToken } from '@/utils/auth';

const messages = ref([]);
const inputValue = ref('');
const scrollTarget = ref('');
const assistantIndex = ref(0);

const assistants = [
	{ name: '草莓专家', prompt: '你是一个草莓专家...' },
	{ name: '中药专家', prompt: '你是一个中药专家...' },
	{ name: '通用助手', prompt: 'You are a helpful assistant.' }
];

const baseUrl = 'http://localhost:8080';
const API_KEY = '';

function getHeaders() {
	const token = getToken();
	const headers = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = 'Bearer ' + token;
	return headers;
}

function scrollToBottom() {
	nextTick(() => {
		scrollTarget.value = '';
		setTimeout(() => {
			scrollTarget.value = 'scroll-bottom-anchor';
		}, 150);
	});
}

function handleAssistantChange(e) {
	assistantIndex.value = e.detail.value;
	uni.showToast({ title: `已切换至${assistants[assistantIndex.value].name}`, icon: 'none' });
}

onMounted(() => {
	uni.request({
		url: baseUrl + '/chat/history/list',
		method: 'GET',
		header: getHeaders(),
		success: (res) => {
			if (res.data.code === 200 && res.data.rows) {
				messages.value = res.data.rows.map((m) => ({
					role: m.role === 'assistant' ? 'ai' : 'user',
					content: m.content
				}));
				setTimeout(scrollToBottom, 300);
			}
		}
	});
});

async function sendMessage() {
	const text = inputValue.value.trim();
	if (!text) return;
	inputValue.value = '';
	messages.value.push({ role: 'user', content: text });
	saveToDB('user', text);
	const aiMessageIndex = messages.value.length;
	messages.value.push({ role: 'ai', content: '' });
	scrollToBottom();

	try {
		const response = await fetch('https://api.deepseek.com/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
			body: JSON.stringify({
				model: 'deepseek-chat',
				messages: [
					{ role: 'system', content: assistants[assistantIndex.value].prompt },
					{ role: 'user', content: text }
				],
				stream: true
			})
		});
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let fullAiContent = '';
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			const chunk = decoder.decode(value, { stream: true });
			const lines = chunk.split('\n');
			for (const line of lines) {
				if (line.startsWith('data: ') && line !== 'data: [DONE]') {
					try {
						const data = JSON.parse(line.replace('data: ', ''));
						const content = data.choices[0].delta?.content || '';
						messages.value[aiMessageIndex].content += content;
						fullAiContent += content;
						scrollToBottom();
					} catch (e) {}
				}
			}
		}
		if (fullAiContent) saveToDB('assistant', fullAiContent);
	} catch (err) {
		messages.value[aiMessageIndex].content = '抱歉，连接失败。';
	}
}

async function saveToDB(role, content) {
	uni.request({
		url: baseUrl + '/chat/history',
		method: 'POST',
		header: getHeaders(),
		data: { role, content }
	});
}
</script>

<style lang="scss" scoped>
/* 禁用页面级滚动，确保内部容器接管滑动 */
page {
	overflow: hidden;
	height: 100%;
}

.gemini-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #ffffff;
}

/* 1. 顶部切换助手栏：固定定位 */
.fixed-header {
	position: fixed;
	top: 44;
	left: 0;
	right: 0;
	height: 100rpx;
	background-color: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10px);
	border-bottom: 1rpx solid #eee;
	z-index: 1000;
	display: flex;
	align-items: center;
	padding: 0 40rpx;
	/* 处理刘海屏高度适配 */
	padding-top: env(safe-area-inset-top);

	.picker-wrapper {
		display: flex;
		align-items: center;
		font-size: 28rpx;
		color: #666;

		.picker-value {
			display: flex;
			align-items: center;
			background: #f0f4f9;
			padding: 10rpx 28rpx;
			border-radius: 40rpx;
			color: #333;
			font-weight: bold;
			margin-left: 12rpx;
		}
	}
}

/* 2. 聊天区域：使用你提供的 padding 和宽度策略 */
.chat-scroll-view {
	flex: 1;
	height: 0; /* 激活 flex 滚动容器的关键 */
	padding: 0 40rpx;
}

.message-row {
	display: flex;
	margin-bottom: 40rpx;
	width: 100%;

	&.user {
		justify-content: flex-end;
		.content-wrapper {
			display: flex;
			justify-content: flex-end;
			width: 100%;
		}
		.text-card {
			background-color: #f0f4f9;
			padding: 24rpx 36rpx;
			border-radius: 36rpx;
			max-width: 80%; /* 限制宽度，防止长句贴边 */
			min-width: 40rpx;
		}
		.content-text {
			color: #1f1f1f;
			text-align: left;
		}
	}

	&.ai {
		justify-content: flex-start;
		.content-wrapper {
			width: 100%;
		}
		.text-card {
			background-color: transparent;
			padding: 10rpx 0;
			width: 100%;
		}
		.content-text {
			font-size: 32rpx;
			line-height: 1.8;
			color: #1f1f1f;
		}
	}
}

/* 文本策略：参考你的设置 */
.content-text {
	word-break: break-word; /* 只有长单词才会强制断行 */
	white-space: pre-wrap;
	font-size: 30rpx;
	display: block;
}

/* 3. 输入框区域：垂直居中修正版 */
.fixed-input-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 30rpx calc(40rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	z-index: 1000;
	border-top: 1rpx solid #eee;
}

.input-pill {
	display: flex;
	align-items: center; /* 修正：确保垂直居中 */
	background-color: #f0f4f9;
	border-radius: 50rpx;
	padding: 10rpx 36rpx; /* 调整 padding 使内部 textarea 居中 */
	min-height: 96rpx;
	box-sizing: border-box;
}

.input {
	flex: 1;
	font-size: 32rpx;
	background: transparent;
	padding: 12rpx 0; /* 这里的 padding 和 line-height 共同决定居中 */
	line-height: 48rpx;
	min-height: 48rpx;
}

.send-action {
	margin-left: 20rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 打字机动画 */
.typing-dot {
	width: 12rpx;
	height: 32rpx;
	background-color: #4285f4;
	display: inline-block;
	animation: blink 1s infinite;
	margin-left: 10rpx;
	vertical-align: middle;
}

@keyframes blink {
	50% {
		opacity: 0;
	}
}
</style>
