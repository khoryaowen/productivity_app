<template>
  <div class="page">
    <RouterLink to="/" class="back-link">← Home</RouterLink>

    <h1 class="mt-16">📊 Analytics</h1>

    <!-- No data state -->
    <div v-if="!store.sessions.length" class="card mt-24 text-center">
      <p style="font-size:48px">📭</p>
      <h2 class="mt-16">No sessions yet</h2>
      <p class="text-muted mt-8">Complete a study session to see your analytics here.</p>
    </div>

    <template v-else>
      <!-- ── Stat cards ── -->
      <div class="stats-grid mt-24">
        <div class="stat-card card">
          <div class="stat-icon">📚</div>
          <div class="stat-value">{{ store.sessions.length }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ formatSeconds(store.avgStudyDuration) }}</div>
          <div class="stat-label">Avg Study Duration</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">☕</div>
          <div class="stat-value">{{ formatSeconds(store.avgBreakDuration) }}</div>
          <div class="stat-label">Avg Break Duration</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">🍅</div>
          <div class="stat-value">{{ totalPomodoros }}</div>
          <div class="stat-label">Total Pomodoros</div>
        </div>
      </div>

      <!-- ── Line graph: daily study time (last 30 days) ── -->
      <div class="card mt-24">
        <h2>Study Intensity – Last 30 Days</h2>
        <p class="text-muted mt-8">Daily study time in minutes.</p>
        <div class="chart-wrapper mt-16">
          <Line :data="lineChartData" :options="lineChartOptions" />
        </div>
      </div>

      <!-- ── Heatmap ── -->
      <div class="card mt-24">
        <h2>Activity Heatmap – Last Year</h2>
        <p class="text-muted mt-8">Each cell = one day. Darker = more study time.</p>
        <div class="heatmap-scroll mt-16">
          <div class="heatmap">
            <div
              v-for="week in heatmapWeeks"
              :key="week[0]?.date"
              class="heatmap-col"
            >
              <div
                v-for="cell in week"
                :key="cell.date"
                class="heatmap-cell"
                :class="intensityClass(cell.seconds)"
                :title="`${cell.date}: ${formatSeconds(cell.seconds)}`"
              />
            </div>
          </div>
          <!-- Legend -->
          <div class="heatmap-legend mt-8">
            <span class="text-muted">Less</span>
            <div class="intensity-0 heatmap-cell" />
            <div class="intensity-1 heatmap-cell" />
            <div class="intensity-2 heatmap-cell" />
            <div class="intensity-3 heatmap-cell" />
            <div class="intensity-4 heatmap-cell" />
            <span class="text-muted">More</span>
          </div>
        </div>
      </div>

      <!-- Clear data -->
      <div class="mt-24 text-center">
        <button class="btn btn-outline" @click="confirmClear">🗑 Clear All Data</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { useSessionsStore } from '../stores/session'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const store = useSessionsStore()

// ── Helpers ───────────────────────────────────────
function formatSeconds(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}h ${m}m`
    : m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function isoDate(d) { return d.toISOString().split('T')[0] }

// ── Stats ─────────────────────────────────────────
const totalPomodoros = computed(() =>
  store.sessions.reduce((s, x) => s + (x.completedPomodoros || 0), 0)
)

// ── Line chart: last 30 days ──────────────────────
const lineChartData = computed(() => {
  const days = store.getDailyStudy(30)
  return {
    labels: days.map(d => {
      const [, m, day] = d.date.split('-')
      return `${m}/${day}`
    }),
    datasets: [{
      label: 'Study (min)',
      data: days.map(d => Math.round(d.seconds / 60)),
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79,70,229,0.12)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { min: 0, ticks: { stepSize: 30 } },
  },
}

// ── Heatmap: last 52 weeks ────────────────────────
const heatmapWeeks = computed(() => {
  const weeks = []
  const today = new Date()
  // Find last Sunday
  const end = new Date(today)
  end.setDate(today.getDate() - today.getDay()) // last Sunday

  const start = new Date(end)
  start.setDate(end.getDate() - 52 * 7 + 1)

  let cur = new Date(start)
  let week = []

  while (cur <= today) {
    const key = isoDate(cur)
    week.push({ date: key, seconds: store.intensityMap[key] || 0 })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
    cur.setDate(cur.getDate() + 1)
  }
  if (week.length) {
    while (week.length < 7) week.push({ date: '', seconds: 0 })
    weeks.push(week)
  }
  return weeks
})

function intensityClass(seconds) {
  if (seconds === 0) return 'intensity-0'
  const mins = seconds / 60
  if (mins < 30)  return 'intensity-1'
  if (mins < 60)  return 'intensity-2'
  if (mins < 120) return 'intensity-3'
  return 'intensity-4'
}

function confirmClear() {
  if (confirm('Are you sure you want to delete all session data? This cannot be undone.')) {
    store.clearSessions()
  }
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.2s;
}
.back-link:hover { color: var(--accent); }

/* ── Stat cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
.stat-card {
  text-align: center;
  padding: 24px 16px;
}
.stat-icon { font-size: 28px; }
.stat-value { font-size: 28px; font-weight: 700; margin-top: 8px; color: var(--accent); }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

/* ── Chart ── */
.chart-wrapper {
  height: 240px;
  position: relative;
}

/* ── Heatmap ── */
.heatmap-scroll { overflow-x: auto; }

.heatmap {
  display: flex;
  gap: 3px;
  min-width: max-content;
}
.heatmap-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.intensity-0 { background: var(--surface-2); }
.intensity-1 { background: #c7d2fe; }
.intensity-2 { background: #818cf8; }
.intensity-3 { background: #4f46e5; }
.intensity-4 { background: #3730a3; }

[data-theme='dark'] .intensity-0 { background: var(--surface-2); }
[data-theme='dark'] .intensity-1 { background: #1e1b4b; }
[data-theme='dark'] .intensity-2 { background: #3730a3; }
[data-theme='dark'] .intensity-3 { background: #4f46e5; }
[data-theme='dark'] .intensity-4 { background: #818cf8; }

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
</style>
