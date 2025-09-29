import { Background, type Edge, Handle, MarkerType, type Node, Position, ReactFlow, ReactFlowProvider, useEdgesState, useNodesInitialized, useNodesState } from '@xyflow/react'
import { Editor } from '@monaco-editor/react'
import '@xyflow/react/dist/style.css'
import './App.css'
import { forEachBasicBlock, type BasicBlock, toString } from '../pdg/bb'
import { play } from '../pdg/playground'
import { layout } from './Layout'
import { useEffect, useState } from 'react'

const MultilineNode = ({ data }: { data: { text: string } }) => {
  return (
    <div style={{
      padding: 8,
      border: '1px solid #aaa',
      borderRadius: 4,
      whiteSpace: 'pre-line',
    }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={true}
      />
      <div>
        {data.text}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
      />
    </div>
  )
}

const nodeTypes = {
  multiline: MultilineNode,
}

const toGraph = (source: string) => {
  const entry = play(source)

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
        type: MarkerType.ArrowClosed,
      },
    }
  }

  const nodes: Node[] = []
  const edges: Edge[] = []

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

  return { nodes, edges }
}

export const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const onSourceChange = (source: string) => {
    const { nodes, edges } = toGraph(source)
    setNodes(nodes)
    setEdges(edges)
  }

  const LayoutFlow = () => {
    const useLayout = () => {
      const areNodesReady = useNodesInitialized({})
      const [layouted, setLayouted] = useState(nodes)

      useEffect(() => {
        if (areNodesReady) {
          setLayouted(layout(nodes, edges))
        }
      }, [areNodesReady])

      return layouted
    }

    const layouted = useLayout()

    return (
      <div style={{ height: '100%', width: '100%' }}>
        <ReactFlow
          nodes={layouted}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
        </ReactFlow>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="editor-container" style={{ height: '80vh', width: '80vh' }}>
        <h2>Editor</h2>
        <Editor
          defaultLanguage="typescript"
          defaultValue="// some comment"
          onChange={(value) => { onSourceChange(value ?? '') }}
        />
      </div>
      <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
        <h2>Basic Blocks</h2>
        <ReactFlowProvider>
          <LayoutFlow />
        </ReactFlowProvider>
      </div>
    </div>
  )
}

export default App
