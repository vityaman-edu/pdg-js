import Dagre from '@dagrejs/dagre'
import { type Node, type Edge } from '@xyflow/react'

export const layout = (nodes: Node[], edges: Edge[]) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({})
  edges
    .filter(edge => edge.label != 'depends')
    .forEach(edge => g.setEdge(edge.source, edge.target))
  nodes.forEach(node => g.setNode(node.id, {
    ...node,
    width: node.measured?.width ?? 0,
    height: node.measured?.height ?? 0,
  }))

  Dagre.layout(g)

  return nodes.map((node) => {
    const p = g.node(node.id)
    const x = p.x - (node.measured?.width ?? 0) / 4
    const y = p.y - (node.measured?.height ?? 0) / 4
    return { ...node, position: { x, y } }
  })
}
