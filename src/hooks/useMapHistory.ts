import { useCallback, useReducer } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { KnowledgeMap } from '../types'
import { createMapHistory, mapHistoryReducer } from '../lib/map-history'

export function useMapHistory(initializer: () => KnowledgeMap[]) {
  const [state, dispatch] = useReducer(mapHistoryReducer, undefined, () => createMapHistory(initializer()))
  const setMaps: Dispatch<SetStateAction<KnowledgeMap[]>> = useCallback((update) => dispatch({ type: 'set', update }), [])
  const changeMap = useCallback((id: string, update: (previous: KnowledgeMap) => KnowledgeMap) => dispatch({ type: 'change', id, update }), [])
  const undo = useCallback((id: string) => dispatch({ type: 'undo', id }), [])
  const redo = useCallback((id: string) => dispatch({ type: 'redo', id }), [])
  return { maps: state.maps, histories: state.histories, setMaps, changeMap, undo, redo }
}
