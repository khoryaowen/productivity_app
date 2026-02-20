<template>
  <button
    class="toggle-btn"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
    aria-label="Toggle dark mode"
  >
    <span class="icon">{{ isDark ? '☀️' : '🌙' }}</span>
  </button>
</template>

<script setup>
import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'theme_preference'

const isDark = ref(
  localStorage.getItem(STORAGE_KEY)
    ? localStorage.getItem(STORAGE_KEY) === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
)

// Apply theme on mount & change
watchEffect(() => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
})

function toggle() {
  isDark.value = !isDark.value
}
</script>

<style scoped>
.toggle-btn {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 999;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  cursor: pointer;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background 0.3s;
}
.toggle-btn:hover { transform: scale(1.1); }
.icon { font-size: 20px; line-height: 1; }
</style>
