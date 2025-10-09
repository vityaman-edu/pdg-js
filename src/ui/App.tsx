import { Background, type Edge, type Node, ReactFlow, ReactFlowProvider, useEdgesState, useNodesInitialized, useNodesState } from '@xyflow/react'
import { Editor } from '@monaco-editor/react'
import { SmartBezierEdge } from '@tisoap/react-flow-smart-edge'
import { useCallback, useEffect, useRef, useState } from 'react'
import '@xyflow/react/dist/style.css'
import './App.css'
import { examples } from './examples'
import { buildAst } from '../ast/build'
import { layout } from './Layout'
import { MultilineNode } from './cfg/component'
import { buildCfg } from '../cfg/build'
import { printCfg } from '../cfg/text'
import { toGraph } from './cfg/graph'
import { printAst } from '../ast/text'

export const App = () => {
  const isCfgTextEnabled = false
  const isASTEnabled = true

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [astText, setAstText] = useState('')
  const [cfgText, setCfgText] = useState('')
  const [content, setContent] = useState(examples['Hello World'])

  const onSourceChange = useCallback((source: string) => {
    const ast = buildAst(source)
    const cfg = buildCfg(ast)

    setAstText(printAst(ast))
    setCfgText(printCfg(cfg))

    const { nodes, edges } = toGraph(cfg)
    setNodes(nodes)
    setEdges(edges)
  }, [setEdges, setNodes])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSourceChangeDebounced = useCallback((source: string) => {
    if (timer.current) {
      clearTimeout(timer.current)
    }

    timer.current = setTimeout(() => {
      onSourceChange(source)
    }, 300)
  }, [onSourceChange])

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
          nodeTypes={{ multiline: MultilineNode }}
          edgeTypes={{ smart: SmartBezierEdge }}
          fitView
          fitViewOptions={{
            padding: {
              top: '10%',
              bottom: '10%',
              left: '10%',
              right: '10%',
            },
          }}
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
        <select
          style={{ marginLeft: '10px' }}
          onChange={(e) => {
            const source = examples[e.target.value] ?? ''
            setContent(source)
            onSourceChange(source)
          }}
          defaultValue="Hello World"
        >
          {Object.entries(examples).map(entry => (
            <option key={entry[0]} value={entry[0]}>{entry[0]}</option>
          ))}
        </select>
        <Editor
          defaultLanguage="typescript"
          value={content}
          onChange={(value) => { onSourceChangeDebounced(value ?? '') }}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden',
            },
            overviewRulerLanes: 0,
          }}
          onMount={() => { onSourceChange(content) }}
        />
      </div>
      <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
        <h2>Control Flow Graph</h2>
        <ReactFlowProvider>
          <LayoutFlow />
        </ReactFlowProvider>
      </div>
      {// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        isCfgTextEnabled
        && (
          <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
            <h2>Control Flow Graph (Text)</h2>
            <Editor
              defaultLanguage="typescript"
              value={cfgText}
              options={{
                fontSize: 16,
                minimap: { enabled: false },
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'hidden',
                },
                overviewRulerLanes: 0,
                readOnly: true,
              }}
            />
          </div>
        )
      }

      {// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        isASTEnabled && (
          <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
            <h2>Abstract Syntax Tree (Text)</h2>
            <div
              style={{
                padding: '12px',
                fontSize: 13,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
              }}
            >
              {astText}
            </div>
          </div>
        )
      }
    </div>
  )
}

export default App
