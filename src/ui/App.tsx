import { MonacoEditor } from './MonacoEditor'
import {
  Graph,
  type GraphState,
  type GraphNode,
  type GraphEdge,
} from './Graph'
import {
  getLayoutedElements,
} from './Layout'
import { useNodesState, useEdgesState, type NodeChange, MarkerType } from '@xyflow/react'
import { play } from '../pdg/playground'
import './App.css'
import {
  forEachBasicBlock,
  toString,
  type BasicBlock,
} from '../pdg/bb'

export const App = () => {
  const [nodes, setNodes] = useNodesState<GraphNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([])

  const onNodesChange = (changes: NodeChange[]) => {
    changes.forEach((change: NodeChange) => {
      if (change.type !== 'dimensions') {
        return
      }

      const i = nodes.findIndex(n => n.id == change.id)
      nodes[i].width = change.dimensions?.width ?? 100
      nodes[i].height = change.dimensions?.height ?? 100

      const x = getLayoutedElements(nodes, edges)
      setNodes(x.nodes)
    })
  }

  const state: GraphState = {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
  }

  const onChange = (value: string) => {
    const entry = play(value)

    let id = 1
    const newId = () => {
      id += 1
      return id.toString()
    }

    const newNode = (text: string) => {
      return {
        id: newId(),
        type: 'multiline' as const,
        data: { text },
        position: { x: 0, y: 0 },
      }
    }

    const newEdge = (source: string, target: string) => {
      return {
        id: newId(),
        source,
        target,
        markerEnd: {
          type: MarkerType.ArrowClosed as const,
          width: 20 as const,
          height: 20 as const,
          color: '#FF0072' as const,
        },
      }
    }

    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    const idByBlock = new Map<BasicBlock, string>()

    forEachBasicBlock(entry, (block: BasicBlock) => {
      const node = newNode(toString(block))
      nodes.push(node)
      idByBlock.set(block, node.id)
    })

    forEachBasicBlock(entry, (block: BasicBlock) => {
      const source = idByBlock.get(block) ?? ''
      const end = block.end
      switch (end.kind) {
        case 'jump': {
          const target = idByBlock.get(end.next) ?? ''
          edges.push(newEdge(source, target))
        } break
        case 'branch': {
          const thenTarget = idByBlock.get(end.then) ?? ''
          const elseTarget = idByBlock.get(end.else) ?? ''
          edges.push(newEdge(source, thenTarget))
          edges.push(newEdge(source, elseTarget))
        } break
      }
    })

    state.setNodes(nodes)
    state.setEdges(edges)
  }

  return (
    <div className="app-container">
      <div className="editor-container">
        <h2>Editor</h2>
        <MonacoEditor onChange={(value) => { onChange(value ?? '') }} />
      </div>
      <div className="content-container">
        <h2>Basic Blocks</h2>
        <Graph state={state} />
      </div>
    </div>
  )
}

export default App
