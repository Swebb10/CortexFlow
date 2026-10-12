import type { KnowledgeMap, KnowledgeNode, NodeTone } from '../types'

export const MAX_FILE_BYTES = 1024 * 1024
export const MAX_NODES = 100
export const tones: NodeTone[] = ['blue', 'mint', 'amber']
export function summarize(content: string): string {
  return content.replace(/[#*`>\[\]_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 95) || 'Explora este concepto y sus conexiones.'
}

/** Distribuye el árbol por columnas; centra cada padre entre sus hijos. */
export function layoutNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
  const positions = new Map<string, { x: number; y: number }>()
  let row = 0
  function visit(node: KnowledgeNode, depth: number): number {
    const children = nodes.filter((child) => child.parentId === node.id)
    const ys = children.map((child) => visit(child, depth + 1))
    const y = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 : row++ * 115
    positions.set(node.id, { x: depth * 305, y })
    return y
  }
  nodes.filter((node) => node.parentId === null).forEach((node) => visit(node, 0))
  return nodes.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position }))
}

/** Parser estructural local: encabezados ATX y párrafos; respeta bloques de código. */
export function markdownToMap(markdown: string, filename: string, id: string): KnowledgeMap {
  if (!markdown.trim()) throw new Error('El archivo está vacío. Añade texto o encabezados antes de importarlo.')
  const title = filename.replace(/\.(md|markdown|txt)$/i, '') || 'Nueva nota'
  const root: KnowledgeNode = { id: `${id}-root`, parentId: null, title, summary: '', content: '', question: '', tone: 'violet', position: { x: 0, y: 0 } }
  const nodes: KnowledgeNode[] = [root]
  const stack = [{ level: 0, node: root }]
  let current = root
  let fence: { marker: string; length: number } | null = null
  let headingCount = 0
  let branchCount = 0
  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      const sequence = fenceMatch[1]
      if (!fence) fence = { marker: sequence[0], length: sequence.length }
      else if (sequence[0] === fence.marker && sequence.length >= fence.length && /^\s{0,3}(`+|~+)\s*$/.test(line)) fence = null
      current.content += `${line}\n`
      continue
    }
    const heading = !fence ? line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/) : null
    if (!heading) { current.content += `${line}\n`; continue }
    const level = heading[1].length
    const label = heading[2].trim()
    if (headingCount++ === 0 && level === 1) { root.title = label; current = root; continue }
    if (nodes.length >= MAX_NODES) throw new Error(`Este archivo supera los ${MAX_NODES} conceptos. Divídelo en módulos más pequeños.`)
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop()
    const parent = stack[stack.length - 1].node
    const tone = parent === root ? tones[branchCount++ % tones.length] : parent.tone
    current = { id: `${id}-${nodes.length}`, parentId: parent.id, title: label, content: '', summary: '', question: '', tone, position: { x: 0, y: 0 } }
    nodes.push(current)
    stack.push({ level, node: current })
  }
  if (nodes.length === 1 && headingCount === 0) {
    const paragraphs = root.content.trim().split(/\n\s*\n/).filter(Boolean)
    if (paragraphs.length > 1) {
      if (paragraphs.length >= MAX_NODES) throw new Error(`Este texto supera los ${MAX_NODES - 1} párrafos. Divídelo en módulos más pequeños.`)
      paragraphs.forEach((paragraph, index) => nodes.push({ id: `${id}-${index}`, parentId: root.id, title: `Idea ${index + 1}`, summary: '', content: paragraph, question: '', tone: tones[index % tones.length], position: { x: 0, y: 0 } }))
    }
  }
  nodes.forEach((node) => {
    node.content = node.content.trim() || `## ${node.title}\n\nExplora los conceptos conectados para ampliar esta idea.`
    node.summary = summarize(node.content)
    node.question = `¿Cómo explicarías «${node.title}» con tus propias palabras?`
  })
  return { id, title: root.title, description: 'Tu nota, convertida en conexiones.', category: 'Nota importada', updatedAt: new Date().toISOString(), nodes: layoutNodes(nodes), reviewedNodeIds: [] }
}
