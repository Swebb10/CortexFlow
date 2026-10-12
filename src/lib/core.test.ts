import { describe, expect, it } from 'vitest'
import { layoutNodes, markdownToMap } from './markdown'
import { advanceTimer, durations, freshTimer, loadTimer } from './timer'
import { isKnowledgeMap } from './storage'
import initialMap from '../data/initial-map.json'
import type { KnowledgeMap } from '../types'

describe('Markdown a mapa', () => {
  it('mantiene la jerarquía, títulos y explicaciones', () => {
    const map = markdownToMap('# Cloud\nIntroducción\n## Redes\nTCP\n### HTTP\nContrato\n## Diseño\nSOLID', 'nota.md', 'test')
    expect(map.title).toBe('Cloud')
    expect(map.nodes.map((node) => node.title)).toEqual(['Cloud', 'Redes', 'HTTP', 'Diseño'])
    expect(map.nodes[2].parentId).toBe(map.nodes[1].id)
    expect(map.nodes[3].parentId).toBe(map.nodes[0].id)
    expect(map.nodes[0].content).toBe('Introducción')
    expect(isKnowledgeMap(map)).toBe(true)
  })
  it('ignora encabezados dentro de bloques de código', () => {
    const map = markdownToMap('# Test\n## Código\n````md\n# no es nodo\n```\n## sigue en código\n````\n## Final', 'nota.md', 'test')
    expect(map.nodes.map((node) => node.title)).toEqual(['Test', 'Código', 'Final'])
    expect(map.nodes[1].content).toContain('## sigue en código')
  })
  it('soporta saltos de nivel y encabezados sin título principal', () => {
    const map = markdownToMap('### Primer concepto\nUno\n## Segundo concepto\nDos', 'Importada.txt', 'test')
    expect(map.nodes[0].title).toBe('Importada')
    expect(map.nodes[1].parentId).toBe(map.nodes[0].id)
    expect(map.nodes[2].parentId).toBe(map.nodes[0].id)
  })
  it('organiza el texto sin encabezados por párrafos', () => {
    const map = markdownToMap('Una idea.\n\nOtra idea.', 'texto.txt', 'test')
    expect(map.nodes).toHaveLength(3)
    expect(map.nodes[1].content).toBe('Una idea.')
  })
  it('rechaza archivos vacíos y árboles que exceden el límite', () => {
    expect(() => markdownToMap('  ', 'empty.md', 'test')).toThrow('vacío')
    expect(() => markdownToMap('# Root\n' + Array.from({ length: 100 }, (_, i) => `## Node ${i}`).join('\n'), 'large.md', 'test')).toThrow('100 conceptos')
  })
  it('asigna posiciones finitas y separa hojas', () => {
    const map = structuredClone(initialMap) as KnowledgeMap
    const nodes = layoutNodes(map.nodes)
    const leaves = nodes.filter((node) => !nodes.some((child) => child.parentId === node.id))
    expect(new Set(leaves.map((node) => node.position.y)).size).toBe(leaves.length)
    expect(nodes.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y))).toBe(true)
  })
})
describe('Persistencia y copias', () => {
  it('acepta el mock y rechaza ciclos, huérfanos y coordenadas inválidas', () => {
    expect(isKnowledgeMap(initialMap)).toBe(true)
    const cycle = structuredClone(initialMap)
    cycle.nodes[1].parentId = cycle.nodes[2].id
    expect(isKnowledgeMap(cycle)).toBe(false)
    const orphan = structuredClone(initialMap)
    orphan.nodes[1].parentId = 'missing'
    expect(isKnowledgeMap(orphan)).toBe(false)
    const invalid = structuredClone(initialMap)
    invalid.nodes[0].position.x = Infinity
    expect(isKnowledgeMap(invalid)).toBe(false)
  })
})
describe('Pomodoro por fecha de vencimiento', () => {
  it('recupera el tiempo real después de una pestaña inactiva', () => {
    const state = { ...freshTimer(), running: true, endAt: 1_500_000 }
    expect(advanceTimer(state, 600_000).remaining).toBe(900)
  })
  it('finaliza una sesión una sola vez y deja el descanso pausado', () => {
    const state = { ...freshTimer(), running: true, endAt: 1000 }
    const finished = advanceTimer(state, 1001)
    expect(finished).toEqual({ mode: 'break', remaining: 300, running: false, endAt: null, completed: 1 })
    expect(advanceTimer(finished, 999999).completed).toBe(1)
  })
  it('el descanso vuelve a enfoque sin sumar una sesión', () => {
    expect(advanceTimer({ mode: 'break', remaining: 1, running: true, endAt: 1000, completed: 2 }, 1001)).toEqual({ mode: 'focus', remaining: durations.focus, running: false, endAt: null, completed: 2 })
  })
  it('restaura sesiones expiradas y tolera datos corruptos', () => {
    expect(loadTimer('oops', 1000)).toEqual(freshTimer())
    expect(loadTimer(JSON.stringify({ ...freshTimer(), remaining: -1 }), 1000)).toEqual(freshTimer())
    expect(loadTimer(JSON.stringify({ ...freshTimer(), running: true, endAt: 500 }), 1000).mode).toBe('break')
  })
})
