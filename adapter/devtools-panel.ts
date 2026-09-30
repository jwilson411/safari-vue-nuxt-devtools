import { functions } from '@vue/devtools-core'
import { createRpcClient } from '@vue/devtools-kit'
import { initDevTools } from '../client/devtools-panel'

const bridgeId = new URLSearchParams(location.search).get('bridge')
function injectBackend(cb: () => void) {
  const session = crypto.randomUUID()
  let attempts = 0
  function execute() {
    chrome.runtime.sendMessage({action:'safari:bootstrap',bridgeId,session}, reply => {
      const error = chrome.runtime.lastError?.message || reply?.error
      if (!error && Number.isSafeInteger(reply?.tabId) && reply.tabId >= 0) {
        ;(globalThis as any).__SAFARI_INSPECTED_TAB_ID__ = reply.tabId
        cb()
      } else if (++attempts < 30) setTimeout(execute, 1000)
      else {
        const status = document.createElement('p')
        status.textContent = `Vue Devtools could not connect: ${error || 'Waiting for inspected-page bridge'}. Grant site permission, reload and reopen the inspector.`
        document.body.appendChild(status)
      }
    })
  }
  execute()
}
injectBackend(() => {
  initDevTools()
  createRpcClient(functions, {preset:'extension'})
  setInterval(() => {
    if (document.visibilityState === 'hidden') return
    const status = () => { document.body.textContent = 'Page connection unavailable. Grant site permission in Safari, reload the page and reopen the inspector.' }
    const timeout = setTimeout(status, 2000)
    chrome.runtime.sendMessage({action:'safari:health',tabId:(globalThis as any).__SAFARI_INSPECTED_TAB_ID__}, reply => {
      clearTimeout(timeout)
      if (!reply?.ready) status()
    })
  }, 3000)
})
chrome.runtime.onMessage.addListener(request => {
  if (request.action === 'safari:navigating' && request.bridgeId === bridgeId) {
    document.body.textContent = 'Waiting for the new page. If site permission is denied, grant access in Safari, reload the page and reopen the inspector.'
  }
  if (request.action === 'safari:navigated' && request.bridgeId === bridgeId) location.reload()
})
