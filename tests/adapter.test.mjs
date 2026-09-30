import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
test('Safari panel is created without page evaluation or permission-dependent discovery',()=>{
 const source=readFileSync('adapter/devtools-background.ts','utf8').replace(': boolean','').replace(': Promise<string> | undefined','').replace(': number | undefined','').replace(': ReturnType<typeof setInterval> | undefined','').replace('export {}','')
 let created=0;const events={};let expression
 const chrome={runtime:{onMessage:{addListener(){}},sendMessage(){},getURL:p=>p},devtools:{network:{onNavigated:{addListener(){}}},panels:{create(title,icon,path,cb){created++;assert.equal(title,'Vue');assert.match(path,/^pages\/devtools-panel.html\?bridge=/);cb({onShown:{addListener(fn){events.show=fn}},onHidden:{addListener(fn){events.hide=fn}}})}},inspectedWindow:{eval(src){expression=src}}}}
 vm.runInNewContext(source,{setInterval:()=>0,clearInterval(){},chrome,crypto:{randomUUID:()=> 'test-session'}});assert.equal(created,1);assert.equal(expression,undefined)
 events.show();assert.match(expression,/chrome: true/);events.hide();assert.match(expression,/chrome: false/)
})
test('package pins a real upstream commit and preserves license',()=>{
 const build=readFileSync('scripts/build.mjs','utf8')
 assert.match(build,/4419695f100f43ed880995dabf0cd68651b365db/)
 assert.match(build,/permissions.push\('devtools'\)/)
 assert.match(readFileSync('docs/VUE-LICENSE','utf8'),/MIT/)
})
