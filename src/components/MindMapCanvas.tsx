import { useEffect, useMemo, useState } from 'react'
import { Background, BackgroundVariant, MiniMap, Panel, ReactFlow, ReactFlowProvider, useNodesState, useReactFlow, useViewport } from '@xyflow/react'
import type { Edge, XYPosition } from '@xyflow/react'
import { Check, Hand, LocateFixed, Map, Minus, MousePointer2, Plus } from 'lucide-react'
import type { FlowKnowledgeNode, KnowledgeMap } from '../types'
import { KnowledgeNode } from './KnowledgeNode'
import { useTheme } from '../context/ThemeContext'

const nodeTypes = { knowledge: KnowledgeNode }
type Props = { map: KnowledgeMap; selectedId: string; onSelect: (id: string) => void; onMove: (id: string, position: XYPosition) => void; focusId: string | null }
function MapControls({ minimap, onMinimap }: { minimap: boolean; onMinimap: () => void }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { zoom } = useViewport()
  return <Panel position="bottom-left" className="canvas-tools"><button aria-label="Alejar mapa" title="Alejar" onClick={() => zoomOut({ duration: 200 })}><Minus size={16} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Acercar mapa" title="Acercar" onClick={() => zoomIn({ duration: 200 })}><Plus size={16} /></button><i /><button aria-label="Ajustar mapa a pantalla" title="Ajustar a pantalla" onClick={() => fitView({ padding: 0.18, duration: 350 })}><LocateFixed size={17} /></button><button aria-label="Alternar minimapa" title="Minimapa" aria-pressed={minimap} onClick={onMinimap}><Map size={16} /></button></Panel>
}
function FocusNode({ id }: { id: string | null }) {
  const flow = useReactFlow()
  useEffect(() => { if (id) void flow.fitView({ nodes: [{ id }], maxZoom: 1.2, padding: 1, duration: 450 }) }, [id, flow])
  return null
}
function Canvas(props: Props) {
  const { map, selectedId, onSelect, onMove, focusId } = props
  const { theme } = useTheme()
  const [minimap, setMinimap] = useState(false)
  const flowNodes = useMemo<FlowKnowledgeNode[]>(() => map.nodes.map((node) => ({ id: node.id, type: 'knowledge', ariaRole: 'button', ariaLabel: `Explorar ${node.title}`, position: node.position, selected: selectedId === node.id, data: { ...node, reviewed: map.reviewedNodeIds.includes(node.id), childCount: map.nodes.filter((child) => child.parentId === node.id).length } })), [map, selectedId])
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowKnowledgeNode>(flowNodes)
  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  const edges = useMemo<Edge[]>(() => map.nodes.filter((node) => node.parentId).map((node) => ({ id: `edge-${node.id}`, source: node.parentId!, target: node.id, type: 'default', style: { stroke: `var(--${node.tone})`, strokeWidth: selectedId === node.id ? 2.4 : 1.5, opacity: selectedId === node.id ? 0.95 : 0.42 } })), [map.nodes, selectedId])
  return <ReactFlow<FlowKnowledgeNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={(changes) => {
    onNodesChange(changes)
    for (const change of changes) {
      if (change.type === 'select' && change.selected) onSelect(change.id)
      if (change.type === 'position' && change.position && change.dragging === false) onMove(change.id, change.position)
    }
  }} onNodeClick={(_, node) => onSelect(node.id)} onNodeDragStop={(_, node) => onMove(node.id, node.position)} fitView fitViewOptions={{ padding: 0.13, maxZoom: 1 }} minZoom={0.15} maxZoom={2} nodesConnectable={false} edgesFocusable={false} deleteKeyCode={null} colorMode={theme === 'light' ? 'light' : 'dark'} panOnScroll zoomOnScroll={false} zoomOnPinch preventScrolling aria-label="Mapa mental interactivo" proOptions={{ hideAttribution: false }}>
    <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--canvas-dot)" />
    <FocusNode id={focusId} />
    <Panel position="top-left" className="canvas-legend"><span><i className="legend-root" />Idea central</span><span><i className="legend-concept" />Conceptos</span><span><i className="legend-leaf" />Subconceptos</span></Panel>
    <Panel position="top-right" className="canvas-save"><Check size={12} />Cambios locales</Panel>
    <MapControls minimap={minimap} onMinimap={() => setMinimap(!minimap)} />
    {minimap && <MiniMap nodeColor={(node) => `var(--${(node.data as FlowKnowledgeNode['data']).tone})`} maskColor="var(--minimap-mask)" pannable zoomable />}
    <Panel position="bottom-center" className="canvas-hint"><MousePointer2 size={12} /><span>Selecciona para explorar</span><i /><Hand size={12} /><span>Arrastra para mover</span></Panel>
  </ReactFlow>
}
export function MindMapCanvas(props: Props) {
  return <div className="mindmap-canvas"><ReactFlowProvider key={props.map.id}><Canvas {...props} /></ReactFlowProvider></div>
}
