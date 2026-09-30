import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {readFileSync} from 'node:fs'
export default defineConfig({
  plugins:[vue(),{
    name:'acceptance-csp',
    configureServer(server){server.middlewares.use((req,res,next)=>{
      const path=req.url?.split('?')[0]
      if(/^\/assets\/[\w.-]+\.(js|css)$/.test(path)){
        res.setHeader('Content-Type',path.endsWith('.js')?'application/javascript':'text/css')
        res.end(readFileSync(new URL('./dist'+path,import.meta.url)))
        return
      }
      if(path !== '/csp') return next()
      res.setHeader('Content-Type','text/html')
      res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'")
      res.end(readFileSync(new URL('./dist/index.html',import.meta.url)))
    })}
  }],
  define:{__VUE_PROD_DEVTOOLS__:true}
})
