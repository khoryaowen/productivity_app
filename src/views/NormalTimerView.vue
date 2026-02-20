<template>
  <div class="page">
    <!-- Back nav -->
    <RouterLink to="/" class="back-link">← Home</RouterLink>

    <div class="card mt-24 text-center">
      <h1>Normal Timer</h1>
      <p class="text-muted mt-8">Start to study. Pause to take a break. End to log the session.</p>

      <!-- Status badge -->
      <div class="mt-24">
        <span class="badge" :class="phase === 'study' ? 'badge-study' : 'badge-break'">
          {{ phaseLabel }}
        </span>
      </div>

      <!-- Timer display -->
      <div class="timer-display mt-16">{{ formattedTime }}</div>

      <!-- Session breakdown -->
      <div v-if="studyTotal > 0 || breakTotal > 0" class="breakdown mt-16">
        <span>📖 Study: <strong>{{ formatSeconds(studyTotal) }}</strong></span>
        <span>☕ Break: <strong>{{ formatSeconds(breakTotal) }}</strong></span>
      </div>

      <!-- Controls -->
      <div class="controls mt-24">
        <!-- Not started -->
        <template v-if="!isRunning && phase === 'idle'">
          <button class="btn btn-primary btn-lg" @click="startStudy">▶ Start Studying</button>
        </template>

        <!-- Actively studying -->
        <template v-else-if="isRunning && phase === 'study'">
          <button class="btn btn-warning btn-lg" @click="pauseForBreak">⏸ Pause (Break)</button>
          <button class="btn btn-danger btn-lg" @click="endSession">■ End Session</button>
        </template>

        <!-- On break (paused) -->
        <template v-else-if="!isRunning && phase === 'break'">
          <button class="btn btn-primary btn-lg" @click="resumeStudy">▶ Resume Studying</button>
          <button class="btn btn-danger btn-lg" @click="endSession">■ End Session</button>
        </template>
      </div>
    </div>

    <!-- Saved confirmation -->
    <Transition name="fade">
      <div v-if="savedMsg" class="save-msg card mt-16">
        ✅ Session saved! Study: {{ savedMsg.study }} | Break: {{ savedMsg.brk }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSessionsStore } from '../stores/session'

const store = useSessionsStore()

// ── State ─────────────────────────────────────────
const phase     = ref('idle')   // 'idle' | 'study' | 'break'
const isRunning = ref(false)
const elapsed   = ref(0)        // seconds ticking in current phase
const studyTotal = ref(0)
const breakTotal = ref(0)
const savedMsg  = ref(null)

let interval = null

// ── Computed ──────────────────────────────────────
const formattedTime = computed(() => formatSeconds(elapsed.value))

const phaseLabel = computed(() => ({
  idle: 'Not started',
  study: 'Studying',
  break: 'On Break',
}[phase.value]))

// ── Helpers ───────────────────────────────────────
function formatSeconds(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function startTick() {
  interval = setInterval(() => elapsed.value++, 1000)
}

function stopTick() {
  clearInterval(interval)
  interval = null
}

// ── Actions ───────────────────────────────────────
function startStudy() {
  phase.value = 'study'
  isRunning.value = true
  elapsed.value = 0
  startTick()
}

function pauseForBreak() {
  // Commit study time
  studyTotal.value += elapsed.value
  elapsed.value = 0
  isRunning.value = false
  phase.value = 'break'
  stopTick()
  // Auto-start break timer
  startTick()
  isRunning.value = false // break is "paused" from study perspective
}

function resumeStudy() {
  // Commit break time
  breakTotal.value += elapsed.value
  elapsed.value = 0
  phase.value = 'study'
  isRunning.value = true
  startTick()
}

function endSession() {
  stopTick()

  // Commit whichever phase was active
  if (phase.value === 'study') {
    studyTotal.value += elapsed.value
  } else if (phase.value === 'break') {
    breakTotal.value += elapsed.value
  }

  if (studyTotal.value > 0) {
    store.addSession({
      studyDuration: studyTotal.value,
      breakDuration: breakTotal.value,
      type: 'normal',
    })
    savedMsg.value = {
      study: formatSeconds(studyTotal.value),
      brk: formatSeconds(breakTotal.value),
    }
    setTimeout(() => (savedMsg.value = null), 5000)
  }

  // Reset
  phase.value = 'idle'
  isRunning.value = false
  elapsed.value = 0
  studyTotal.value = 0
  breakTotal.value = 0
}

onUnmounted(stopTick)
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
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  text-align: center;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
