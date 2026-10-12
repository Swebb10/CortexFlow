import type { Node, XYPosition } from '@xyflow/react'

export type NodeTone = 'violet' | 'blue' | 'mint' | 'amber'
export type KnowledgeNode = {
  id: string
  parentId: string | null
  title: string
  summary: string
  content: string
  question: string
  tone: NodeTone
  position: XYPosition
}
export type KnowledgeMap = {
  id: string
  title: string
  description: string
  category: string
  updatedAt: string
  nodes: KnowledgeNode[]
  reviewedNodeIds: string[]
}
export type KnowledgeNodeData = KnowledgeNode & {
  reviewed: boolean
  childCount: number
  onAdd: (parentId: string) => void
  onEdit: (id: string) => void
  onRemove: (id: string) => void
}
export type FlowKnowledgeNode = Node<KnowledgeNodeData, 'knowledge'>
