import type { KnowledgeMap } from '../types'

type History = { past: KnowledgeMap[]; future: KnowledgeMap[] }
export type MapHistoryState = { maps: KnowledgeMap[]; histories: Record<string, History> }
export type MapHistoryAction =
  | { type: 'set'; update: KnowledgeMap[] | ((previous: KnowledgeMap[]) => KnowledgeMap[]) }
  | { type: 'change'; id: string; update: (previous: KnowledgeMap) => KnowledgeMap }
  | { type: 'undo' | 'redo'; id: string }
export function createMapHistory(maps: KnowledgeMap[]): MapHistoryState { return { maps, histories: {} } }

export function mapHistoryReducer(state: MapHistoryState, action: MapHistoryAction): MapHistoryState {
  if (action.type === 'set') {
    const maps = typeof action.update === 'function' ? action.update(state.maps) : action.update
    const histories = Object.fromEntries(Object.entries(state.histories).filter(([id]) => maps.find((map) => map.id === id) === state.maps.find((map) => map.id === id)))
    return { maps, histories }
  }
  const current = state.maps.find((map) => map.id === action.id)
  if (!current) return state
  const history = state.histories[action.id] ?? { past: [], future: [] }
  let next: KnowledgeMap
  let updated: History
  if (action.type === 'change') {
    next = action.update(current)
    if (next === current || JSON.stringify({ ...next, updatedAt: current.updatedAt }) === JSON.stringify(current)) return state
    updated = { past: [...history.past, current].slice(-30), future: [] }
  } else if (action.type === 'undo') {
    const previous = history.past.at(-1)
    if (!previous) return state
    next = previous
    updated = { past: history.past.slice(0, -1), future: [current, ...history.future] }
  } else {
    const future = history.future[0]
    if (!future) return state
    next = future
    updated = { past: [...history.past, current].slice(-30), future: history.future.slice(1) }
  }
  return { maps: state.maps.map((map) => map.id === action.id ? next : map), histories: { ...state.histories, [action.id]: updated } }
}
