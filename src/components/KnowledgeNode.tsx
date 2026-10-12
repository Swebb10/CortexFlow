import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Box, Check, Cloud, Code2, GitBranch, Layers3, Network } from 'lucide-react'
import type { FlowKnowledgeNode } from '../types'

export const KnowledgeNode = memo(function KnowledgeNode({ data, selected }: NodeProps<FlowKnowledgeNode>) {
  const root = data.parentId === null
  const Icon = root ? Layers3 : data.tone === 'blue' ? Cloud : data.tone === 'mint' ? Network : data.childCount ? GitBranch : Code2
  return <div className={`knowledge-node tone-${data.tone} ${root ? 'root-node' : ''} ${selected ? 'is-selected' : ''}`}>
    {!root && <Handle type="target" position={Position.Left} isConnectable={false} />}
    <div className="node-top"><span className="node-symbol"><Icon size={18} strokeWidth={1.7} /></span><span className="node-eyebrow">{root ? 'IDEA CENTRAL' : data.childCount ? 'CONCEPTO CLAVE' : 'SUBCONCEPTO'}</span>{data.reviewed && <span className="node-reviewed" title="Repasado"><Check size={13} /></span>}</div>
    <strong className="node-title">{data.title}</strong>
    {root && <p>{data.summary}</p>}
    {data.childCount > 0 && <div className="node-bottom"><Box size={11} /><span>{data.childCount} conexiones</span><span className="node-read-dot" /></div>}
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </div>
})
