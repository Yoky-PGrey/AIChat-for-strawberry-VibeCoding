// utils/tts.js — 系统 TTS 语音播报

let speaking = false

export function speak(text, { speed = 0.9, onDone } = {}) {
  if (!text) return
  stopSpeak()

  // #ifdef APP-PLUS
  plus.speech.startSpeaking({
    text, lang: 'zh-cn', speed,
    success:  () => { speaking = true },
    complete: () => { speaking = false; onDone?.() },
    fail:     () => { speaking = false }
  })
  // #endif

  // #ifdef H5
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'; u.rate = speed
    u.onend = () => { speaking = false; onDone?.() }
    window.speechSynthesis.speak(u)
    speaking = true
  }
  // #endif
}

export function stopSpeak() {
  // #ifdef APP-PLUS
  try { plus.speech.stopSpeaking() } catch (_) {}
  // #endif
  // #ifdef H5
  try { window.speechSynthesis?.cancel() } catch (_) {}
  // #endif
  speaking = false
}

export const isSpeaking = () => speaking
