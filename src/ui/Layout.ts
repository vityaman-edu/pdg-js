import Dagre from '@dagrejs/dagre'
import {
  type GraphNode,
  type GraphEdge,
} from './Graph'

export const getLayoutedElements = (
  nodes: GraphNode[],
  edges: GraphEdge[],
): {
  nodes: GraphNode[]
  edges: GraphEdge[]
} => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ })

  edges.forEach(edge =>
    g.setEdge(edge.source, edge.target),
  )
  nodes.forEach(node =>
    g.setNode(node.id, {
      ...node,
      width: node?.width ?? 100,
      height: node?.height ?? 100,
    }),
  )

  Dagre.layout(g)

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id)
      const x = position.x - (node?.width ?? 100) * 2
      const y = position.y - (node?.height ?? 100) * 2
      return { ...node, position: { x, y } }
    }),
    edges,
  }
}
