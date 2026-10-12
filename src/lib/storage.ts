import type { KnowledgeMap, KnowledgeNode } from '../types'

export function readStorage(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function writeStorage(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true } catch { return false }
}
const isString = (value: unknown): value is string => typeof value === 'string'
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function isNode(value: unknown): value is KnowledgeNode {
  if (!isRecord(value) || !isRecord(value.position)) return false
  return ['id','title','summary','content','question'].every((key) => isString(value[key]))
    && (value.parentId === null || isString(value.parentId))
    && ['violet','blue','mint','amber'].includes(String(value.tone))
    && typeof value.position.x === 'number' && Number.isFinite(value.position.x)
    && typeof value.position.y === 'number' && Number.isFinite(value.position.y)
}

export function isKnowledgeMap(value: unknown): value is KnowledgeMap {
  if (!isRecord(value) || !['id','title','description','category','updatedAt'].every((key) => isString(value[key]))) return false
  if (!Array.isArray(value.nodes) || value.nodes.length < 1 || value.nodes.length > 100 || !value.nodes.every(isNode)) return false
  const nodes = value.nodes as KnowledgeNode[]
  const ids = new Set(nodes.map((node) => node.id))
  if (ids.size !== nodes.length || nodes.filter((node) => node.parentId === null).length !== 1) return false
  if (!Array.isArray(value.reviewedNodeIds) || !value.reviewedNodeIds.every((id) => isString(id) && ids.has(id))) return false
  for (const node of nodes) {
    const ancestors = new Set([node.id])
    let parent = node.parentId
    while (parent !== null) {
      if (!ids.has(parent) || ancestors.has(parent)) return false
      ancestors.add(parent)
      parent = nodes.find((candidate) => candidate.id === parent)!.parentId
    }
  }
  return true
}

export function loadMaps(fallback: KnowledgeMap[]): KnowledgeMap[] {
  try {
    const raw = readStorage('cortexflow:maps:v1')
    if (!raw) return fallback
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data) || data.length === 0 || data.length > 30 || !data.every(isKnowledgeMap)) return fallback
    if (new Set(data.map((map) => map.id)).size !== data.length) return fallback
    return data
  } catch { return fallback }
}
