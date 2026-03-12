<script>
export default {
	onLaunch: function () {
		console.log('🍓 草莓管家 启动');
	},
	onShow: function () {
		console.log('App Show');
	},
	onHide: function () {
		console.log('App Hide');
	}
};
</script>

<style>
/* 引入 Remix Icon */
@import url("https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css");

/* 全局响应式基础 */
page {
  background: #fdf6ec; /* $cream */
  height: 100%;
  font-family: 'Noto Sans SC', -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
  color: #2c1810; /* $text */
  overflow-x: hidden;
  width: 100%;
}

/* 全局盒模型重置 */
view, scroll-view, swiper, textarea, input, text {
  box-sizing: border-box;
}

/* 横屏保护 - 确保不报错 */
@media screen and (orientation: landscape) {
  page {
    overflow: hidden;
    max-height: 100vh;
  }
  .home, .chat-page, .history-page, .settings-page {
    max-height: 100vh;
    overflow-y: auto;
  }
}
</style>
