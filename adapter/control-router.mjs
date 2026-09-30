import { withHostAccess } from './host-access.mjs'

export function installControlRouter(runtime, permissions, tabs) {
  const sessions = new Map()
  runtime.onMessage.addListener((request, sender, respond) => {
    if (!request || typeof request !== 'object') return
    if (!sender.tab) {
      if (sender.id !== runtime.id) return
      if (request.action === 'safari:health') respond({ ready: !!tabs.get(request.tabId)?.userApp })
      if (request.action === 'safari:resolve-session') respond({ tabId: sessions.get(request.session) })
      return
    }
    // The only page-facing controls come from the isolated overlay. Detector
    // page data is separately projected to booleans and cannot name an action.
    if (request.action !== 'safari:content-ready' && request.action !== 'safari:bind-session') return
    withHostAccess(runtime, permissions, sender, () => {
      if (request.action === 'safari:content-ready') {
        runtime.sendMessage({ action: 'safari:document-ready', tabId: sender.tab.id })
      } else if (typeof request.session === 'string' && /^[a-zA-Z0-9-]{1,128}$/.test(request.session)) {
        sessions.set(request.session, sender.tab.id)
        setTimeout(() => sessions.delete(request.session), 60000)
      }
    })
  })
  return sessions
}
