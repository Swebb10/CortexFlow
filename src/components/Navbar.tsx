import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, Check, ChevronDown, CircleHelp, Menu, Palette, PanelRight, Sparkles } from 'lucide-react'
import { themes, useTheme } from '../context/ThemeContext'

type Props = { onHelp: () => void; onSidebar: () => void; onInspector: () => void; timerRunning: boolean }
export function Navbar({ onHelp, onSidebar, onInspector, timerRunning }: Props) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false) }
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', keyboard) }
  }, [open])
  const selected = themes.find((entry) => entry.id === theme)!
  return <header className="navbar">
    <div className="nav-brand"><button className="icon-button mobile-sidebar-button" onClick={onSidebar} aria-label="Abrir biblioteca"><Menu size={20} /></button><div className="brand-mark"><BrainCircuit size={23} strokeWidth={1.7} /></div><a className="brand-name" href="#main">Cortex<span>Flow</span></a><span className="brand-tag">LEARN WITH CONNECTIONS</span></div>
    <div className="nav-actions">
      <span className="focus-indicator"><span className={`live-dot ${timerRunning ? 'running' : ''}`} />{timerRunning ? 'Enfoque activo' : 'Tu espacio de aprendizaje'}</span>
      <span className="nav-divider" />
      <div className="theme-dropdown" ref={container}>
        <button className="theme-trigger" ref={trigger} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="theme-list"><Palette size={16} /><span>{selected.name}</span><ChevronDown size={13} /></button>
        {open && <div className="theme-menu" id="theme-list"><div className="theme-menu-title"><Sparkles size={14} />Dale tu propio tono</div><div role="group" aria-label="Elegir tema">{themes.map((entry) => <button key={entry.id} aria-pressed={entry.id === theme} onClick={() => { setTheme(entry.id); setOpen(false); trigger.current?.focus() }}><span className="theme-swatches">{entry.swatches.map((color) => <i style={{ background: color }} key={color} />)}</span><span><strong>{entry.name}</strong><small>{entry.description}</small></span>{theme === entry.id && <Check size={16} className="accent-text" />}</button>)}</div><p>Tu elección se guarda automáticamente.</p></div>}
      </div>
      <button className="icon-button help-button" onClick={onHelp} aria-label="Abrir guía rápida" title="Guía rápida"><CircleHelp size={18} /></button>
      <button className="icon-button mobile-inspector-button" onClick={onInspector} aria-label="Abrir inspector"><PanelRight size={19} /></button>
      <div className="avatar" title="Espacio local">CF</div>
    </div>
  </header>
}
