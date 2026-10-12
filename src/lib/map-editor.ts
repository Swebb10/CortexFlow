import type { KnowledgeMap, KnowledgeNode, NodeTone } from '../types'
import { MAX_FILE_BYTES, MAX_NODES, summarize, tones } from './markdown'

export type NodeDraft = Pick<KnowledgeNode, 'title' | 'summary' | 'content' | 'question' | 'parentId' | 'tone'>

export function branchIds(map: KnowledgeMap, id: string): Set<string> {
  const result = new Set<string>()
  const pending = [id]
  while (pending.length) {
    const current = pending.pop()!
    if (result.has(current)) continue
    result.add(current)
    pending.push(...map.nodes.filter((node) => node.parentId === current).map((node) => node.id))
  }
  return result
}

export function canReparent(map: KnowledgeMap, id: string, parentId: string | null): boolean {
  const node = map.nodes.find((entry) => entry.id === id)
  if (!node) return false
  if (node.parentId === null) return parentId === null
  return parentId !== null && map.nodes.some((entry) => entry.id === parentId) && !branchIds(map, id).has(parentId)
}

function normalizeDraft(draft: NodeDraft): NodeDraft {
  const title = draft.title.trim()
  if (!title || title.length > 100) throw new Error('El título debe tener entre 1 y 100 caracteres.')
  if (draft.summary.length > 160) throw new Error('El resumen no puede superar 160 caracteres.')
  if (draft.question.length > 300) throw new Error('La pregunta no puede superar 300 caracteres.')
  const content = draft.content.trim() || `## ${title}\n\nAñade una explicación con tus propias palabras.`
  return { ...draft, title, content, summary: draft.summary.trim() || summarize(content), question: draft.question.trim() || `¿Cómo explicarías «${title}» con tus propias palabras?` }
}

function assertMapSize(map: KnowledgeMap): KnowledgeMap {
  if (new TextEncoder().encode(JSON.stringify(map, null, 2)).length > MAX_FILE_BYTES) {
    throw new Error('Este mapa supera 1 MB. Divide el contenido en módulos para poder guardarlo y exportarlo.')
  }
  return map
}

function branchTone(map: KnowledgeMap, parentId: string | null, preferred: NodeTone): NodeTone {
  if (parentId === null) return 'violet'
  const parent = map.nodes.find((node) => node.id === parentId)!
  return parent.parentId === null ? preferred : parent.tone
}

export function nextBranchTone(map: KnowledgeMap): NodeTone {
  return tones[map.nodes.filter((node) => node.parentId === map.nodes.find((entry) => entry.parentId === null)?.id).length % tones.length]
}

/** Añade un nodo sin redistribuir los que el usuario ya ha colocado. */
export function addKnowledgeNode(map: KnowledgeMap, draft: NodeDraft, id: string): KnowledgeMap {
  if (map.nodes.length >= MAX_NODES) throw new Error(`Este módulo ya tiene ${MAX_NODES} conceptos. Crea otro módulo para continuar.`)
  if (map.nodes.some((node) => node.id === id)) throw new Error('Este identificador de concepto ya existe.')
  const parent = map.nodes.find((node) => node.id === draft.parentId)
  if (!parent) throw new Error('Selecciona un concepto padre válido.')
  const values = normalizeDraft(draft)
  const x = parent.position.x + 305
  const children = map.nodes.filter((node) => node.parentId === parent.id)
  let y = children.length ? Math.max(...children.map((node) => node.position.y)) + 150 : parent.position.y
  while (map.nodes.some((node) => Math.abs(node.position.x - x) < 250 && Math.abs(node.position.y - y) < 150)) y += 150
  const node: KnowledgeNode = { ...values, id, parentId: parent.id, tone: branchTone(map, parent.id, values.tone), position: { x, y } }
  return assertMapSize({ ...map, nodes: [...map.nodes, node] })
}

export function editKnowledgeNode(map: KnowledgeMap, id: string, draft: NodeDraft): KnowledgeMap {
  const current = map.nodes.find((node) => node.id === id)
  if (!current) throw new Error('No se encontró el concepto que intentas editar.')
  if (!canReparent(map, id, draft.parentId)) throw new Error('Esa conexión crearía un ciclo o dejaría el mapa sin una raíz válida.')
  const values = normalizeDraft(draft)
  const tone = branchTone(map, values.parentId, values.tone)
  const descendants = branchIds(map, id)
  const recolorBranch = current.parentId !== null && current.tone !== tone
  const contentChanged = current.title !== values.title || current.content !== values.content || current.question !== values.question
  return assertMapSize({
    ...map,
    ...(current.parentId === null ? { title: values.title, description: values.summary } : {}),
    nodes: map.nodes.map((node) => node.id === id ? { ...node, ...values, tone } : recolorBranch && descendants.has(node.id) ? { ...node, tone } : node),
    reviewedNodeIds: contentChanged ? map.reviewedNodeIds.filter((reviewedId) => reviewedId !== id) : map.reviewedNodeIds,
  })
}

export function reparentKnowledgeNode(map: KnowledgeMap, id: string, parentId: string): KnowledgeMap {
  const node = map.nodes.find((entry) => entry.id === id)
  if (!node) throw new Error('El concepto no existe.')
  if (node.parentId === parentId) return map
  return editKnowledgeNode(map, id, { ...node, parentId })
}

export function removeKnowledgeBranch(map: KnowledgeMap, id: string): KnowledgeMap {
  const node = map.nodes.find((entry) => entry.id === id)
  if (!node) throw new Error('El concepto no existe.')
  if (node.parentId === null) throw new Error('La idea central se conserva. Puedes editarla o eliminar el módulo completo.')
  const removed = branchIds(map, id)
  return { ...map, nodes: map.nodes.filter((entry) => !removed.has(entry.id)), reviewedNodeIds: map.reviewedNodeIds.filter((reviewedId) => !removed.has(reviewedId)) }
}
