import {readFileSync,writeFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
execFileSync('xcrun',['safari-web-extension-converter',resolve('dist/extension'),'--project-location',resolve('dist/macos'),'--app-name','Vue Nuxt Devtools','--bundle-identifier','dev.jwilson411.safari-vue-nuxt-devtools','--macos-only','--swift','--copy-resources','--no-open','--no-prompt','--force'],{stdio:'inherit'})

const project=resolve('dist/macos/Vue Nuxt Devtools/Vue Nuxt Devtools.xcodeproj/project.pbxproj')
writeFileSync(project,readFileSync(project,'utf8').replaceAll('dev.jwilson411.Vue-Nuxt-Devtools','dev.jwilson411.safari-vue-nuxt-devtools'))
