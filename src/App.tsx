import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { XYPosition } from '@xyflow/react'
import { ArrowRight, BookOpen, Check, ChevronRight, Download, FileText, GitBranch, Home, ListTree, Network, Plus, Redo2, Search, ShieldCheck, Sparkles, Trash2, Undo2, Upload, X } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { MindMapCanvas } from './components/MindMapCanvas'
import { NodeInspector } from './components/NodeInspector'
import { Modal } from './components/Modal'
import { demoMaps } from './data/demo-maps'
import { isKnowledgeMap, loadMaps, readStorage, writeStorage } from './lib/storage'
import { MAX_FILE_BYTES, markdownToMap } from './lib/markdown'
import { usePomodoro } from './hooks/usePomodoro'
import { useMapHistory } from './hooks/useMapHistory'
import { NodeEditor } from './components/NodeEditor'
import type { NodeEditorTarget } from './components/NodeEditor'
import { addKnowledgeNode, branchIds, editKnowledgeNode, removeKnowledgeBranch, reparentKnowledgeNode } from './lib/map-editor'
import type { NodeDraft } from './lib/map-editor'
import type { KnowledgeMap } from './types'

type Notice = { text: string; error: boolean }
export default function App() {
  const { maps, histories, setMaps, changeMap, undo, redo } = useMapHistory(() => loadMaps(demoMaps))
  const [activeId, setActiveId] = useState(() => readStorage('cortexflow:active') ?? 'software-cloud')
  const map = maps.find((entry) => entry.id === activeId) ?? maps[0]
  const [selectedId, setSelectedId] = useState('cloud')
  const node = map.nodes.find((entry) => entry.id === selectedId) ?? map.nodes[0]
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [modal, setModal] = useState<'create' | 'help' | 'delete' | 'delete-node' | null>(null)
  const [editor, setEditor] = useState<NodeEditorTarget | null>(null)
  const [editorError, setEditorError] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [view, setView] = useState<'map' | 'outline'>('map')
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [persistenceError, setPersistenceError] = useState(false)
  const [importing, setImporting] = useState(false)
  const [title, setTitle] = useState('')
  const [draft, setDraft] = useState('## Concepto principal\nUna explicación con tus propias palabras.\n\n### Una conexión\n¿Cómo se relaciona con lo que ya conoces?')
  const [formError, setFormError] = useState('')
  const timer = usePomodoro()
  const searchInput = useRef<HTMLInputElement>(null)
  const progress = Math.round(map.reviewedNodeIds.length / map.nodes.length * 100)
  const searchResults = query.trim() ? map.nodes.filter((entry) => entry.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 8) : []
  const canUndo = !!histories[map.id]?.past.length
  const canRedo = !!histories[map.id]?.future.length
  const nodeToDelete = map.nodes.find((entry) => entry.id === pendingDeleteId)
  const openAddNode = useCallback((parentId: string) => { setEditor({ kind: 'create', parentId }); setEditorError(''); setFocusId(null) }, [])
  const openEditNode = useCallback((nodeId: string) => { setEditor({ kind: 'edit', nodeId }); setEditorError(''); setFocusId(null) }, [])
  const requestDeleteNode = useCallback((id: string) => { setPendingDeleteId(id); setModal('delete-node') }, [])

  useEffect(() => { setPersistenceError(!writeStorage('cortexflow:maps:v1', JSON.stringify(maps))) }, [maps])
  useEffect(() => { writeStorage('cortexflow:active', map.id) }, [map.id])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), notice.error ? 8000 : 4500)
    return () => window.clearTimeout(timeout)
  }, [notice])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchInput.current?.focus() }
      if (event.key === 'Escape') { setQuery(''); setSidebarOpen(false); setInspectorOpen(false) }
      if (modal || editor || (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]'))) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); (event.shiftKey ? redo : undo)(map.id); setFocusId(null) }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(map.id); setFocusId(null) }
      if (event.key === 'Delete' && node.parentId !== null) { event.preventDefault(); requestDeleteNode(node.id) }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [map.id, node.id, node.parentId, modal, editor, undo, redo, requestDeleteNode])
  function updateMap(update: (current: KnowledgeMap) => KnowledgeMap) {
    const updatedAt = new Date().toISOString()
    changeMap(map.id, (current) => { const next = update(current); return next === current ? current : { ...next, updatedAt } })
  }
  function selectMap(id: string) {
    const next = maps.find((entry) => entry.id === id)!
    setActiveId(id); setSelectedId(next.nodes.find((entry) => entry.parentId !== null)?.id ?? next.nodes[0].id)
    setFocusId(null); setQuery(''); setSidebarOpen(false)
  }
  function selectNode(id: string) { setSelectedId(id); setInspectorOpen(true) }
  function moveNode(id: string, position: XYPosition) { setFocusId(null); updateMap((current) => {
    const moved = current.nodes.find((entry) => entry.id === id)
    if (!moved || (moved.position.x === position.x && moved.position.y === position.y)) return current
    return { ...current, nodes: current.nodes.map((entry) => entry.id === id ? { ...entry, position } : entry) }
  }) }
  function saveNode(draft: NodeDraft) {
    if (!editor) return
    try {
      const id = editor.kind === 'create' ? crypto.randomUUID() : editor.nodeId
      const next = editor.kind === 'create' ? addKnowledgeNode(map, draft, id) : editKnowledgeNode(map, id, draft)
      updateMap(() => next); setSelectedId(id); setFocusId(id); setInspectorOpen(true); setEditor(null)
      setNotice({ text: editor.kind === 'create' ? 'Concepto añadido y conectado al mapa.' : 'Concepto actualizado. Cambios guardados localmente.', error: false })
    } catch (error) { setEditorError(error instanceof Error ? error.message : 'No se pudo guardar el concepto.') }
  }
  function connectNode(id: string, parentId: string) {
    try { const next = reparentKnowledgeNode(map, id, parentId); updateMap(() => next); setSelectedId(id); setNotice({ text: 'Conexión actualizada.', error: false }) }
    catch (error) { setNotice({ text: error instanceof Error ? error.message : 'No se pudo cambiar la conexión.', error: true }) }
  }
  function deleteNode() {
    if (!nodeToDelete) return
    const next = removeKnowledgeBranch(map, nodeToDelete.id)
    updateMap(() => next); setSelectedId(nodeToDelete.parentId!); setFocusId(null); setPendingDeleteId(null); setModal(null)
    setNotice({ text: 'Rama eliminada. Puedes recuperarla con Deshacer o Ctrl + Z.', error: false })
  }
  function reviewNode() {
    updateMap((current) => ({ ...current, reviewedNodeIds: current.reviewedNodeIds.includes(node.id) ? current.reviewedNodeIds.filter((id) => id !== node.id) : [...current.reviewedNodeIds, node.id] }))
  }
  function nextNode() {
    const index = map.nodes.findIndex((entry) => entry.id === node.id)
    const next = map.nodes.slice(index + 1).concat(map.nodes.slice(0, index + 1))
    selectNode((next.find((entry) => !map.reviewedNodeIds.includes(entry.id) && entry.id !== node.id) ?? next[0]).id)
  }
  function addMap(next: KnowledgeMap) {
    if (maps.length >= 30) throw new Error('Has alcanzado 30 módulos. Exporta y elimina alguno para añadir más.')
    setMaps((previous) => [...previous, next]); setActiveId(next.id)
    setSelectedId(next.nodes[0].id); setFocusId(null); setQuery(''); setSidebarOpen(false)
    setNotice({ text: `${next.nodes.length} conceptos conectados. Tu mapa está listo.`, error: false })
  }
  async function importFile(file: File) {
    setImporting(true)
    try {
      if (!/\.(md|markdown|txt|json)$/i.test(file.name)) throw new Error('Elige un archivo .md, .markdown, .txt o una copia .json de CortexFlow.')
      if (file.size > MAX_FILE_BYTES) throw new Error('El archivo supera 1 MB. Divídelo en notas más pequeñas.')
      const text = await file.text()
      if (/\.json$/i.test(file.name)) {
        const value: unknown = JSON.parse(text)
        if (!isKnowledgeMap(value)) throw new Error('La copia JSON no tiene un mapa válido de CortexFlow.')
        addMap({ ...value, id: crypto.randomUUID(), title: maps.some((entry) => entry.id === value.id) ? `${value.title} (copia)` : value.title })
      } else addMap(markdownToMap(text, file.name, crypto.randomUUID()))
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : 'No se pudo leer el archivo.', error: true }) }
    finally { setImporting(false) }
  }
  function createNote(event: FormEvent) {
    event.preventDefault()
    try {
      if (!title.trim() || !draft.trim()) throw new Error('Completa el título y el contenido de la nota.')
      const content = /^#\s/m.test(draft) ? draft : `# ${title.trim()}\n\n${draft}`
      if (new Blob([content]).size > MAX_FILE_BYTES) throw new Error('La nota supera 1 MB.')
      addMap(markdownToMap(content, title.trim(), crypto.randomUUID())); setModal(null); setTitle(''); setFormError('')
    } catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo crear el mapa.') }
  }
  function exportMap() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `${map.title.replace(/[^\p{L}\p{N}-]+/gu, '-').toLowerCase()}.cortexflow.json`
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice({ text: 'Copia JSON exportada: incluye posiciones y progreso.', error: false })
  }
  function deleteMap() {
    const remaining = maps.filter((entry) => entry.id !== map.id)
    setMaps(remaining.length ? remaining : [structuredClone(demoMaps[0])])
    setActiveId(remaining[0]?.id ?? demoMaps[0].id); setSelectedId(''); setModal(null)
    setNotice({ text: 'Módulo eliminado de este navegador.', error: false })
  }
  return <div className="app-shell">
    <a href="#main" className="skip-link">Saltar al mapa</a>
    <Navbar onHelp={() => setModal('help')} onSidebar={() => { setSidebarOpen(!sidebarOpen); setInspectorOpen(false) }} onInspector={() => { setInspectorOpen(!inspectorOpen); setSidebarOpen(false) }} timerRunning={timer.running} />
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''} ${inspectorOpen ? 'inspector-open' : ''}`}>
      {(sidebarOpen || inspectorOpen) && <button className="drawer-backdrop" aria-label="Cerrar panel" onClick={() => { setSidebarOpen(false); setInspectorOpen(false) }} />}
      <Sidebar maps={maps} activeId={map.id} onSelect={selectMap} onImport={importFile} onCreate={() => { setModal('create'); setFormError('') }} onClose={() => setSidebarOpen(false)} importing={importing} persistenceError={persistenceError} timer={timer} />
      <main className="main-panel" id="main" tabIndex={-1}>
        <div className="main-heading">
          <div className="breadcrumb"><Home size={12} /><span>Mi espacio</span><ChevronRight size={12} /><span>{map.category}</span></div>
          <div className="map-title-row"><div><div className="eyebrow"><span className="live-dot" />CONECTA. COMPRENDE. RECUERDA.</div><h1>{map.title}<span className="title-dot">.</span></h1></div><div className="map-actions"><button className="button primary add-concept-button" onClick={() => openAddNode(node.id)} aria-label="Añadir concepto al mapa"><Plus size={15} /><span>Nuevo concepto</span></button><button className="button export-button" onClick={exportMap}><Download size={15} /><span>Exportar</span></button></div></div>
          <p className="map-description">{map.description}</p>
          <div className="map-toolbar"><div className="view-tabs" role="group" aria-label="Vista de contenido"><button onClick={() => setView('map')} aria-pressed={view === 'map'}><Network size={15} />Mapa mental</button><button onClick={() => setView('outline')} aria-pressed={view === 'outline'}><ListTree size={15} />Esquema</button></div><div className="map-toolbar-right"><div className="editor-history" role="group" aria-label="Historial del mapa"><button className="icon-button" aria-label="Deshacer cambio" title="Deshacer · Ctrl Z" disabled={!canUndo} onClick={() => { undo(map.id); setFocusId(null) }}><Undo2 size={15} /></button><button className="icon-button" aria-label="Rehacer cambio" title="Rehacer · Ctrl Shift Z" disabled={!canRedo} onClick={() => { redo(map.id); setFocusId(null) }}><Redo2 size={15} /></button></div><span className="concept-count"><GitBranch size={13} />{map.nodes.length} conceptos</span><div className="node-search"><Search size={15} /><input ref={searchInput} value={query} placeholder="Buscar concepto…" aria-label="Buscar concepto" onChange={(event) => { setQuery(event.target.value); setFocusId(null) }} /><kbd>Ctrl K</kbd>{query && <div className="search-results">{searchResults.length ? searchResults.map((entry) => <button key={entry.id} onClick={() => { selectNode(entry.id); setFocusId(entry.id); setQuery('') }}><span className={`related-dot tone-${entry.tone}`} />{entry.title}<ArrowRight size={13} /></button>) : <p>No se encontraron conceptos.</p>}</div>}</div><button className="icon-button delete-map-button" onClick={() => setModal('delete')} aria-label="Eliminar módulo" title="Eliminar módulo"><Trash2 size={14} /></button></div></div>
        </div>
        {view === 'map' ? <MindMapCanvas map={map} selectedId={node.id} onSelect={selectNode} onMove={moveNode} focusId={focusId} onAdd={openAddNode} onEdit={openEditNode} onRemove={requestDeleteNode} onConnect={connectNode} /> : <div className="outline-view"><div className="outline-intro"><ListTree size={20} /><div><h2>Tus ideas, en perspectiva.</h2><p>Selecciona un concepto para leer y practicar.</p></div></div>{map.nodes.map((entry) => <button key={entry.id} className={`outline-node tone-${entry.tone} ${entry.id === node.id ? 'selected' : ''}`} onClick={() => selectNode(entry.id)}><div className="outline-symbol"><Network size={18} /></div><div><small>{entry.parentId ? map.nodes.find((parent) => parent.id === entry.parentId)?.title : 'Idea central'}</small><strong>{entry.title}</strong><p>{entry.summary}</p></div>{map.reviewedNodeIds.includes(entry.id) ? <Check size={17} /> : <ArrowRight size={17} />}</button>)}</div>}
        <footer className="map-footer"><div className="map-progress"><span className="progress-icon"><Sparkles size={15} /></span><div><strong>Tu conocimiento está creciendo</strong><span>{map.reviewedNodeIds.length} de {map.nodes.length} conceptos repasados</span></div></div><div className="progress-track" role="progressbar" aria-label="Progreso de repaso" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><strong className="progress-value">{progress}%</strong></footer>
      </main>
      <NodeInspector key={`${map.id}-${node.id}`} node={node} map={map} onReview={reviewNode} onNext={nextNode} onClose={() => setInspectorOpen(false)} onSelect={selectNode} onAdd={openAddNode} onEdit={openEditNode} onRemove={requestDeleteNode} />
    </div>
    {notice && <div className={`toast ${notice.error ? 'toast-error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.error ? <X size={17} /> : <Check size={17} />}<span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Cerrar aviso"><X size={14} /></button></div>}
    {editor && <NodeEditor key={`${map.id}-${editor.kind === 'edit' ? editor.nodeId : editor.parentId}`} map={map} target={editor} onClose={() => setEditor(null)} onSave={saveNode} error={editorError} />}
    {modal === 'delete-node' && nodeToDelete && <Modal title="Eliminar esta rama" onClose={() => setModal(null)}><p className="modal-description">Se eliminará «{nodeToDelete.title}» y sus subconceptos: {branchIds(map, nodeToDelete.id).size} conceptos en total. Puedes recuperar la rama con Deshacer durante esta sesión.</p><div className="delete-actions"><button className="button secondary" onClick={() => setModal(null)}>Cancelar</button><button className="button danger" onClick={deleteNode}><Trash2 size={15} />Eliminar rama</button></div></Modal>}
    {modal === 'create' && <Modal title="Dale forma a una idea" onClose={() => setModal(null)}><p className="modal-description">Escribe en Markdown. Los encabezados se convierten en conceptos conectados.</p><form onSubmit={createNote} className="note-form"><label>Título del módulo<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Sistemas distribuidos" maxLength={100} required /></label><label>Tu nota en Markdown<textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={10} required spellCheck={false} /></label><p className="form-hint"><FileText size={13} />Usa # para el título, ## para conceptos y ### para subconceptos.</p>{formError && <p className="form-error" role="alert">{formError}</p>}<button type="submit" className="button primary"><Network size={16} />Crear mapa mental<ArrowRight size={15} /></button></form></Modal>}
    {modal === 'help' && <Modal title="Menos fricción. Más conexiones." onClose={() => setModal(null)}><p className="modal-description">Un pequeño ritual para comprender mejor lo que estudias.</p><div className="help-steps"><div><span><Upload size={20} /></span><section><small>01 · CAPTURA</small><h3>Empieza por una nota</h3><p>Importa .md o .txt, o escribe una nota. Los encabezados forman la jerarquía; un texto sin encabezados se organiza por párrafos.</p></section></div><div><span><Network size={20} /></span><section><small>02 · CONECTA</small><h3>Construye tu mapa</h3><p>Usa Nuevo concepto o Añadir hijo para ampliar el mapa. Haz doble clic para editar; cambia conexiones arrastrando entre los puntos de los nodos. Deshacer recupera tus cambios con Ctrl + Z.</p></section></div><div><span><BookOpen size={20} /></span><section><small>03 · RECUERDA</small><h3>Estudia de forma activa</h3><p>Inicia un bloque de 25 minutos, activa Active Recall y responde antes de revelar la explicación. Después marca el concepto como repasado.</p></section></div></div><div className="privacy-note"><ShieldCheck size={18} /><p>Tus notas se procesan localmente. Exporta copias JSON para respaldar mapas, posiciones y progreso. Puedes importarlas desde el selector de archivos.</p></div></Modal>}
    {modal === 'delete' && <Modal title="Eliminar este módulo" onClose={() => setModal(null)}><p className="modal-description">Se eliminará «{map.title}» con sus posiciones y progreso de este navegador. Puedes exportar una copia antes de continuar.{maps.length === 1 && ' Se cargará el mapa de ejemplo para mantener tu espacio disponible.'}</p><div className="delete-actions"><button className="button secondary" onClick={exportMap}><Download size={15} />Exportar copia</button><button className="button danger" onClick={deleteMap}><Trash2 size={15} />Eliminar módulo</button></div></Modal>}
  </div>
}
