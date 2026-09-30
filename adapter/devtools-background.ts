// Safari requires unconditional panel creation. Keep all inspectedWindow APIs
// in the devtools_page: Safari 27 panel documents expose tabId=-1 and attempting
// eval from a panel triggers a WebKit invalid-IPC guard termination.
const bridgeId = crypto.randomUUID()
let backendSource: Promise<string> | undefined
let inspectedTabId: number | undefined
chrome.runtime.onMessage.addListener((request, sender, respond) => {
  if (request.action === 'safari:document-ready' && request.tabId === inspectedTabId && !sender.tab) {
    chrome.runtime.sendMessage({action:'safari:navigated',bridgeId})
    return
  }
  if (request.action !== 'safari:bootstrap' || request.bridgeId !== bridgeId || sender.tab) return
  backendSource ??= fetch(chrome.runtime.getURL('dist/user-app.js')).then(response => {
    if (!response.ok) throw new Error('Packaged backend unavailable')
    return response.text()
  })
  backendSource.then(source => {
    const code = `if (!window.__SAFARI_VUE_BACKEND__) { ${source}; window.__SAFARI_VUE_BACKEND__ = true };
      window.postMessage({key:'__SAFARI_VUE_SESSION__',session:${JSON.stringify(request.session)}}, '*'); 'ready'`
    chrome.devtools.inspectedWindow.eval(code, (_result, error) => {
      if (error) { respond({error:String(error.description || error.value || 'Site permission required')}); return }
      chrome.runtime.sendMessage({action:'safari:resolve-session',session:request.session}, reply => {
        const message = chrome.runtime.lastError?.message
        if (Number.isSafeInteger(reply?.tabId)) inspectedTabId = reply.tabId
        respond(message ? {error:message} : reply)
      })
    })
  }).catch(error => respond({error:String(error)}))
  return true
})
chrome.devtools.network.onNavigated.addListener(() => {
  chrome.runtime.sendMessage({action:'safari:navigating',bridgeId})
})
chrome.devtools.panels.create('Vue', 'icons/128.png', `pages/devtools-panel.html?bridge=${bridgeId}`, (panel) => {
  const update = (visible: boolean) => chrome.devtools.inspectedWindow.eval(
    `window.__VUE_DEVTOOLS_UPDATE_CLIENT_DETECTED__?.({ chrome: ${visible} })`,
  )
  panel.onShown.addListener(() => update(true))
  panel.onHidden.addListener(() => update(false))
})
export {}
