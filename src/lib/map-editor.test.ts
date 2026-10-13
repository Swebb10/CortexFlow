import { describe, expect, it } from 'vitest'
import { addKnowledgeNode, branchIds, canReparent, editKnowledgeNode, removeKnowledgeBranch, reparentKnowledgeNode } from './map-editor'
import type { NodeDraft } from './map-editor'
import { createMapHistory, mapHistoryReducer } from './map-history'
import { isKnowledgeMap } from './storage'
import initialMap from './fixtures/example-map.json'
import type { KnowledgeMap } from '../types'

const freshMap = (): KnowledgeMap => structuredClone(initialMap) as KnowledgeMap
const draft = (parentId = 'cloud'): NodeDraft => ({ title: 'Contenedores', summary: 'Aplicaciones portátiles.', content: '## Docker\nAísla procesos y sus dependencias.', question: '¿En qué se diferencia de una máquina virtual?', parentId, tone: 'amber' })

describe('Editor de mapas', () => {
  it('añade un subconcepto conectado sin mover nodos existentes', () => {
    const original = freshMap()
    const result = addKnowledgeNode(original, draft(), 'containers')
    expect(result.nodes).toHaveLength(11)
    expect(result.nodes.at(-1)).toMatchObject({ id: 'containers', parentId: 'cloud', tone: 'blue' })
    expect(result.nodes.slice(0, -1)).toEqual(original.nodes)
    expect(original.nodes).toHaveLength(10)
    expect(isKnowledgeMap(result)).toBe(true)
  })
  it('permite elegir un color para una nueva rama de la raíz', () => {
    const result = addKnowledgeNode(freshMap(), draft('root'), 'new-branch')
    expect(result.nodes.at(-1)?.tone).toBe('amber')
  })
  it('genera una explicación y pregunta inicial si se dejan vacías', () => {
    const result = addKnowledgeNode(freshMap(), { ...draft(), title: '  Docker  ', content: '', summary: '', question: '' }, 'docker')
    expect(result.nodes.at(-1)).toMatchObject({ title: 'Docker', question: '¿Cómo explicarías «Docker» con tus propias palabras?' })
    expect(result.nodes.at(-1)?.content).toContain('## Docker')
  })
  it('rechaza padres inexistentes, IDs duplicados y títulos vacíos', () => {
    expect(() => addKnowledgeNode(freshMap(), draft('missing'), 'new')).toThrow('padre válido')
    expect(() => addKnowledgeNode(freshMap(), draft(), 'cloud')).toThrow('identificador')
    expect(() => addKnowledgeNode(freshMap(), { ...draft(), title: ' ' }, 'new')).toThrow('título')
  })
  it('mantiene el límite de nodos y una copia JSON exportable', () => {
    const map = freshMap()
    while (map.nodes.length < 100) map.nodes.push({ ...map.nodes[2], id: `extra-${map.nodes.length}`, parentId: 'root' })
    expect(() => addKnowledgeNode(map, draft(), 'new')).toThrow('100 conceptos')
    expect(() => addKnowledgeNode(freshMap(), { ...draft(), content: 'a'.repeat(1024 * 1024) }, 'new')).toThrow('1 MB')
  })
  it('editar la raíz actualiza también el nombre del módulo', () => {
    const map = freshMap()
    const root = map.nodes[0]
    const result = editKnowledgeNode(map, root.id, { ...root, title: 'Sistemas modernos', summary: 'De la idea al sistema.' })
    expect(result.title).toBe('Sistemas modernos')
    expect(result.description).toBe('De la idea al sistema.')
    expect(result.nodes[0].parentId).toBeNull()
    expect(result.nodes.slice(1).map((node) => node.tone)).toEqual(map.nodes.slice(1).map((node) => node.tone))
    expect(isKnowledgeMap(result)).toBe(true)
  })
  it('editar la explicación invalida solo el repaso de ese concepto', () => {
    const map = freshMap()
    map.reviewedNodeIds = ['cloud', 'http']
    const cloud = map.nodes.find((node) => node.id === 'cloud')!
    expect(editKnowledgeNode(map, 'cloud', { ...cloud, content: 'Una explicación nueva.' }).reviewedNodeIds).toEqual(['http'])
    expect(editKnowledgeNode(map, 'cloud', { ...cloud, summary: 'Otro resumen' }).reviewedNodeIds).toEqual(['cloud', 'http'])
  })
  it('reconectar una rama cambia el padre y el color de todos sus descendientes', () => {
    const result = reparentKnowledgeNode(freshMap(), 'cloud', 'networks')
    expect(result.nodes.find((node) => node.id === 'cloud')?.parentId).toBe('networks')
    expect(result.nodes.filter((node) => branchIds(result, 'cloud').has(node.id)).every((node) => node.tone === 'mint')).toBe(true)
    expect(isKnowledgeMap(result)).toBe(true)
  })
  it('impide ciclos, autoconexiones y mover la raíz', () => {
    const map = freshMap()
    expect(canReparent(map, 'cloud', 'scaling')).toBe(false)
    expect(canReparent(map, 'cloud', 'cloud')).toBe(false)
    expect(canReparent(map, 'root', 'cloud')).toBe(false)
    expect(canReparent(map, 'cloud', null)).toBe(false)
    expect(() => reparentKnowledgeNode(map, 'cloud', 'scaling')).toThrow('ciclo')
  })
  it('elimina una rama completa y su progreso sin dejar nodos huérfanos', () => {
    const map = freshMap()
    map.reviewedNodeIds = ['cloud', 'scaling', 'serverless', 'http']
    const result = removeKnowledgeBranch(map, 'cloud')
    expect(result.nodes).toHaveLength(7)
    expect(result.reviewedNodeIds).toEqual(['http'])
    expect(result.nodes.some((node) => ['cloud', 'scaling', 'serverless'].includes(node.id))).toBe(false)
    expect(isKnowledgeMap(result)).toBe(true)
    expect(() => removeKnowledgeBranch(map, 'root')).toThrow('idea central')
  })
})

describe('Historial por módulo', () => {
  it('deshace y rehace una eliminación con sus notas y progreso', () => {
    const map = freshMap()
    map.reviewedNodeIds = ['cloud', 'scaling']
    const initial = createMapHistory([map])
    const deleted = mapHistoryReducer(initial, { type: 'change', id: map.id, update: (current) => removeKnowledgeBranch(current, 'cloud') })
    const undone = mapHistoryReducer(deleted, { type: 'undo', id: map.id })
    expect(undone.maps[0]).toEqual(map)
    const redone = mapHistoryReducer(undone, { type: 'redo', id: map.id })
    expect(redone.maps[0]).toEqual(deleted.maps[0])
  })
  it('una nueva edición descarta el futuro y un cambio vacío no añade historial', () => {
    const map = freshMap()
    const state = createMapHistory([map])
    expect(mapHistoryReducer(state, { type: 'change', id: map.id, update: (current) => current })).toBe(state)
    expect(mapHistoryReducer(state, { type: 'change', id: map.id, update: (current) => ({ ...current, updatedAt: '2030-01-01T00:00:00.000Z' }) })).toBe(state)
    const added = mapHistoryReducer(state, { type: 'change', id: map.id, update: (current) => addKnowledgeNode(current, draft(), 'new') })
    const undone = mapHistoryReducer(added, { type: 'undo', id: map.id })
    const changed = mapHistoryReducer(undone, { type: 'change', id: map.id, update: (current) => removeKnowledgeBranch(current, 'scaling') })
    expect(changed.histories[map.id].future).toHaveLength(0)
  })
  it('deshacer un módulo conserva los cambios de otro', () => {
    const map = freshMap()
    const other = { ...freshMap(), id: 'other-map' }
    let state = createMapHistory([map, other])
    state = mapHistoryReducer(state, { type: 'change', id: map.id, update: (current) => addKnowledgeNode(current, draft(), 'first') })
    state = mapHistoryReducer(state, { type: 'change', id: other.id, update: (current) => addKnowledgeNode(current, draft(), 'second') })
    state = mapHistoryReducer(state, { type: 'undo', id: map.id })
    expect(state.maps[0].nodes).toHaveLength(10)
    expect(state.maps[1].nodes).toHaveLength(11)
  })
  it('reemplazar un módulo por el ejemplo no conserva su historial anterior', () => {
    const map = freshMap()
    const changed = mapHistoryReducer(createMapHistory([map]), { type: 'change', id: map.id, update: (current) => addKnowledgeNode(current, draft(), 'new') })
    const reset = mapHistoryReducer(changed, { type: 'set', update: [freshMap()] })
    expect(reset.histories[map.id]).toBeUndefined()
  })
})
