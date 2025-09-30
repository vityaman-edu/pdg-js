import { Background, type Edge, type Node, ReactFlow, ReactFlowProvider, useEdgesState, useNodesInitialized, useNodesState } from '@xyflow/react'
import { Editor } from '@monaco-editor/react'
import { SmartBezierEdge } from '@tisoap/react-flow-smart-edge'
import { useEffect, useState } from 'react'
import '@xyflow/react/dist/style.css'
import './App.css'
import { parse } from '../ts/parse'
import { layout } from './Layout'
import { MultilineNode } from './cfg/component'
import { buildCfg } from '../cfg/build'
import { printCfg } from '../cfg/text'
import { toGraph } from './cfg/graph'

const nodeTypes = {
  multiline: MultilineNode,
}

const edgeTypes = {
  smart: SmartBezierEdge,
}

export const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [cfgText, setCfgText] = useState('')

  const onSourceChange = (source: string) => {
    const ast = parse(source)
    const cfg = buildCfg(ast)

    const text = printCfg(cfg)
    setCfgText(text)

    const { nodes, edges } = toGraph(cfg)
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
          edgeTypes={edgeTypes}
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
          options={{
            fontSize: 22,
            minimap: { enabled: false },
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden',
            },
            overviewRulerLanes: 0,
          }}
        />
      </div>
      <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
        <h2>Control Flow Graph</h2>
        <ReactFlowProvider>
          <LayoutFlow />
        </ReactFlowProvider>
      </div>
      <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
        <h2>Control Flow Graph (Text)</h2>
        <div
          style={{
            padding: '12px',
            fontSize: 13,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.4,
          }}
        >
          {cfgText}
        </div>
      </div>
    </div>
  )
}

export default App
