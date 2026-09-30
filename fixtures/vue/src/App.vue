<script setup>
import CounterCard from './CounterCard.vue'
</script>
<template><main><h1>Safari Vue acceptance</h1><p>Two apps, nested components, reactive state, Pinia, router and HMR.</p><CounterCard label="Primary counter"/><RouterLink to="/">Home</RouterLink> · <RouterLink to="/other">Other route</RouterLink><RouterView/></main></template>
<style>body{font:18px system-ui;margin:40px;background:#eef5f1;color:#173c2b}main{max-width:700px}button{padding:12px;font:inherit;margin:12px 0}</style>
