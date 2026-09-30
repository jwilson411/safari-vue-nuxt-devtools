<script setup>
const count=useState('counter',()=>0)
const {data}=await useFetch('/api/hello')
</script>
<template><main><h1>Safari Nuxt acceptance</h1><p>Use Nuxt's embedded DevTools for routes, modules, configuration and payload.</p><button @click="count++">Nuxt count: {{count}}</button><p>{{data}}</p><NuxtLink to="/other">Other page</NuxtLink></main></template>
