<script setup>
import {ref,computed} from 'vue'
import {useCounter} from './store.js'
defineProps({label:String})
const local=ref(0)
const doubled=computed(()=>local.value*2)
const store=useCounter()
</script>
<template><section><h2>{{label}}</h2><button @click="local++">Local count: {{local}}</button><p>Doubled: {{doubled}}</p><button @click="store.increment()">Pinia count: {{store.count}}</button></section></template>
