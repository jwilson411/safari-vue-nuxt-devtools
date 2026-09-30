import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {writeNotices} from '../scripts/licenses.mjs'

test('notice collector preserves hyphenated MIT license and NOTICE variants',()=>{
  const root=mkdtempSync(join(tmpdir(),'safari-notices-'))
  try {
    const pkg=join(root,'node_modules/.pnpm/example/node_modules/example')
    mkdirSync(pkg,{recursive:true})
    writeFileSync(join(pkg,'package.json'),JSON.stringify({name:'example',version:'1',license:'MIT'}))
    for(const file of ['LICENSE-MIT','LICENSE-MIT.txt','license_mit','NOTICE.txt']) writeFileSync(join(pkg,file),`${file} required copyright text`)
    const out=join(root,'notices.txt');writeNotices(root,out)
    const text=readFileSync(out,'utf8')
    for(const file of ['LICENSE-MIT','LICENSE-MIT.txt','license_mit','NOTICE.txt']) assert.ok(text.includes(`${file} required copyright text`))
  } finally {rmSync(root,{recursive:true,force:true})}
})
