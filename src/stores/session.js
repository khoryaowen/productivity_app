import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * A session object shape:
 * {
 *   id: string,
 *   date: string (ISO date),           // "2024-03-15"
 *   studyDuration: number,             // seconds
 *   breakDuration: number,             // seconds
 *   type: 'normal' | 'pomodoro',
 *   completedPomodoros?: number,
 * }
 */

const STORAGE_KEY = 'study_sessions_v1'

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref(loadFromStorage())

  // ── Persist every change ─────────────────────────
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value))
  }

  // ── Actions ──────────────────────────────────────
  function addSession(session) {
    sessions.value.push({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...session,
    })
    save()
  }

  function clearSessions() {
    sessions.value = []
    save()
  }

  // ── Derived analytics ────────────────────────────

  /** All sessions sorted by date ascending */
  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => a.date.localeCompare(b.date))
  )

  /** Map of date → total study seconds */
  const studyByDay = computed(() => {
    const map = {}
    sessions.value.forEach(s => {
      map[s.date] = (map[s.date] || 0) + s.studyDuration
    })
    return map
  })

  /** Last N calendar days with study seconds (for line graph) */
  function getDailyStudy(days = 30) {
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      result.push({ date: key, seconds: studyByDay.value[key] || 0 })
    }
    return result
  }

  const avgStudyDuration = computed(() => {
    if (!sessions.value.length) return 0
    const total = sessions.value.reduce((s, x) => s + x.studyDuration, 0)
    return Math.round(total / sessions.value.length)
  })

  const avgBreakDuration = computed(() => {
    const withBreak = sessions.value.filter(s => s.breakDuration > 0)
    if (!withBreak.length) return 0
    const total = withBreak.reduce((s, x) => s + x.breakDuration, 0)
    return Math.round(total / withBreak.length)
  })

  /** All unique dates that have sessions (for intensity graph) */
  const intensityMap = computed(() => studyByDay.value)

  return {
    sessions,
    addSession,
    clearSessions,
    sortedSessions,
    studyByDay,
    getDailyStudy,
    avgStudyDuration,
    avgBreakDuration,
    intensityMap,
  }
})
