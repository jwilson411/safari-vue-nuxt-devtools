import {createApp, h} from 'vue'
import {createPinia} from 'pinia'
import {createRouter,createWebHistory} from 'vue-router'
import App from './App.vue'
import IndependentApp from './IndependentApp.vue'
const router=createRouter({history:createWebHistory(),routes:[{path:'/',component:{name:'HomePage',render:()=>h('p','Home route')}},{path:'/other',component:{name:'OtherPage',render:()=>h('p','Other route')}}]})
createApp(App).use(createPinia()).use(router).mount('#app')
createApp(IndependentApp).mount('#second')
