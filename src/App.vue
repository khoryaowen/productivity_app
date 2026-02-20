<template>
  <DarkModeToggle />
  <RouterView />
</template>

<script setup>
import DarkModeToggle from './components/DarkModeToggle.vue'
import { RouterView } from 'vue-router'
</script>
