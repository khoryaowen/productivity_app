<template>
  <div class="page home-page">
    <header class="home-header text-center">
      <div class="logo">📚</div>
      <h1>Study Tracker</h1>
      <p class="text-muted mt-8">Track your focus sessions and build better study habits.</p>
    </header>

    <div class="cards-grid mt-32">
      <RouterLink v-for="card in cards" :key="card.to" :to="card.to" class="feature-card">
        <div class="card-icon">{{ card.icon }}</div>
        <h2>{{ card.title }}</h2>
        <p class="text-muted mt-8">{{ card.description }}</p>
        <span class="card-cta">Get started →</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const cards = [
  {
    to: '/timer',
    icon: '⏱️',
    title: 'Normal Timer',
    description: 'Start studying. Pause to log a break. Resume and end to save your session.',
  },
  {
    to: '/pomodoro',
    icon: '🍅',
    title: 'Pomodoro Timer',
    description: 'Configure study + break intervals and repeat until your session is done.',
  },
  {
    to: '/analytics',
    icon: '📊',
    title: 'Analytics',
    description: 'Visualise your study intensity, daily heatmap, and session averages.',
  },
]
</script>

<style scoped>
.home-page { display: flex; flex-direction: column; align-items: center; }

.logo { font-size: 64px; line-height: 1; margin-bottom: 12px; }

.home-header { max-width: 480px; }

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  width: 100%;
}

.feature-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px 24px;
  text-decoration: none;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  box-shadow: var(--shadow);
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  border-color: var(--accent);
}
[data-theme='dark'] .feature-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.5); }

.card-icon { font-size: 36px; margin-bottom: 8px; }

.card-cta {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}
</style>
