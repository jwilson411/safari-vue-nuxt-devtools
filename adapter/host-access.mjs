export function senderOrigin(sender) {
  if (!sender.tab || (sender.frameId ?? 0) !== 0) return null
  try {
    const url = new URL(sender.url || sender.tab.url)
    return ['http:', 'https:'].includes(url.protocol) ? `${url.protocol}//${url.hostname}/*` : null
  } catch { return null }
}

const permissionChecks = new WeakMap()
export function withHostAccess(runtime, permissions, sender, callback) {
  const origin = senderOrigin(sender)
  if (!origin || !permissions?.contains) return
  let state=permissionChecks.get(permissions)
  if (!state) {
    state={generation:0,pending:new Set()}
    permissionChecks.set(permissions,state)
    permissions.onRemoved?.addListener(removed => {
      state.generation++
      for (const check of state.pending) {
        if (removed.origins?.some(pattern => permissionMatches(pattern,check.origin))) {
          check.generation=state.generation
        }
      }
    })
  }
  const generation=state.generation
  const check={origin,generation}
  state.pending.add(check)
  try {
    permissions.contains({ origins: [origin] }, allowed => {
      state.pending.delete(check)
      if (check.generation===generation && !runtime.lastError && allowed === true) callback()
    })
  } catch { state.pending.delete(check) /* Unsupported APIs fail closed. */ }
}

export function permissionMatches(pattern, origin) {
  if (pattern === '<all_urls>') return true
  const match = /^(\*|https?):\/\/([^/]+)\//.exec(pattern || '')
  if (!match) return false
  const url = new URL(origin)
  const host = match[2]
  return (match[1] === '*' || `${match[1]}:` === url.protocol)
    && (host === '*' || host === url.hostname || (host.startsWith('*.')
      && (url.hostname === host.slice(2) || url.hostname.endsWith(host.slice(1)))))
}
