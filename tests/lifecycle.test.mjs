import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import vm from 'node:vm'

test('devtools-page owns eval and routes navigation only to its inspected tab', async()=>{
  let listener, evalCode, response, onNavigation, tick, shown, hidden, ready=true, cleared=0
  const messages=[]
  const chrome={runtime:{onMessage:{addListener(fn){listener=fn}},getURL:p=>p,sendMessage(request,cb){
    messages.push(request)
    if(request.action==='safari:resolve-session') cb({tabId:42})
  }},devtools:{network:{onNavigated:{addListener(fn){onNavigation=fn}}},inspectedWindow:{eval(code,cb){evalCode=code;if(cb)cb(code.includes('=== true')?ready:'ready')}},panels:{create(_t,_i,_p,cb){cb({onShown:{addListener(fn){shown=fn}},onHidden:{addListener(fn){hidden=fn}}})}}}}
  const source=stripTypeScriptTypes(readFileSync('adapter/devtools-background.ts','utf8')).replace(/export \{\};?/g,'')
  vm.runInNewContext(source,{setInterval:fn=>{tick=fn;return 1},clearInterval(){cleared++},chrome,crypto:{randomUUID:()=> 'bridge-a'},fetch:async()=>({ok:true,text:async()=> 'window.backendLoaded=true'}),JSON,Number,Promise})
  assert.equal(listener({action:'safari:bootstrap',bridgeId:'other'}, {},()=>{}),undefined)
  assert.equal(listener({action:'safari:bootstrap',bridgeId:'bridge-a'}, {tab:{id:42}},()=>{}),undefined)
  assert.equal(listener({action:'safari:bootstrap',bridgeId:'bridge-a',session:'nonce'}, {},r=>response=r),true)
  await new Promise(resolve=>setImmediate(resolve))
  assert.equal(response.tabId,42)
  assert.match(evalCode,/window.backendLoaded=true/)
  assert.match(evalCode,/__SAFARI_VUE_SESSION__/)
  listener({action:'safari:document-ready',tabId:43},{},()=>{})
  listener({action:'safari:document-ready',tabId:42},{tab:{id:42}},()=>{})
  assert.equal(messages.filter(m=>m.action==='safari:navigated').length,0)
  listener({action:'safari:document-ready',tabId:42},{},()=>{})
  assert.equal(messages.at(-1).action,'safari:navigated')
  assert.equal(messages.at(-1).bridgeId,'bridge-a')
  onNavigation('http://127.0.0.1:5173/other')
  assert.equal(messages.at(-1).action,'safari:navigating')

})

test('panel reload starts a fresh client only for its own bridge',()=>{
  let listener,reloaded=0
  let source=stripTypeScriptTypes(readFileSync('adapter/devtools-panel.ts','utf8'))
  source=source.replace(/^import .*$/gm,'').replace(/export \{\};?/g,'')
  vm.runInNewContext(source,{chrome:{runtime:{onMessage:{addListener(fn){listener=fn}},sendMessage(){}}},location:{search:'?bridge=one',reload(){reloaded++}},URLSearchParams,crypto:{randomUUID:()=> 'session'}})
  listener({action:'safari:navigated',bridgeId:'two'})
  assert.equal(reloaded,0)
  listener({action:'safari:navigated',bridgeId:'one'})
  assert.equal(reloaded,1)
})
