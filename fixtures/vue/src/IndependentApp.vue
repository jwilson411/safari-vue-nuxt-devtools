<script setup>
import {ref} from 'vue'
const value=ref(10)
</script>
<template><button @click="value++">Independent app: {{value}}</button></template>
