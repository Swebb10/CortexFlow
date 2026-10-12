import { useState } from 'react'
import { ArrowRight, BookOpen, Brain, Check, CheckCheck, ChevronRight, Eye, EyeOff, Lightbulb, Network, X } from 'lucide-react'
import type { KnowledgeMap, KnowledgeNode } from '../types'
import { MarkdownContent } from './MarkdownContent'

type Props = { node: KnowledgeNode; map: KnowledgeMap; onReview: () => void; onNext: () => void; onClose: () => void; onSelect: (id: string) => void }
export function NodeInspector({ node, map, onReview, onNext, onClose, onSelect }: Props) {
  const [recall, setRecall] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const reviewed = map.reviewedNodeIds.includes(node.id)
  const parent = map.nodes.find((entry) => entry.id === node.parentId)
  const children = map.nodes.filter((entry) => entry.parentId === node.id)
  const hidden = recall && !revealed
  return <aside className="inspector" aria-label="Inspector de conceptos">
    <div className="inspector-heading"><span><BookOpen size={15} />EXPLORA EL CONCEPTO</span><button className="icon-button mobile-close" onClick={onClose} aria-label="Cerrar inspector"><X size={18} /></button><span className="inspector-pin"><span className="live-dot" />En lectura</span></div>
    <div className="inspector-scroll">
      <div className="inspector-breadcrumb">{parent ? <button onClick={() => onSelect(parent.id)}>{parent.title}</button> : <span>Idea central</span>}<ChevronRight size={11} /><span>Concepto</span></div>
      <div className={`inspector-node-icon tone-${node.tone}`}><Network size={24} strokeWidth={1.6} /></div>
      <h2>{node.title}</h2><p className="inspector-summary">{node.summary}</p>
      <div className="concept-meta"><span className={`tone-badge tone-${node.tone}`}><i />{node.parentId === null ? 'Idea central' : children.length ? 'Concepto clave' : 'Subconcepto'}</span>{reviewed && <span className="reviewed-badge"><CheckCheck size={12} />Repasado</span>}</div>
      <section className={`recall-card ${recall ? 'recall-on' : ''}`}><div><span className="recall-icon"><Brain size={18} /></span><span><strong>Active Recall</strong><small>Recuerda antes de releer.</small></span><button className="toggle" role="switch" aria-checked={recall} aria-label="Activar modo Active Recall" onClick={() => { setRecall(!recall); setRevealed(false) }}><span /></button></div>{recall && <p className="recall-question">{node.question}</p>}</section>
      <div className="detail-label"><span><BookOpen size={13} />NOTAS DEL CONCEPTO</span>{recall && <button onClick={() => setRevealed(!revealed)}>{revealed ? <EyeOff size={13} /> : <Eye size={13} />}{revealed ? 'Ocultar' : 'Mostrar'}</button>}</div>
      {hidden ? <div className="recall-hidden"><div><Brain size={28} /></div><h3>Deja que tu mente conecte.</h3><p>Explica este concepto en voz alta o escribe una respuesta antes de consultar tus notas.</p><button className="button secondary" onClick={() => setRevealed(true)}><Eye size={15} />Mostrar explicación</button></div> : <MarkdownContent content={node.content} />}
      {children.length > 0 && <section className="related-concepts"><div className="section-label"><Network size={13} />SIGUE LA CONEXIÓN</div>{children.map((child) => <button onClick={() => onSelect(child.id)} key={child.id}><span className={`related-dot tone-${child.tone}`} />{child.title}<ArrowRight size={14} /></button>)}</section>}
      <div className="study-tip"><Lightbulb size={16} /><p>Conecta este concepto con algo que ya conoces. Recordar empieza por relacionar.</p></div>
    </div>
    <div className="inspector-footer"><button className={`button ${reviewed ? 'secondary' : 'primary'}`} onClick={onReview} disabled={hidden}>{reviewed ? <CheckCheck size={16} /> : <Check size={16} />}{reviewed ? 'Marcar para repasar' : 'Marcar como repasado'}</button><button className="next-concept" onClick={onNext}>Siguiente concepto<ArrowRight size={15} /></button></div>
  </aside>
}
