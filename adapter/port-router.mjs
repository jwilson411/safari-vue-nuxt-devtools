// Preserve the upstream protocol, with tab isolation and fail-closed host access.
import { permissionMatches } from './host-access.mjs'
export function installPortRouter(runtime, scripting, permissions) {
  const tabs = new Map()
  const stop = tab => {
    if (tabs.get(tab.id) !== tab) return
    tabs.delete(tab.id)
    tab.pending.length = 0
    for (const role of ['devtools','userApp']) {
      const endpoint=tab[role]
      if(endpoint){endpoint.detach();delete tab[role];endpoint.port.disconnect()}
    }
  }
  permissions?.onRemoved?.addListener(removed => {
    // Revocation can leave Safari's existing content ports alive. Close them ourselves.
    for (const tab of [...tabs.values()]) {
      if (tab.origin && removed.origins?.some(pattern => permissionMatches(pattern, tab.origin))) stop(tab)
    }
  })
  runtime.onConnect.addListener(port => {
    const panel = /^\d+$/.test(port.name)
    const tabId = panel ? Number(port.name) : port.sender?.tab?.id
    if (!Number.isSafeInteger(tabId) || (!panel && (port.name !== 'content-script' || (port.sender?.frameId ?? 0) !== 0))) return
    const role = panel ? 'devtools' : 'userApp'
    const peerRole = panel ? 'userApp' : 'devtools'
    let tab = tabs.get(tabId)
    if (!tab) { tab = {id:tabId,pending:[],checking:false}; tabs.set(tabId, tab) }
    if(!panel){
      try {
        const url=new URL(port.sender.url || port.sender.tab.url)
        if(!['http:','https:'].includes(url.protocol)) throw new Error('Unsupported inspected origin')
        tab.origin=`${url.protocol}//${url.hostname}/*`
      } catch {stop(tab);port.disconnect();return}
    }
    const previous = tab[role]
    if (previous) { previous.detach(); previous.port.disconnect() }
    const endpoint = {port,queue:[],detach:null}
    const pump = () => {
      if(tab.checking || !tab.pending.length || tabs.get(tabId)!==tab) return
      if(!tab.origin || !permissions?.contains){stop(tab);return}
      const job=tab.pending.shift()
      tab.checking=true
      try {
        permissions.contains({origins:[tab.origin]}, allowed => {
          tab.checking=false
          if(tabs.get(tabId)!==tab) return
          if(runtime.lastError || allowed!==true){stop(tab);return}
          if(tab[job.role]===job.from && tab[job.peerRole]===job.to){
            try{job.to.port.postMessage(job.data)}catch{stop(tab);return}
          }
          pump()
        })
      } catch {tab.checking=false;stop(tab)}
    }
    const submit = (data,from,fromRole,toRole) => {
      const to=tab[toRole]
      if(!to || tab[fromRole]!==from) return
      if(tab.pending.length>=512){stop(tab);return}
      tab.pending.push({data,from,to,role:fromRole,peerRole:toRole})
      pump()
    }
    const message = data => {
      if(tab[role]!==endpoint) return
      if(tab[peerRole]) submit(data,endpoint,role,peerRole)
      else {
        if(endpoint.queue.length>=32) endpoint.queue.shift()
        endpoint.queue.push(data)
      }
    }
    const close = () => {if(tab[role]===endpoint) stop(tab)}
    endpoint.detach=()=>{port.onMessage.removeListener(message);port.onDisconnect.removeListener(close)}
    tab[role]=endpoint
    port.onMessage.addListener(message)
    port.onDisconnect.addListener(close)
    const peer=tab[peerRole]
    if(peer){
      for(const data of peer.queue.splice(0)) submit(data,peer,peerRole,role)
      for(const data of endpoint.queue.splice(0)) submit(data,endpoint,role,peerRole)
    }
    if(panel) scripting.executeScript({target:{tabId},files:['dist/proxy.js']},()=>{
      if(runtime.lastError) console.warn('Vue Devtools: site permission required',runtime.lastError.message)
    })
  })
  return tabs
}
