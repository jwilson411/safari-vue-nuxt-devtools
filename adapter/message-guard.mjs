// Only this top-level document may speak the upstream window-message protocol.
// A same-origin child frame is also rejected: its WindowProxy is not this window.
export function isPageMessage(event, page, source) {
  return ['http:', 'https:'].includes(page.location.protocol)
    && event.source === page
    && event.origin === page.location.origin
    && event.data !== null && typeof event.data === 'object'
    && event.data.source === source
    && typeof event.data.payload === 'string'
    && event.data.payload.length <= 16 * 1024 * 1024
}

export function detectionMessage(event, page) {
  if (event.source !== page || event.origin !== page.location.origin
    || !['http:', 'https:'].includes(page.location.protocol)
    || event.data?.key !== '__VUE_DEVTOOLS_VUE_DETECTED_EVENT__'
    || !event.data.data || typeof event.data.data !== 'object') return null
  const result = {}
  for (const flag of ['devtoolsEnabled', 'vueDetected', 'vue2Detected', 'nuxtDetected', 'vitePressDetected', 'vitePluginDetected']) {
    if (typeof event.data.data[flag] === 'boolean') result[flag] = event.data.data[flag]
  }
  return result
}
