import {test} from 'node:test'
import assert from 'node:assert/strict'
import {installPortRouter} from '../adapter/port-router.mjs'
function event(){const listeners=new Set();return {addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f),emit:arg=>[...listeners].forEach(f=>f(arg)),listeners}}
function port(name,tab=1,frameId=0){return {name,sender:{url:'http://127.0.0.1:5173/',tab:{id:tab},frameId},onMessage:event(),onDisconnect:event(),received:[],postMessage(data){this.received.push(data)},disconnect(){this.onDisconnect.emit()}}}
function setup(permissions={contains(_p,cb){cb(true)},onRemoved:event()}){const runtime={onConnect:event()};const injections=[];const tabs=installPortRouter(runtime,{executeScript(spec,cb){injections.push(spec);cb()}},permissions);return {connect:p=>runtime.onConnect.emit(p),tabs,injections}}
test('tab-scoped bidirectional RPC preserves payloads and queues early handshake',()=>{const s=setup();const a=port('1');const b=port('content-script');s.connect(a);a.onMessage.emit('init');s.connect(b);assert.deepEqual(b.received,['init']);b.onMessage.emit('state');assert.deepEqual(a.received,['state']);assert.equal(s.injections[0].target.tabId,1)})
test('multiple inspected tabs cannot cross-route',()=>{const s=setup();const a=port('1'),b=port('content-script'),c=port('2'),d=port('content-script',2);[a,b,c,d].forEach(s.connect);a.onMessage.emit('one');d.onMessage.emit('two');assert.deepEqual(b.received,['one']);assert.deepEqual(c.received,['two']);assert.deepEqual(a.received,[]);assert.deepEqual(d.received,[])})
test('reload closes old pair and reconnects a fresh page',()=>{const s=setup();const a=port('1'),b=port('content-script');[a,b].forEach(s.connect);b.disconnect();assert.equal(s.tabs.size,0);const c=port('1'),d=port('content-script');[c,d].forEach(s.connect);c.onMessage.emit('fresh');assert.deepEqual(d.received,['fresh']);assert.deepEqual(b.received,[])})
test('replaced port cannot tear down the new connection on delayed disconnect',()=>{const s=setup();const a=port('1'),b=port('content-script');[a,b].forEach(s.connect);const c=port('1');s.connect(c);a.disconnect();c.onMessage.emit('new');assert.deepEqual(b.received,['new']);assert.equal(s.tabs.size,1);assert.equal(a.onMessage.listeners.size,0)})
test('unrelated ports and subframes are rejected',()=>{const s=setup();s.connect(port('arbitrary'));s.connect(port('content-script',1,2));assert.equal(s.tabs.size,0);assert.equal(s.injections.length,0)})

test('each message rechecks origin permission and fails closed on revocation',()=>{
 let allowed=true;const checked=[];const removed=event()
 const s=setup({contains(p,cb){checked.push(p.origins[0]);cb(allowed)},onRemoved:removed})
 const a=port('1'),b=port('content-script');[a,b].forEach(s.connect)
 b.onMessage.emit('before');assert.deepEqual(a.received,['before'])
 allowed=false;b.onMessage.emit('secret-after-revoke')
 assert.deepEqual(a.received,['before']);assert.equal(s.tabs.size,0)
 assert.deepEqual(checked,['http://127.0.0.1/*','http://127.0.0.1/*'])
})
test('permission removal closes existing pairs and discards pending authorized replies',()=>{
 const callbacks=[];const removed=event();const s=setup({contains(_p,cb){callbacks.push(cb)},onRemoved:removed})
 const a=port('1'),b=port('content-script');[a,b].forEach(s.connect)
 b.onMessage.emit('in-flight');removed.emit({origins:['http://127.0.0.1/*']});callbacks[0](true)
 assert.equal(s.tabs.size,0);assert.deepEqual(a.received,[])
})
test('permission checks preserve message order and reject unavailable APIs',()=>{
 const callbacks=[];const s=setup({contains(_p,cb){callbacks.push(cb)},onRemoved:event()})
 const a=port('1'),b=port('content-script');[a,b].forEach(s.connect)
 b.onMessage.emit('one');b.onMessage.emit('two');assert.equal(callbacks.length,1)
 callbacks[0](true);assert.deepEqual(a.received,['one']);callbacks[1](true);assert.deepEqual(a.received,['one','two'])
 const denied=setup({});const c=port('2'),d=port('content-script',2);[c,d].forEach(denied.connect);d.onMessage.emit('blocked');assert.equal(denied.tabs.size,0);assert.deepEqual(c.received,[])
})
