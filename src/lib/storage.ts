import type { KnowledgeMap, KnowledgeNode } from '../types'

export function readStorage(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function writeStorage(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true } catch { return false }
}
export const MAPS_STORAGE_KEY = 'cortexflow:maps:v2'
export const MAX_SAVED_MAPS = 50
export const LEGACY_DEMO_IDS = new Set(['software-cloud', 'react-typescript', 'http-apis'])
const isString = (value: unknown): value is string => typeof value === 'string'
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function isNode(value: unknown): value is KnowledgeNode {
  if (!isRecord(value) || !isRecord(value.position)) return false
  if (value.exercise !== undefined && (!isRecord(value.exercise) || !isString(value.exercise.prompt) || !isString(value.exercise.answer) || (value.exercise.hint !== undefined && !isString(value.exercise.hint)))) return false
  if (value.audio !== undefined && (!isRecord(value.audio) || !['de-DE', 'ru-RU'].includes(String(value.audio.language)) || !isString(value.audio.text))) return false
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

export function decodeLibrary(raw: string | null): KnowledgeMap[] | null {
  try {
    const data: unknown = JSON.parse(raw ?? 'null')
    if (!Array.isArray(data) || data.length === 0 || data.length > MAX_SAVED_MAPS || !data.every(isKnowledgeMap)) return null
    if (new Set(data.map((map) => map.id)).size !== data.length) return null
    return data
  } catch { return null }
}
export function migrateLegacyMaps(legacy: KnowledgeMap[], curriculum: KnowledgeMap[]): KnowledgeMap[] {
  const personalMaps = legacy.filter((map) => !LEGACY_DEMO_IDS.has(map.id))
  const existingIds = new Set(personalMaps.map((map) => map.id))
  return [...curriculum.filter((map) => !existingIds.has(map.id)).slice(0, Math.max(0, MAX_SAVED_MAPS - personalMaps.length)), ...personalMaps]
}
export function loadMaps(fallback: KnowledgeMap[]): KnowledgeMap[] {
  const current = decodeLibrary(readStorage(MAPS_STORAGE_KEY))
  if (current) return current
  const legacy = decodeLibrary(readStorage('cortexflow:maps:v1'))
  return legacy ? migrateLegacyMaps(legacy, fallback) : fallback
}
export function saveMaps(maps: KnowledgeMap[]): boolean {
  return writeStorage(MAPS_STORAGE_KEY, JSON.stringify(maps))
}
