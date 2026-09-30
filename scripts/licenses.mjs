import {readdirSync,readFileSync,existsSync,writeFileSync} from 'node:fs'
import {resolve,join} from 'node:path'
export function writeNotices(root,output){
 const entries=new Map()
 function collect(directory){
  if(!existsSync(join(directory,'package.json')))return
  let pkg;try{pkg=JSON.parse(readFileSync(join(directory,'package.json'),'utf8'))}catch{return}
  const key=`${pkg.name}@${pkg.version}`
  if(entries.has(key))return
  const texts=readdirSync(directory).filter(f=>/^(licen[cs]e|copying|notice)([._-]|$)/i.test(f)).map(file=>{
   try{return `${file}\n${readFileSync(join(directory,file),'utf8')}`}catch{return ''}
  })
  entries.set(key,`${key}\nLicense: ${typeof pkg.license==='string'?pkg.license:JSON.stringify(pkg.license)}\n${texts.join('\n')}`)
 }
 const store=resolve(root,'node_modules/.pnpm')
 for(const item of readdirSync(store)){
  const nm=join(store,item,'node_modules');if(!existsSync(nm))continue
  for(const dependency of readdirSync(nm)){
   if(dependency.startsWith('@')){for(const child of readdirSync(join(nm,dependency)))collect(join(nm,dependency,child))}
   else collect(join(nm,dependency))
  }
 }
 writeFileSync(output,'Third-party dependency notices from the pinned upstream build environment. Includes build-only dependencies as well as bundled runtime code.\n\n'+[...entries].sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v).join('\n\n---\n\n'))
}
