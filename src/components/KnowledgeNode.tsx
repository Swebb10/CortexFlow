import { memo } from 'react'
import { Handle, NodeToolbar, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Box, Check, Cloud, Code2, GitBranch, Layers3, Network, Pencil, Plus, Trash2 } from 'lucide-react'
import type { FlowKnowledgeNode } from '../types'

export const KnowledgeNode = memo(function KnowledgeNode({ data, selected }: NodeProps<FlowKnowledgeNode>) {
  const root = data.parentId === null
  const Icon = root ? Layers3 : data.tone === 'blue' ? Cloud : data.tone === 'mint' ? Network : data.childCount ? GitBranch : Code2
  return <div className={`knowledge-node tone-${data.tone} ${root ? 'root-node' : ''} ${selected ? 'is-selected' : ''}`}>
    <NodeToolbar isVisible={selected} position={Position.Top} offset={12}><div className="node-edit-toolbar nodrag nopan"><button onClick={() => data.onAdd(data.id)} aria-label={`Añadir hijo a ${data.title}`} title="Añadir subconcepto"><Plus size={15} /><span>Añadir</span></button><button onClick={() => data.onEdit(data.id)} aria-label={`Editar ${data.title}`} title="Editar concepto"><Pencil size={14} /></button>{!root && <button onClick={() => data.onRemove(data.id)} aria-label={`Eliminar ${data.title}`} title="Eliminar rama"><Trash2 size={14} /></button>}</div></NodeToolbar>
    {!root && <Handle type="target" position={Position.Left} title="Conectar a un concepto padre" />}
    <div className="node-top"><span className="node-symbol"><Icon size={18} strokeWidth={1.7} /></span><span className="node-eyebrow">{root ? 'IDEA CENTRAL' : data.childCount ? 'CONCEPTO CLAVE' : 'SUBCONCEPTO'}</span>{data.reviewed && <span className="node-reviewed" title="Repasado"><Check size={13} /></span>}</div>
    <strong className="node-title">{data.title}</strong>
    {root && <p>{data.summary}</p>}
    {data.childCount > 0 && <div className="node-bottom"><Box size={11} /><span>{data.childCount} {data.childCount === 1 ? 'conexión' : 'conexiones'}</span><span className="node-read-dot" /></div>}
    <Handle type="source" position={Position.Right} title="Arrastra hacia otro nodo para conectarlo" />
  </div>
})
