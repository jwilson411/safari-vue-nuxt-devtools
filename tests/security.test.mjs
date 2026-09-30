import {test} from 'node:test'
import assert from 'node:assert/strict'
import {isPageMessage, detectionMessage} from '../adapter/message-guard.mjs'
import {installControlRouter} from '../adapter/control-router.mjs'
import {permissionMatches,withHostAccess} from '../adapter/host-access.mjs'
import {installPortRouter} from '../adapter/port-router.mjs'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import vm from 'node:vm'

const page={location:{protocol:'http:',origin:'http://127.0.0.1:5173'}}
const message=(source='server->proxy')=>({source:page,origin:page.location.origin,data:{source,payload:'{"json":{"event":"init"}}'}})
test('both RPC directions reject cross-origin and same-origin child frames, opaque origins and malformed protocol',()=>{
  for(const source of ['server->proxy','proxy->server']) {
    const valid=message(source)
    assert.equal(isPageMessage(valid,page,source),true)
    for(const bad of [{...valid,source:{}},{...valid,source:{},origin:'http://localhost:3000'},
      {...valid,origin:'null'},{...valid,origin:'http://localhost:3000'},
      {...valid,data:null},{...valid,data:{source,payload:{event:'init'}}},
      {...valid,data:{source:'other',payload:'{}'}}]) assert.equal(isPageMessage(bad,page,source),false)
    assert.equal(isPageMessage(valid,{...page,location:{protocol:'file:',origin:'null'}},source),false)
  }
})
test('detector projects only booleans, never lifecycle actions or arbitrary page data',()=>{
  const attack={source:page,origin:page.location.origin,data:{key:'__VUE_DEVTOOLS_VUE_DETECTED_EVENT__',data:{vueDetected:true,nuxtDetected:false,action:'safari:content-ready',session:'evil',tabId:123,devtoolsEnabled:'yes'}}}
  assert.deepEqual(detectionMessage(attack,page),{vueDetected:true,nuxtDetected:false})
  assert.equal(detectionMessage({...attack,source:{}},page),null)
  assert.equal(detectionMessage({...attack,origin:'null'},page),null)
})
const event=()=>{const listeners=new Set();return {addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f),emit:x=>[...listeners].forEach(f=>f(x))}}
test('revocation invalidates pending lifecycle permission replies without canceling unrelated hosts',()=>{
  const callbacks=[],removed=event(),sent=[]
  const runtime={id:'extension',onMessage:{addListener(fn){this.listener=fn}},sendMessage:x=>sent.push(x)}
  const permissions={onRemoved:removed,contains(_p,cb){callbacks.push(cb)}}
  installControlRouter(runtime,permissions,new Map())
  const sender={tab:{id:1},frameId:0,url:page.location.origin}
  runtime.onMessage.listener({action:'safari:content-ready'},sender,()=>{})
  runtime.onMessage.listener({action:'safari:bind-session',session:'revoked-session'},sender,()=>{})
  let unrelated=0
  withHostAccess(runtime,permissions,{...sender,url:'https://localhost:3000'},()=>unrelated++)
  removed.emit({origins:['http://127.0.0.1/*']})
  callbacks.splice(0).forEach(cb=>cb(true))
  assert.deepEqual(sent,[]);assert.equal(unrelated,1)
  let response
  runtime.onMessage.listener({action:'safari:resolve-session',session:'revoked-session'},{id:'extension'},x=>response=x)
  assert.equal(response.tabId,undefined)
})
test('actual adapted proxy and server channel listeners reject adversarial frames while preserving legitimate RPC',()=>{
  for (const role of ['proxy','server']) {
    const listeners=[],forwarded=[],posted=[]
    const window={location:page.location,addEventListener(_e,fn){listeners.push(fn)},removeEventListener(){},postMessage(...args){posted.push(args)}}
    const port={onMessage:event(),onDisconnect:event(),postMessage:x=>forwarded.push(x)}
    let source=stripTypeScriptTypes(readFileSync(`adapter/rpc-${role}.ts`,'utf8')).replace(/^import .*$/gm,'').replace('export function','function')
    source+=role==='proxy'?'\ncreateExtensionProxyChannel()':'\ncreateExtensionServerChannel().on(data => forwarded.push(data))'
    vm.runInNewContext(source,{window,chrome:{runtime:{connect:()=>port}},isPageMessage,SuperJSON:JSON,forwarded,__DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__:{PROXY_TO_SERVER:'proxy->server',SERVER_TO_PROXY:'server->proxy'}})
    const direction=role==='proxy'?'server->proxy':'proxy->server'
    const valid={source:window,origin:window.location.origin,data:{source:direction,payload:'{"event":"safe"}'}}
    const handler=listeners[0]
    handler({...valid,source:{},origin:'http://127.0.0.1:3000'})
    handler({...valid,source:{}})
    handler({...valid,data:null})
    assert.equal(forwarded.length,0)
    handler(valid);assert.equal(forwarded.length,1)
    if(role==='proxy') assert.equal(posted[0][1],window.location.origin)
    else {handler({...valid,data:{source:direction,payload:'not-json'}});assert.equal(forwarded.length,1)}
  }
})
test('trusted lifecycle and session controls require main-frame host permission even after revocation',()=>{
  let listener,allowed=true;const sent=[],callbacks=[]
  const runtime={id:'extension',onMessage:{addListener:f=>listener=f},sendMessage:x=>sent.push(x)}
  const permissions={contains(_p,cb){callbacks.push(()=>cb(allowed))}}
  installControlRouter(runtime,permissions,new Map())
  const sender={id:'extension',tab:{id:1},frameId:0,url:page.location.origin}
  listener({action:'safari:content-ready'},sender,()=>{});callbacks.shift()()
  assert.equal(sent.length,1)
  allowed=false;listener({action:'safari:content-ready'},sender,()=>{});callbacks.shift()()
  assert.equal(sent.length,1)
  listener({action:'safari:content-ready'},{...sender,frameId:1},()=>{})
  assert.equal(callbacks.length,0)
  let response
  listener({action:'safari:health',tabId:1},{id:'other'},x=>response=x)
  assert.equal(response,undefined)
})
test('permission teardown only closes matching hosts and protocols, leaving unrelated allowed tabs live',()=>{
  const runtime={onConnect:event()},removed=event()
  const permissions={contains(_p,cb){cb(true)},onRemoved:removed}
  const tabs=installPortRouter(runtime,{executeScript(_s,cb){cb()}},permissions)
  const port=(name,id,url)=>({name,sender:{tab:{id},url,frameId:0},onMessage:event(),onDisconnect:event(),received:[],postMessage(x){this.received.push(x)},disconnect(){this.onDisconnect.emit()}})
  const a=port('1',1,page.location.origin),b=port('content-script',1,page.location.origin)
  const c=port('2',2,'https://localhost:3000'),d=port('content-script',2,'https://localhost:3000')
  for(const p of [a,b,c,d])runtime.onConnect.emit(p)
  removed.emit({origins:['http://127.0.0.1/*']})
  assert.equal(tabs.has(1),false);assert.equal(tabs.has(2),true)
  d.onMessage.emit('still-live');assert.deepEqual(c.received,['still-live'])
  removed.emit({permissions:['clipboardRead']});assert.equal(tabs.has(2),true)
  assert.equal(permissionMatches('*://*.example.com/*','https://sub.example.com/*'),true)
  assert.equal(permissionMatches('http://localhost/*','https://localhost/*'),false)
  removed.emit({origins:['<all_urls>']});assert.equal(tabs.size,0)
})
