import { Coffee, Pause, Play, RotateCcw, Timer } from 'lucide-react'
import type { usePomodoro } from '../hooks/usePomodoro'
import { durations } from '../lib/timer'

export function PomodoroTimer({ timer }: { timer: ReturnType<typeof usePomodoro> }) {
  const minutes = String(Math.floor(timer.remaining / 60)).padStart(2, '0')
  const seconds = String(timer.remaining % 60).padStart(2, '0')
  return <section className="pomodoro" aria-label="Temporizador Pomodoro">
    <div className="section-label"><Timer size={14} /><span>TIEMPO DE ENFOQUE</span><span className={`live-dot ${timer.running ? 'running' : ''}`} /></div>
    <div className="timer-tabs" role="group" aria-label="Modo del temporizador">
      <button onClick={() => timer.changeMode('focus')} aria-pressed={timer.mode === 'focus'}>Pomodoro</button>
      <button onClick={() => timer.changeMode('break')} aria-pressed={timer.mode === 'break'}><Coffee size={12} />Descanso</button>
    </div>
    <div className="timer-face" role="timer" aria-label={`${minutes} minutos y ${seconds} segundos`}><span>{minutes}</span><span className="timer-colon">:</span><span>{seconds}</span></div>
    <p className="timer-caption" aria-live="polite">{timer.running ? (timer.mode === 'focus' ? 'Una idea a la vez. Tú puedes.' : 'Respira. Dale espacio a tus ideas.') : timer.mode === 'focus' ? 'Tu próximo bloque de claridad.' : 'Pausa breve. Recarga tu mente.'}</p>
    <div className="timer-progress"><div style={{ width: `${(1 - timer.remaining / durations[timer.mode]) * 100}%` }} /></div>
    <div className="timer-actions">
      <button className="button primary" onClick={timer.toggle}>{timer.running ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}{timer.running ? 'Pausar' : timer.remaining < durations[timer.mode] ? 'Continuar' : 'Iniciar sesión'}</button>
      <button className="icon-button" onClick={timer.reset} aria-label="Reiniciar temporizador" title="Reiniciar temporizador"><RotateCcw size={16} /></button>
    </div>
    <div className="timer-sessions"><div className="session-dots">{Array.from({ length: 4 }, (_, index) => <i key={index} className={index < timer.completed % 4 ? 'complete' : ''} />)}</div><span>{timer.completed} sesiones completadas</span></div>
  </section>
}
