import { BookOpen, ChevronRight, FileText, FolderOpen, HardDrive, Network, Plus, Search, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { KnowledgeMap } from '../types'
import { PomodoroTimer } from './PomodoroTimer'
import type { usePomodoro } from '../hooks/usePomodoro'

type Props = { maps: KnowledgeMap[]; activeId: string; onSelect: (id: string) => void; onImport: (file: File) => void; onCreate: () => void; onClose: () => void; importing: boolean; persistenceError: boolean; timer: ReturnType<typeof usePomodoro> }
export function Sidebar({ maps, activeId, onSelect, onImport, onCreate, onClose, importing, persistenceError, timer }: Props) {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const filtered = maps.filter((map) => map.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const totalReviewed = maps.reduce((total, map) => total + map.reviewedNodeIds.length, 0)
  return <aside className="sidebar" aria-label="Biblioteca y enfoque">
    <div className="sidebar-heading"><span>MI ESPACIO</span><button className="icon-button mobile-close" onClick={onClose} aria-label="Cerrar biblioteca"><X size={17} /></button></div>
    <div className="workspace-link"><div className="workspace-icon"><Network size={18} /></div><div><strong>Mi conocimiento</strong><small>{maps.length} módulos · {totalReviewed} conceptos repasados</small></div><ChevronRight size={15} /></div>
    <div className="library-heading"><span><FolderOpen size={15} />BIBLIOTECA</span><button className="icon-button" onClick={onCreate} title="Crear nota" aria-label="Crear nota"><Plus size={16} /></button></div>
    <label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar módulos…" aria-label="Buscar módulos" /></label>
    <div className="module-list">{filtered.map((map) => <button className={`module-item ${activeId === map.id ? 'active' : ''}`} key={map.id} onClick={() => onSelect(map.id)}><div className="module-icon">{map.id === 'software-cloud' ? <Network size={17} /> : <FileText size={17} />}</div><span><strong>{map.title}</strong><small>{map.nodes.length} conceptos<span className="module-dot">·</span>{map.category}</small></span>{activeId === map.id && <i className="active-module-dot" />}</button>)}{filtered.length === 0 && <p className="empty-search">No hay módulos con ese nombre.</p>}</div>
    <div className="sidebar-create"><button className="button secondary" onClick={onCreate}><Plus size={16} />Nueva nota</button><button className="import-dropzone" onClick={() => input.current?.click()} disabled={importing}><Upload size={19} /><strong>{importing ? 'Conectando ideas…' : 'Importar tus ideas'}</strong><span>Markdown, texto o copia JSON · 1 MB</span><small><span>.md</span><span>.txt</span><span>.json</span></small></button><input ref={input} type="file" accept=".md,.markdown,.txt,.json,text/plain,text/markdown,application/json" className="sr-only" aria-label="Importar archivo" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = '' }} /></div>
    <div className="sidebar-bottom"><PomodoroTimer timer={timer} /><div className={`local-status ${persistenceError ? 'storage-warning' : ''}`}><HardDrive size={13} /><span>{persistenceError ? 'Sin espacio. Exporta tus notas.' : 'Guardado en este navegador'}</span><span className="live-dot" /></div><div className="sidebar-footer"><BookOpen size={13} /><span>Pequeñas sesiones. Grandes ideas.</span></div></div>
  </aside>
}
