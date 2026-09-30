import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import vm from 'node:vm'
function event(){const listeners=new Set();return {addListener(fn){if(typeof fn!=='function')throw new TypeError('Safari requires a function');listeners.add(fn)},removeListener:fn=>listeners.delete(fn),emit:x=>[...listeners].forEach(fn=>fn(x))}}
test('Safari strict listener validation does not silently disconnect initial RPC channel',()=>{
 const source=stripTypeScriptTypes(readFileSync('adapter/rpc-client.ts','utf8'),{mode:'strip'}).replace(/^import .*\n/gm,'').replace('export function','function')
 const sent=[];let name
 const port={onMessage:event(),onDisconnect:event(),postMessage:x=>sent.push(x)}
 const context={chrome:{runtime:{connect(info){name=info.name;return port}},devtools:{inspectedWindow:{tabId:-1}}},SuperJSON:{stringify:JSON.stringify,parse:JSON.parse},setExtensionClientContext(){},setTimeout,clearTimeout,__SAFARI_INSPECTED_TAB_ID__:2172}
 vm.createContext(context);vm.runInContext(source,context)
 const channel=vm.runInContext('createExtensionClientChannel()',context)
 assert.equal(name,'2172');channel.post({method:'inspect'});assert.equal(sent.length,1)
 let received;channel.on(data=>received=data);port.onMessage.emit('{"state":4}');assert.equal(received.state,4)
})
