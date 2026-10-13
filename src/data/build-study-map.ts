import type { AudioSample, KnowledgeMap, KnowledgeNode, StudyExercise } from '../types'
import { layoutNodes, summarize, tones } from '../lib/markdown'

export type StudyLesson = { id: string; title: string; content: string; exercise?: StudyExercise; audio?: AudioSample }
export type StudyStage = { id: string; title: string; content: string; lessons: StudyLesson[] }
export type StudyModule = { id: string; title: string; description: string; category: string; introduction: string; stages: StudyStage[] }

export function buildStudyMap(module: StudyModule): KnowledgeMap {
  const rootId = `${module.id}-root`
  const nodes: KnowledgeNode[] = [{ id: rootId, parentId: null, title: module.title, summary: module.description, content: module.introduction, question: '¿Cuál es tu siguiente paso y cómo comprobarás que lo has aprendido?', tone: 'violet', position: { x: 0, y: 0 } }]
  module.stages.forEach((stage, index) => {
    const parentId = `${module.id}-${stage.id}`
    const tone = tones[index % tones.length]
    nodes.push({ id: parentId, parentId: rootId, title: stage.title, summary: summarize(stage.content), content: stage.content, question: '¿Qué puedes hacer al terminar esta etapa? Explica un ejemplo concreto.', tone, position: { x: 0, y: 0 } })
    stage.lessons.forEach((lesson) => {
      const firstParagraph = lesson.content.split('\n').find((line) => line.trim() && !line.startsWith('#')) ?? lesson.title
      nodes.push({ id: `${module.id}-${lesson.id}`, parentId, title: lesson.title, summary: summarize(firstParagraph), content: lesson.content, question: lesson.exercise?.prompt.slice(0, 280) ?? `Explica «${lesson.title}» con un ejemplo propio.`, tone, position: { x: 0, y: 0 }, ...(lesson.exercise ? { exercise: lesson.exercise } : {}), ...(lesson.audio ? { audio: lesson.audio } : {}) })
    })
  })
  if (new Set(nodes.map((node) => node.id)).size !== nodes.length) throw new Error(`IDs duplicados en la ruta ${module.id}`)
  return { id: module.id, title: module.title, description: module.description, category: module.category, updatedAt: '2026-10-12T12:00:00.000Z', reviewedNodeIds: [], nodes: layoutNodes(nodes) }
}

export function firstStudyNode(map: KnowledgeMap): string {
  return (map.nodes.find((node) => node.parentId && map.nodes.some((parent) => parent.id === node.parentId && parent.parentId !== null)) ?? map.nodes.find((node) => node.parentId !== null) ?? map.nodes[0]).id
}
