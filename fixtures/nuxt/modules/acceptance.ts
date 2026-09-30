import {defineNuxtModule} from '@nuxt/kit'
export default defineNuxtModule({meta:{name:'safari-acceptance-fixture',version:'1.0.0'},setup(_options,nuxt){nuxt.options.runtimeConfig.public.acceptance='Safari local fixture'}})
