// utils/animations.js — 统一动画工具模块
// 提供跨平台的动画效果，支持Vue 3 Transition和CSS动画

/**
 * 动画配置常量
 */
export const ANIMATIONS = {
  // 淡入淡出
  FADE: {
    in: {
      opacity: [0, 1],
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    out: {
      opacity: [1, 0],
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // 滑动（上）
  SLIDE_UP: {
    in: {
      translateY: [30, 0],
      opacity: [0, 1],
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    out: {
      translateY: [0, -30],
      opacity: [1, 0],
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // 滑动（下）
  SLIDE_DOWN: {
    in: {
      translateY: [-30, 0],
      opacity: [0, 1],
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    out: {
      translateY: [0, 30],
      opacity: [1, 0],
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // 缩放
  SCALE: {
    in: {
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 350,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    out: {
      scale: [1, 0.9],
      opacity: [1, 0],
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // 弹跳（用于按钮点击反馈）
  BOUNCE: {
    in: {
      scale: [1, 0.95, 1],
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // 打字机效果（用于消息渲染）
  TYPEWRITER: {
    keyframes: [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    duration: 500,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

/**
 * 动画工具类
 */
export class AnimationHelper {
  /**
   * 应用CSS动画到元素
   * @param {HTMLElement} element DOM元素
   * @param {Object} animation 动画配置
   * @param {Function} onComplete 完成回调
   */
  static applyAnimation(element, animation, onComplete = null) {
    if (!element || !animation) return

    // 提取动画参数
    const {
      opacity = null,
      translateX = null,
      translateY = null,
      scale = null,
      rotate = null,
      duration = 300,
      easing = 'ease',
      keyframes = null
    } = animation

    // 构建关键帧
    let keyframesArray = keyframes

    if (!keyframesArray) {
      const startFrame = {}
      const endFrame = {}

      if (Array.isArray(opacity)) {
        startFrame.opacity = opacity[0]
        endFrame.opacity = opacity[1]
      }

      if (Array.isArray(translateX)) {
        startFrame.transform = `translateX(${translateX[0]}px)`
        endFrame.transform = `translateX(${translateX[1]}px)`
      } else if (Array.isArray(translateY)) {
        startFrame.transform = `translateY(${translateY[0]}px)`
        endFrame.transform = `translateY(${translateY[1]}px)`
      }

      if (Array.isArray(scale)) {
        if (startFrame.transform) {
          startFrame.transform += ` scale(${scale[0]})`
          endFrame.transform += ` scale(${scale[1]})`
        } else {
          startFrame.transform = `scale(${scale[0]})`
          endFrame.transform = `scale(${scale[1]})`
        }
      }

      if (Array.isArray(rotate)) {
        if (startFrame.transform) {
          startFrame.transform += ` rotate(${rotate[0]}deg)`
          endFrame.transform += ` rotate(${rotate[1]}deg)`
        } else {
          startFrame.transform = `rotate(${rotate[0]}deg)`
          endFrame.transform = `rotate(${rotate[1]}deg)`
        }
      }

      keyframesArray = [startFrame, endFrame]
    }

    // 应用动画
    const animationInstance = element.animate(keyframesArray, {
      duration,
      easing,
      fill: 'forwards'
    })

    // 处理完成回调
    if (onComplete) {
      animationInstance.onfinish = () => {
        onComplete()
      }
    }

    return animationInstance
  }

  /**
   * 创建消息气泡入场动画
   * @param {HTMLElement} element 消息气泡元素
   * @param {boolean} isUser 是否用户消息
   * @param {number} delay 延迟时间(ms)
   */
  static messageBubbleIn(element, isUser = false, delay = 0) {
    if (!element) return

    // 根据消息类型选择不同的入场方向
    const animation = isUser
      ? { ...ANIMATIONS.SLIDE_UP.in, translateX: [20, 0] }
      : { ...ANIMATIONS.SLIDE_UP.in, translateX: [-20, 0] }

    if (delay > 0) {
      setTimeout(() => {
        this.applyAnimation(element, animation)
      }, delay)
    } else {
      this.applyAnimation(element, animation)
    }
  }

  /**
   * 创建按钮点击反馈动画
   * @param {HTMLElement} element 按钮元素
   */
  static buttonClick(element) {
    if (!element) return

    const animation = ANIMATIONS.BOUNCE.in
    this.applyAnimation(element, animation, () => {
      // 动画完成后恢复原状
      setTimeout(() => {
        element.style.transform = ''
      }, 50)
    })
  }

  /**
   * 创建打字机效果（用于消息逐字显示）
   * @param {HTMLElement} element 文本容器
   * @param {string} text 要显示的文本
   * @param {number} speed 打字速度(ms/字符)
   * @param {Function} onComplete 完成回调
   */
  static typewriterEffect(element, text, speed = 50, onComplete = null) {
    if (!element || !text) return

    let i = 0
    element.textContent = ''

    function typeCharacter() {
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
        setTimeout(typeCharacter, speed)
      } else if (onComplete) {
        onComplete()
      }
    }

    typeCharacter()
  }

  /**
   * 创建加载旋转动画
   * @param {HTMLElement} element 旋转元素
   * @param {number} duration 旋转周期(ms)
   */
  static createSpinAnimation(element, duration = 1000) {
    if (!element) return

    const animation = {
      rotate: [0, 360],
      duration,
      easing: 'linear',
      iterations: Infinity
    }

    return this.applyAnimation(element, animation)
  }

  /**
   * 停止动画
   * @param {Animation} animationInstance 动画实例
   */
  static stopAnimation(animationInstance) {
    if (animationInstance) {
      animationInstance.cancel()
    }
  }
}

/**
 * Vue 3 Transition 工具
 */
export const TransitionHelpers = {
  /**
   * 消息气泡过渡类名
   */
  messageTransition: {
    enterActiveClass: 'message-enter-active',
    enterFromClass: 'message-enter-from',
    enterToClass: 'message-enter-to',
    leaveActiveClass: 'message-leave-active',
    leaveFromClass: 'message-leave-from',
    leaveToClass: 'message-leave-to'
  },

  /**
   * 页面切换过渡类名
   */
  pageTransition: {
    enterActiveClass: 'page-enter-active',
    enterFromClass: 'page-enter-from',
    enterToClass: 'page-enter-to',
    leaveActiveClass: 'page-leave-active',
    leaveFromClass: 'page-leave-from',
    leaveToClass: 'page-leave-to'
  }
}

/**
 * CSS动画类名工具
 */
export const CSSAnimations = {
  /**
   * 淡入
   */
  fadeIn: 'animate-fade-in',

  /**
   * 淡出
   */
  fadeOut: 'animate-fade-out',

  /**
   * 上滑进入
   */
  slideUpIn: 'animate-slide-up-in',

  /**
   * 上滑离开
   */
  slideUpOut: 'animate-slide-up-out',

  /**
   * 下滑进入
   */
  slideDownIn: 'animate-slide-down-in',

  /**
   * 下滑离开
   */
  slideDownOut: 'animate-slide-down-out',

  /**
   * 缩放进入
   */
  scaleIn: 'animate-scale-in',

  /**
   * 缩放离开
   */
  scaleOut: 'animate-scale-out',

  /**
   * 弹跳效果
   */
  bounce: 'animate-bounce',

  /**
   * 脉动效果（用于加载）
   */
  pulse: 'animate-pulse',

  /**
   * 旋转效果
   */
  spin: 'animate-spin'
}

/**
 * 全局CSS动画定义（应在uni.scss中导入）
 */
export const GlobalAnimationCSS = `
/* 淡入 */
.animate-fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 淡出 */
.animate-fade-out {
  animation: fadeOut 0.2s ease;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 上滑进入 */
.animate-slide-up-in {
  animation: slideUpIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUpIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 上滑离开 */
.animate-slide-up-out {
  animation: slideUpOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUpOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-30px);
  }
}

/* 缩放进入 */
.animate-scale-in {
  animation: scaleIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 弹跳效果 */
.animate-bounce {
  animation: bounce 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.95); }
}

/* 脉动效果 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 旋转效果 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 消息气泡过渡 */
.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* 页面过渡 */
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-to,
.page-leave-from {
  opacity: 1;
  transform: translateX(0);
}
`

/**
 * 工具函数：延迟执行
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 工具函数：节流
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 工具函数：防抖
 */
export function debounce(func, wait) {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}