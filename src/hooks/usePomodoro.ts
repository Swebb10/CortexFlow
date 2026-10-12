import { useEffect, useState } from 'react'
import { advanceTimer, durations, loadTimer } from '../lib/timer'
import type { TimerMode } from '../lib/timer'
import { readStorage, writeStorage } from '../lib/storage'

export function usePomodoro() {
  const [state, setState] = useState(() => loadTimer(readStorage('cortexflow:timer:v1'), Date.now()))
  useEffect(() => { writeStorage('cortexflow:timer:v1', JSON.stringify(state)) }, [state])
  useEffect(() => {
    if (!state.running) return
    const tick = () => setState((previous) => advanceTimer(previous, Date.now()))
    const interval = window.setInterval(tick, 300)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', tick) }
  }, [state.running])
  function toggle() {
    setState((previous) => {
      const current = advanceTimer(previous, Date.now())
      if (current.running) return { ...current, running: false, endAt: null }
      return { ...current, running: true, endAt: Date.now() + current.remaining * 1000 }
    })
  }
  function reset() { setState((previous) => ({ ...previous, remaining: durations[previous.mode], running: false, endAt: null })) }
  function changeMode(mode: TimerMode) { setState((previous) => ({ ...previous, mode, remaining: durations[mode], running: false, endAt: null })) }
  return { ...state, toggle, reset, changeMode }
}
