<template>
  <div class="page">
    <RouterLink to="/" class="back-link">← Home</RouterLink>

    <!-- Setup form (shown before starting) -->
    <div v-if="!sessionActive" class="card mt-24">
      <h1>🍅 Pomodoro Timer</h1>
      <p class="text-muted mt-8">Configure your focus and break intervals, then start.</p>

      <div class="form-grid mt-24">
        <div>
          <label>Study Duration (min)</label>
          <input v-model.number="config.studyMin" type="number" min="1" max="120" />
        </div>
        <div>
          <label>Short Break (min)</label>
          <input v-model.number="config.shortBreakMin" type="number" min="1" max="60" />
        </div>
        <div>
          <label>Long Break (min)</label>
          <input v-model.number="config.longBreakMin" type="number" min="1" max="60" />
        </div>
        <div>
          <label>Pomodoros before long break</label>
          <input v-model.number="config.longBreakAfter" type="number" min="1" max="10" />
        </div>
      </div>

      <div class="mt-24 text-center">
        <button class="btn btn-primary btn-lg" @click="startSession">▶ Start Session</button>
      </div>
    </div>

    <!-- Active session -->
    <div v-else class="card mt-24 text-center">
      <div class="flex items-center justify-between">
        <h1>🍅 Pomodoro</h1>
        <span class="pomodoro-count">{{ pomodorosCompleted }} 🍅 done</span>
      </div>

      <!-- Phase badge -->
      <div class="mt-16">
        <span class="badge" :class="phaseBadgeClass">{{ phaseLabel }}</span>
      </div>

      <!-- Ring timer -->
      <div class="ring-wrapper mt-16">
        <svg class="ring" viewBox="0 0 120 120">
          <circle class="ring-bg" cx="60" cy="60" r="52" />
          <circle
            class="ring-progress"
            cx="60" cy="60" r="52"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="ring-time">{{ formattedTime }}</div>
      </div>

      <!-- Controls -->
      <div class="controls mt-24">
        <button v-if="!isRunning" class="btn btn-primary btn-lg" @click="resumeTick">▶ Resume</button>
        <button v-else class="btn btn-warning btn-lg" @click="pauseTick">⏸ Pause</button>
        <button class="btn btn-outline btn-lg" @click="skipPhase">⏭ Skip</button>
        <button class="btn btn-danger btn-lg" @click="endSession">■ End Session</button>
      </div>

      <!-- Session summary -->
      <div class="breakdown mt-24">
        <span>📖 Study: <strong>{{ formatSeconds(totalStudy) }}</strong></span>
        <span>☕ Break: <strong>{{ formatSeconds(totalBreak) }}</strong></span>
      </div>
    </div>

    <!-- Saved notification -->
    <Transition name="fade">
      <div v-if="savedMsg" class="save-msg card mt-16">
        ✅ Session saved! {{ savedMsg.pomodoros }} pomodoro(s) | Study: {{ savedMsg.study }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSessionsStore } from '../stores/session'

const store = useSessionsStore()

// ── Config ────────────────────────────────────────
const config = ref({
  studyMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakAfter: 4,
})

// ── Session state ─────────────────────────────────
const sessionActive     = ref(false)
const phase             = ref('study')   // 'study' | 'shortBreak' | 'longBreak'
const isRunning         = ref(false)
const elapsed           = ref(0)         // seconds into current phase
const pomodorosCompleted = ref(0)
const totalStudy        = ref(0)
const totalBreak        = ref(0)
const savedMsg          = ref(null)

let interval = null

// ── Ring geometry ─────────────────────────────────
const circumference = 2 * Math.PI * 52  // r=52

const phaseDuration = computed(() => {
  if (phase.value === 'study')      return config.value.studyMin * 60
  if (phase.value === 'shortBreak') return config.value.shortBreakMin * 60
  return config.value.longBreakMin * 60
})

const dashOffset = computed(() => {
  const ratio = Math.max(0, 1 - elapsed.value / phaseDuration.value)
  return circumference * ratio
})

const formattedTime = computed(() => {
  const remaining = Math.max(0, phaseDuration.value - elapsed.value)
  return formatSeconds(remaining)
})

const phaseLabel = computed(() => ({
  study: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}[phase.value]))

const phaseBadgeClass = computed(() => ({
  study: 'badge-study',
  shortBreak: 'badge-break',
  longBreak: 'badge-break',
}[phase.value]))

// ── Helpers ───────────────────────────────────────
function formatSeconds(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function startSession() {
  sessionActive.value = true
  phase.value = 'study'
  elapsed.value = 0
  pomodorosCompleted.value = 0
  totalStudy.value = 0
  totalBreak.value = 0
  isRunning.value = true
  startTick()
}

function startTick() {
  interval = setInterval(tick, 1000)
}

function resumeTick() {
  isRunning.value = true
  startTick()
}

function pauseTick() {
  isRunning.value = false
  clearInterval(interval)
}

function tick() {
  elapsed.value++
  if (elapsed.value >= phaseDuration.value) {
    advancePhase()
  }
}

function advancePhase(manual = false) {
  clearInterval(interval)
  interval = null

  if (phase.value === 'study') {
    totalStudy.value += elapsed.value
    pomodorosCompleted.value++
    const isLongBreak = pomodorosCompleted.value % config.value.longBreakAfter === 0
    phase.value = isLongBreak ? 'longBreak' : 'shortBreak'
  } else {
    totalBreak.value += elapsed.value
    phase.value = 'study'
  }

  elapsed.value = 0

  if (!manual) {
    // Auto-continue
    isRunning.value = true
    startTick()
  } else {
    isRunning.value = false
  }
}

function skipPhase() {
  advancePhase(false)
}

function endSession() {
  clearInterval(interval)
  interval = null

  // Commit partial phase
  if (phase.value === 'study') totalStudy.value += elapsed.value
  else totalBreak.value += elapsed.value

  if (totalStudy.value > 0) {
    store.addSession({
      studyDuration: totalStudy.value,
      breakDuration: totalBreak.value,
      type: 'pomodoro',
      completedPomodoros: pomodorosCompleted.value,
    })
    savedMsg.value = {
      study: formatSeconds(totalStudy.value),
      pomodoros: pomodorosCompleted.value,
    }
    setTimeout(() => (savedMsg.value = null), 5000)
  }

  // Reset
  sessionActive.value = false
  isRunning.value = false
  elapsed.value = 0
}

onUnmounted(() => clearInterval(interval))
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 480px) { .form-grid { grid-template-columns: 1fr; } }

.pomodoro-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
}

/* ── Ring ── */
.ring-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.ring { transform: rotate(-90deg); width: 100%; height: 100%; }

.ring-bg {
  fill: none;
  stroke: var(--surface-2);
  stroke-width: 10;
}

.ring-progress {
  fill: none;
  stroke: var(--accent);
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.9s linear;
}

.ring-time {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}

.controls {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.breakdown {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 15px;
  color: var(--text-muted);
}

.save-msg {
  text-align: center;
  font-weight: 600;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
