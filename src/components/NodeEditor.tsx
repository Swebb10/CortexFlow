import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Network, Plus, Save } from 'lucide-react'
import type { KnowledgeMap, KnowledgeNode, NodeTone } from '../types'
import { branchIds, nextBranchTone } from '../lib/map-editor'
import type { NodeDraft } from '../lib/map-editor'
import { Modal } from './Modal'
import { MarkdownContent } from './MarkdownContent'

export type NodeEditorTarget = { kind: 'create'; parentId: string } | { kind: 'edit'; nodeId: string }
type Props = { map: KnowledgeMap; target: NodeEditorTarget; onClose: () => void; onSave: (draft: NodeDraft) => void; error: string }
const colors: { id: NodeTone; name: string }[] = [{ id: 'blue', name: 'Azul' }, { id: 'mint', name: 'Menta' }, { id: 'amber', name: 'Ámbar' }, { id: 'violet', name: 'Violeta' }]
export function NodeEditor({ map, target, onClose, onSave, error }: Props) {
  const editing: KnowledgeNode | undefined = target.kind === 'edit' ? map.nodes.find((node) => node.id === target.nodeId) : undefined
  const [draft, setDraft] = useState<NodeDraft>(() => editing ? { title: editing.title, summary: editing.summary, content: editing.content, question: editing.question, parentId: editing.parentId, tone: editing.tone } : { title: '', summary: '', content: '', question: '', parentId: target.kind === 'create' ? target.parentId : null, tone: nextBranchTone(map) })
  const [preview, setPreview] = useState(false)
  const root = editing?.parentId === null
  const forbidden = editing ? branchIds(map, editing.id) : new Set<string>()
  const parent = map.nodes.find((node) => node.id === draft.parentId)
  const inheritedTone = parent && parent.parentId !== null
  const setField = <K extends keyof NodeDraft>(key: K, value: NodeDraft[K]) => setDraft((previous) => ({ ...previous, [key]: value }))
  function submit(event: FormEvent) { event.preventDefault(); onSave(draft) }
  return <Modal title={editing ? 'Editar concepto' : 'Añadir concepto'} onClose={onClose}>
    <p className="modal-description">{editing ? 'Actualiza tu idea, sus notas y su conexión con el mapa.' : 'Conecta una nueva idea. Elige su concepto padre y añade tus notas.'}</p>
    <form className="note-form node-editor-form" onSubmit={submit}>
      <label>Título del concepto<input autoFocus value={draft.title} onChange={(event) => setField('title', event.target.value)} placeholder="Ej. Contenedores y Docker" maxLength={100} required /></label>
      {!root && <label>Conectar con<select value={draft.parentId ?? ''} onChange={(event) => setField('parentId', event.target.value)} required>{map.nodes.filter((node) => !forbidden.has(node.id)).map((node) => <option key={node.id} value={node.id}>{node.parentId === null ? 'Idea central · ' : ''}{node.title}</option>)}</select></label>}
      <label>Resumen breve<input value={draft.summary} onChange={(event) => setField('summary', event.target.value)} placeholder="Una frase para recordar de qué trata" maxLength={160} /></label>
      <div className="editor-content-heading"><span>Explicación en Markdown</span><button type="button" className="editor-preview-toggle" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? 'Escribir' : 'Vista previa'}</button></div>
      {preview ? <div className="editor-markdown-preview"><MarkdownContent content={draft.content || '_Tu explicación aparecerá aquí._'} /></div> : <textarea aria-label="Explicación en Markdown" value={draft.content} onChange={(event) => setField('content', event.target.value)} rows={6} placeholder={'## ¿Qué es?\nEscribe tu explicación, ejemplos o código…'} spellCheck={false} />}
      <label>Pregunta para Active Recall<input value={draft.question} onChange={(event) => setField('question', event.target.value)} placeholder="Si lo dejas vacío, se genera una pregunta sobre el título" maxLength={300} /></label>
      {!root && <fieldset className="branch-color-picker"><legend>Color de rama</legend><div>{colors.map((color) => <button type="button" key={color.id} disabled={!!inheritedTone} className={`tone-${color.id}`} aria-label={`Color ${color.name}`} aria-pressed={(inheritedTone ? parent.tone : draft.tone) === color.id} onClick={() => setField('tone', color.id)}><i />{color.name}{(inheritedTone ? parent.tone : draft.tone) === color.id && <Check size={12} />}</button>)}</div>{inheritedTone && <p>Este subconcepto usa el color de «{parent.title}».</p>}</fieldset>}
      <p className="form-hint"><Network size={13} />{root ? 'El título también actualizará el nombre del módulo.' : `Se conectará con «${parent?.title ?? 'un concepto padre'}».`}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">{editing ? <Save size={15} /> : <Plus size={15} />}{editing ? 'Guardar cambios' : 'Añadir al mapa'}</button></div>
    </form>
  </Modal>
}
