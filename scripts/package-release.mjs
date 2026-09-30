import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {resolve} from 'node:path'
const {version}=JSON.parse(readFileSync('package.json'))
const extension=resolve('dist/extension')
if(!existsSync(`${extension}/manifest.json`)) throw new Error('Run npm run build first')
if(JSON.parse(readFileSync(`${extension}/manifest.json`)).version!==version) throw new Error('Version mismatch')
copyFileSync('LICENSE',`${extension}/ADAPTER_LICENSE`)
const artifact=resolve(`dist/safari-vue-nuxt-devtools-${version}.zip`)
// Stable packaging for identical built input; no claim of byte-identical builds.
execFileSync('python3',['-c',`
import pathlib, zipfile, sys
root=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2], 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
 for path in sorted(root.rglob('*')):
  if not path.is_file() or any(part.startswith('.') for part in path.relative_to(root).parts): continue
  info=zipfile.ZipInfo(path.relative_to(root).as_posix(), date_time=(1980,1,1,0,0,0))
  info.compress_type=zipfile.ZIP_DEFLATED
  info.external_attr=0o100644 << 16
  archive.writestr(info,path.read_bytes(),compresslevel=9)
`,extension,artifact],{stdio:'inherit'})
const filename=artifact.split('/').at(-1)
const sha=createHash('sha256').update(readFileSync(artifact)).digest('hex')
writeFileSync('dist/SHA256SUMS',`${sha}  ${filename}\n`)
console.log(`${filename}: ${readFileSync(artifact).length} bytes; SHA-256 ${sha}`)
