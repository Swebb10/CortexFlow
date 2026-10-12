export type TimerMode = 'focus' | 'break'
export type TimerState = { mode: TimerMode; remaining: number; running: boolean; endAt: number | null; completed: number }
export const durations: Record<TimerMode, number> = { focus: 25 * 60, break: 5 * 60 }
export const freshTimer = (): TimerState => ({ mode: 'focus', remaining: durations.focus, running: false, endAt: null, completed: 0 })
export function advanceTimer(state: TimerState, now: number): TimerState {
  if (!state.running || state.endAt === null) return state
  const remaining = Math.max(0, Math.ceil((state.endAt - now) / 1000))
  if (remaining > 0) return remaining === state.remaining ? state : { ...state, remaining }
  const mode = state.mode === 'focus' ? 'break' : 'focus'
  return { mode, remaining: durations[mode], running: false, endAt: null, completed: state.completed + (state.mode === 'focus' ? 1 : 0) }
}
export function loadTimer(raw: string | null, now: number): TimerState {
  try {
    const state = JSON.parse(raw ?? 'null') as TimerState | null
    if (!state || !['focus','break'].includes(state.mode) || typeof state.running !== 'boolean'
      || !Number.isInteger(state.remaining) || state.remaining < 1 || state.remaining > durations[state.mode]
      || !Number.isInteger(state.completed) || state.completed < 0
      || (state.running ? typeof state.endAt !== 'number' || !Number.isFinite(state.endAt) : state.endAt !== null)) return freshTimer()
    return advanceTimer(state, now)
  } catch { return freshTimer() }
}
