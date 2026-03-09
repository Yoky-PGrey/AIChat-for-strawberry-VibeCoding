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
/* 全局响应式基础 */
page {
  background: #FDF6F0;
  height: 100%;
  font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
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
