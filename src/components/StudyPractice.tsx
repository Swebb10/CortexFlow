import { useState } from 'react'
import { Eye, Lightbulb, PencilLine, RotateCcw } from 'lucide-react'
import type { StudyExercise } from '../types'
import { readStorage, writeStorage } from '../lib/storage'
import { MarkdownContent } from './MarkdownContent'

export function StudyPractice({ exercise, storageId }: { exercise: StudyExercise; storageId: string }) {
  const key = `cortexflow:attempt:${storageId}`
  const [attempt, setAttempt] = useState<string>(() => {
    try { const saved = JSON.parse(readStorage(key) ?? 'null'); return saved?.prompt === exercise.prompt && typeof saved.attempt === 'string' ? saved.attempt : '' } catch { return '' }
  })
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [saved, setSaved] = useState(true)
  function updateAttempt(value: string) {
    setAttempt(value); setShowAnswer(false)
    setSaved(writeStorage(key, JSON.stringify({ prompt: exercise.prompt, attempt: value })))
  }
  return <section className="study-practice" aria-label="Ejercicio de práctica">
    <div className="section-label"><PencilLine size={14} />PRIMERO, TU INTENTO</div>
    <MarkdownContent content={exercise.prompt} />
    <label>Tu respuesta<textarea aria-label="Tu respuesta al ejercicio" rows={4} maxLength={10000} value={attempt} placeholder="Escribe tu intento antes de consultar la respuesta…" onChange={(event) => updateAttempt(event.target.value)} /></label>
    <small className="attempt-status">{saved ? 'Tu intento se conserva en este navegador.' : 'No se pudo guardar el intento. Puedes copiarlo.'}</small>
    <div className="practice-actions">{exercise.hint && <button onClick={() => setShowHint(!showHint)} className="button secondary"><Lightbulb size={13} />{showHint ? 'Ocultar pista' : 'Una pista'}</button>}<button className="button secondary" disabled={!attempt.trim()} onClick={() => setShowAnswer(!showAnswer)}><Eye size={13} />{showAnswer ? 'Ocultar respuesta' : 'Comparar mi respuesta'}</button></div>
    {showHint && <div className="practice-hint"><MarkdownContent content={exercise.hint!} /></div>}
    {showAnswer && <div className="practice-answer"><strong>Respuesta orientativa</strong><MarkdownContent content={exercise.answer} /><p>Compara el significado y el patrón. Puede haber otras respuestas válidas; esta comparación no es una corrección automática.</p><button className="next-concept" onClick={() => { updateAttempt(''); setShowHint(false) }}><RotateCcw size={13} />Practicar otra vez</button></div>}
  </section>
}
