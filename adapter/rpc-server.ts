import { isPageMessage } from './message-guard.mjs'
import { SuperJSON } from 'superjson'
import { MergeableChannelOptions } from '../../types'
import { __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__ } from './context'

export function createExtensionServerChannel(): MergeableChannelOptions {
  return {
    post: (data) => {
      window.postMessage({
        source: __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__.SERVER_TO_PROXY,
        payload: SuperJSON.stringify(data),
      }, window.location.origin)
    },
    on: (handler) => {
      const listener = (event: MessageEvent) => {
        if (isPageMessage(event, window, __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__.PROXY_TO_SERVER)) {
          try { handler(SuperJSON.parse(event.data.payload)) } catch { /* Malformed page protocol. */ }
        }
      }
      window.addEventListener('message', listener)
      return () => {
        window.removeEventListener('message', listener)
      }
    },
  }
}
