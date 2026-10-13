import { useEffect, useRef, useState } from 'react'
import { Square, Volume2 } from 'lucide-react'
import type { AudioSample } from '../types'

export function ListenButton({ sample }: { sample: AudioSample }) {
  const [speaking, setSpeaking] = useState(false)
  const [message, setMessage] = useState('')
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)
  useEffect(() => () => {
    if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null; window.speechSynthesis.cancel() }
  }, [])
  function listen() {
    if (!('speechSynthesis' in window)) { setMessage('Este navegador no ofrece lectura en voz alta. Practica con grabaciones de hablantes reales.'); return }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find((entry) => entry.lang.toLowerCase().startsWith(sample.language.slice(0, 2)))
    if (!voice) { setMessage(`No hay una voz de ${sample.language === 'de-DE' ? 'alemán' : 'ruso'} disponible en este navegador. Practica con grabaciones de hablantes reales o instala una voz del idioma en tu sistema.`); return }
    window.speechSynthesis.cancel()
    const speech = new SpeechSynthesisUtterance(sample.text.replace(/\u0301/g, ''))
    speech.lang = sample.language; speech.voice = voice; speech.rate = 0.85
    speech.onend = () => setSpeaking(false)
    speech.onerror = (event) => { setSpeaking(false); if (event.error !== 'canceled' && event.error !== 'interrupted') setMessage('No se pudo reproducir la voz. Intenta de nuevo o practica con una grabación de hablantes reales.') }
    utterance.current = speech; setSpeaking(true); setMessage(''); window.speechSynthesis.speak(speech)
  }
  useEffect(() => { if ('speechSynthesis' in window) window.speechSynthesis.getVoices() }, [])
  return <div className="listen-practice"><button className="button secondary" onClick={listen}>{speaking ? <Square size={13} /> : <Volume2 size={14} />}{speaking ? 'Detener audio' : 'Escuchar ejemplos'}</button><small>Voz del navegador · escucha y después repite</small>{message && <p role="status">{message}</p>}</div>
}
