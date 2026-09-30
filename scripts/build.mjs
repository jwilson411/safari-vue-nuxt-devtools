import {writeNotices} from './licenses.mjs'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
const pin = '4419695f100f43ed880995dabf0cd68651b365db'
const root = resolve('.upstream/vue-devtools')
function run(cmd,args,cwd=root){execFileSync(cmd,args,{cwd,stdio:'inherit',env:{...process.env,TURBO_TELEMETRY_DISABLED:'1'}})}
if(!existsSync(root)){mkdirSync(resolve('.upstream'),{recursive:true});run('git',['clone','--depth','1','--branch','v8.2.1','https://github.com/vuejs/devtools.git',root],process.cwd())}
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()
if(head!==pin)throw new Error(`Upstream mismatch: ${head}`)
run('git',['reset','--hard',pin])
cpSync('adapter/devtools-background.ts',`${root}/packages/chrome-extension/src/devtools-background.ts`)
cpSync('adapter/port-router.mjs',`${root}/packages/chrome-extension/src/port-router.mjs`)
const bgPath=`${root}/packages/chrome-extension/src/background.ts`
const originalBg=readFileSync(bgPath,'utf8')
const detectionBody=originalBg.slice(originalBg.indexOf('chrome.runtime.onMessage')).replace(/^chrome.runtime.onMessage.addListener\(\(req, sender\) => \{/, '').replace(/\}\)\s*$/, '')
for (const file of ['host-access.mjs','control-router.mjs','message-guard.mjs']) cpSync(`adapter/${file}`,`${root}/packages/chrome-extension/src/${file}`)
writeFileSync(bgPath,`import { installPortRouter } from './port-router.mjs'
import { withHostAccess } from './host-access.mjs'
import { installControlRouter } from './control-router.mjs'
const tabConnections = installPortRouter(chrome.runtime, chrome.scripting, chrome.permissions)
installControlRouter(chrome.runtime, chrome.permissions, tabConnections)
chrome.runtime.onMessage.addListener((req, sender) => withHostAccess(chrome.runtime, chrome.permissions, sender, () => {${detectionBody}}))
`)
cpSync('adapter/devtools-panel.ts',`${root}/packages/chrome-extension/src/devtools-panel.ts`)
const configPath=`${root}/packages/chrome-extension/tsdown.config.ts`
let config=readFileSync(configPath,'utf8').replace("'!src/proxy.ts',", "'!src/proxy.ts',\n    '!src/user-app.ts',\n    '!src/detector.ts',")
config=config.replace("createIIFEConfig('src/proxy.ts')", "createIIFEConfig('src/detector.ts'), createIIFEConfig('src/user-app.ts'), createIIFEConfig('src/proxy.ts')")
writeFileSync(configPath,config)
const channelPath=`${root}/packages/devtools-kit/src/messaging/presets/extension/client.ts`
cpSync('adapter/rpc-client.ts',channelPath)
// The detector is an authorized MAIN content script, not a CSP-blocked DOM script tag.
const overlayPath=`${root}/packages/chrome-extension/src/devtools-overlay.ts`
cpSync('adapter/devtools-overlay.ts',overlayPath)
const messaging=`${root}/packages/devtools-kit/src/messaging/presets/extension`
cpSync('adapter/message-guard.mjs',`${messaging}/message-guard.mjs`)
cpSync('adapter/rpc-proxy.ts',`${messaging}/proxy.ts`)
cpSync('adapter/rpc-server.ts',`${messaging}/server.ts`)
const userAppPath=`${root}/packages/chrome-extension/src/user-app.ts`
writeFileSync(userAppPath,readFileSync(userAppPath,'utf8').replace("if (e.data.source === 'proxy->server' && e.data.payload.event === 'init')", "if (e.source === window && e.origin === location.origin && e.data?.source === 'proxy->server' && typeof e.data.payload === 'string' && e.data.payload.includes('init'))"))
run('pnpm',['install','--frozen-lockfile'])
run('pnpm',['build:chrome-extension'])
const extension=resolve('dist/extension')
// This is generated output: remove stale hashed chunks from earlier builds.
rmSync(extension,{recursive:true,force:true})
mkdirSync(extension,{recursive:true})
for(const path of ['dist','client','pages','icons','popups'])cpSync(`${root}/packages/chrome-extension/${path}`,`${extension}/${path}`,{recursive:true})
const manifest=JSON.parse(readFileSync(`${root}/packages/chrome-extension/manifest.json`))
manifest.name='Vue & Nuxt Devtools for Safari'
manifest.description='Safari adapter of Vue Devtools 8.2.1; Nuxt uses its original server-backed DevTools.'
manifest.permissions.push('devtools')
manifest.content_scripts.push({js:['dist/detector.js'],matches:['<all_urls>'],run_at:'document_idle',world:'MAIN'})
manifest.version='0.1.0'
delete manifest.version_name
// Only user-approved sites receive content scripts; Safari owns permission prompts.
writeFileSync(`${extension}/manifest.json`,JSON.stringify(manifest,null,2)+'\n')
cpSync('docs/VUE-LICENSE',`${extension}/LICENSE`)
writeNotices(root,`${extension}/THIRD_PARTY_NOTICES.txt`)
console.log('Built '+extension)
