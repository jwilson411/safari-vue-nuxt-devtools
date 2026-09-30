import { detectionMessage } from './message-guard.mjs'

// Lifecycle comes from this isolated extension script, never from page data.
chrome.runtime.sendMessage({ action: 'safari:content-ready' })
window.addEventListener('message', (event) => {
  const detection = detectionMessage(event, window)
  if (detection) chrome.runtime.sendMessage(detection)
  if (event.source === window && event.origin === location.origin
    && ['http:', 'https:'].includes(location.protocol)
    && event.data?.key === '__SAFARI_VUE_SESSION__'
    && typeof event.data.session === 'string'
    && /^[a-zA-Z0-9-]{1,128}$/.test(event.data.session)) {
    chrome.runtime.sendMessage({ action: 'safari:bind-session', session: event.data.session })
  }
})
