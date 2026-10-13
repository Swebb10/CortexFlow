import { afterEach, describe, expect, it, vi } from 'vitest'
import { firstStudyNode } from '../data/build-study-map'
import { studyMaps, studyModules } from '../data/study-library'
import { MAX_FILE_BYTES } from './markdown'
import { decodeLibrary, isKnowledgeMap, loadMaps, MAPS_STORAGE_KEY, MAX_SAVED_MAPS, migrateLegacyMaps, saveMaps } from './storage'
import fixture from './fixtures/example-map.json'
import type { KnowledgeMap } from '../types'

const personal = (id = 'personal'): KnowledgeMap => ({ ...structuredClone(fixture) as KnowledgeMap, id, title: 'Mis apuntes', reviewedNodeIds: [fixture.nodes[1].id] })
function storage() {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
  return data
}
afterEach(() => vi.unstubAllGlobals())

describe('Biblioteca de estudio y copias', () => {
  it('todos los módulos se pueden exportar, importar y ampliar sin superar límites', () => {
    expect(studyMaps).toHaveLength(7)
    for (const map of studyMaps) {
      const serialized = JSON.stringify(map, null, 2)
      expect(isKnowledgeMap(JSON.parse(serialized))).toBe(true)
      expect(new TextEncoder().encode(serialized).length).toBeLessThan(MAX_FILE_BYTES)
      expect(map.nodes.length).toBeLessThan(100)
      expect(map.nodes.find((node) => node.id === firstStudyNode(map))!.exercise).toBeDefined()
    }
    expect(studyModules.flatMap((module) => module.stages.flatMap((stage) => stage.lessons))).toHaveLength(144)
  })
  it('mantiene ejercicio y audio de idioma en las copias y rechaza formas corruptas', () => {
    const map = structuredClone(studyMaps[1])
    const lesson = map.nodes.find((node) => node.audio)!
    expect(isKnowledgeMap(map)).toBe(true)
    expect(lesson.audio?.language).toBe('de-DE')
    expect(isKnowledgeMap({ ...map, nodes: map.nodes.map((node) => node.id === lesson.id ? { ...node, exercise: { prompt: 'Prueba', answer: 42 } } : node) })).toBe(false)
    expect(isKnowledgeMap({ ...map, nodes: map.nodes.map((node) => node.id === lesson.id ? { ...node, audio: { language: 'es-ES', text: 'Error' } } : node) })).toBe(false)
  })
  it('cada idioma tiene las cinco etapas y ejercicios en todas sus lecciones', () => {
    for (const module of studyModules.filter((entry) => entry.category === 'Idiomas')) {
      expect(module.stages.map((stage) => stage.id)).toEqual(['pre-a1', 'a1', 'a2', 'b1', 'b2'])
      expect(module.stages.flatMap((stage) => stage.lessons).every((lesson) => lesson.exercise && lesson.audio)).toBe(true)
    }
  })
})

describe('Migración de ejemplos a rutas personales', () => {
  it('retira los tres ejemplos y conserva sin alterar los módulos personales', () => {
    const own = personal()
    const legacy = ['software-cloud', 'react-typescript', 'http-apis'].map((id) => personal(id)).concat(own)
    const migrated = migrateLegacyMaps(legacy, studyMaps)
    expect(migrated.map((map) => map.id)).toEqual([...studyMaps.map((map) => map.id), 'personal'])
    expect(migrated.at(-1)).toBe(own)
    expect(migrated.at(-1)?.reviewedNodeIds).toEqual(own.reviewedNodeIds)
  })
  it('conserva una ruta ya editada y no duplica IDs durante la migración', () => {
    const edited = { ...structuredClone(studyMaps[0]), title: 'Mi ruta Cloud editada' }
    const migrated = migrateLegacyMaps([edited], studyMaps)
    expect(migrated).toHaveLength(7)
    expect(migrated.filter((map) => map.id === edited.id)).toEqual([edited])
    expect(decodeLibrary(JSON.stringify(migrated))).not.toBeNull()
  })
  it('una biblioteca v2 tiene prioridad: no resucita rutas eliminadas ni pisa ediciones', () => {
    const data = storage()
    data.set('cortexflow:maps:v1', JSON.stringify([personal('software-cloud')]))
    const own = personal()
    expect(saveMaps([own])).toBe(true)
    expect(data.has(MAPS_STORAGE_KEY)).toBe(true)
    expect(loadMaps(studyMaps)).toEqual([own])
  })
  it('migra v1 cuando v2 no existe o está corrupta y conserva v1 como respaldo', () => {
    const data = storage()
    const oldRaw = JSON.stringify([personal('software-cloud'), personal()])
    data.set('cortexflow:maps:v1', oldRaw)
    data.set(MAPS_STORAGE_KEY, '{corrupto')
    expect(loadMaps(studyMaps)).toHaveLength(8)
    expect(data.get('cortexflow:maps:v1')).toBe(oldRaw)
  })
  it('no desborda la biblioteca ni descarta módulos personales en una migración llena', () => {
    const own = Array.from({ length: MAX_SAVED_MAPS }, (_, index) => personal(`personal-${index}`))
    const migrated = migrateLegacyMaps(own, studyMaps)
    expect(migrated).toEqual(own)
    expect(decodeLibrary(JSON.stringify(migrated))).not.toBeNull()
  })
  it('rechaza IDs duplicados y tolera almacenamiento inaccesible', () => {
    expect(decodeLibrary(JSON.stringify([personal(), personal()]))).toBeNull()
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('lleno') } })
    expect(loadMaps(studyMaps)).toBe(studyMaps)
    expect(saveMaps(studyMaps)).toBe(false)
  })
})
