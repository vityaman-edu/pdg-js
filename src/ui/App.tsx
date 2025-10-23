import { Background, type Edge, type Node, ReactFlow, ReactFlowProvider, useEdgesState, useNodesInitialized, useNodesState } from '@xyflow/react'
import { Editor } from '@monaco-editor/react'
import { SmartBezierEdge } from '@tisoap/react-flow-smart-edge'
import { useCallback, useEffect, useRef, useState } from 'react'
import '@xyflow/react/dist/style.css'
import './App.css'
import { examples } from './examples'
import { buildAst } from '../ast/build'
import { layout } from './Layout'
import { MultilineNode } from './graph/component'
import { buildCfg } from '../cfg/build'
import { printCfg } from '../cfg/text'
import { toGraph } from './graph/build'
import { printAst } from '../ast/text'
import { printDdg } from '../ddg/text'
import { buildDdg } from '../ddg/build'
import { physicalNames } from '../ast/rename'

export const App = () => {
  const isCfgTextEnabled = false
  const isDdgTextEnabled = true
  const isASTEnabled = false

  const [systemTheme, setSystemTheme] = useState<'vs' | 'vs-dark'>('vs')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [astText, setAstText] = useState('')
  const [cfgText, setCfgText] = useState('')
  const [ddgText, setDdgText] = useState('')
  const [content, setContent] = useState(examples['Hello World'])
  const [areEmptyJumpsEliminated, setAreEmptyJumpsEliminated] = useState(true)
  const [areIfTrueEliminated, setIfTrueEliminated] = useState(true)
  const [areJumpChainsMerged, setJumpChainsMerged] = useState(true)
  const [isSplitted, setSplitted] = useState(false)
  const [isDdgDrawn, setDdgDrawn] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'vs-dark' : 'vs')

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'vs-dark' : 'vs')
    }

    mediaQuery.addEventListener('change', handler)
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Redraw graph when theme changes
  useEffect(() => {
    onSourceChange(
      content,
      areEmptyJumpsEliminated,
      areIfTrueEliminated,
      areJumpChainsMerged,
      isSplitted,
      isDdgDrawn,
    )
  }, [systemTheme]) // Only depend on systemTheme to avoid circular dependencies

  const onSourceChange = useCallback((
    source: string,
    areEmptyJumpsEliminated: boolean,
    areIfTrueEliminated: boolean,
    areJumpChainsMerged: boolean,
    isSplitted: boolean,
    isDdgDrawn: boolean,
  ) => {
    const ast = buildAst(source)
    const cfg = buildCfg(ast, {
      areEmptyJumpsEliminated,
      areIfTrueEliminated,
      areJumpChainsMerged,
      isSplitted,
    })
    const ddg = buildDdg(cfg, physicalNames(ast))

    setAstText(printAst(ast))
    setCfgText(printCfg(cfg))
    setDdgText(printDdg(ddg))

    const { nodes, edges } = toGraph(cfg, isDdgDrawn ? ddg : undefined, systemTheme)
    setNodes(nodes)
    setEdges(edges)
  }, [setEdges, setNodes, systemTheme])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSourceChangeDebounced = useCallback((source: string) => {
    if (timer.current) {
      clearTimeout(timer.current)
    }

    timer.current = setTimeout(() => {
      onSourceChange(
        source,
        areEmptyJumpsEliminated,
        areIfTrueEliminated,
        areJumpChainsMerged,
        isSplitted,
        isDdgDrawn,
      )
    }, 300)
  }, [areEmptyJumpsEliminated, areIfTrueEliminated, areJumpChainsMerged, isDdgDrawn, isSplitted, onSourceChange])

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
          colorMode="system"
          nodes={layouted}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={{ multiline: props => <MultilineNode {...props} /> }}
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
          style={{
            marginLeft: '10px',
            backgroundColor: systemTheme === 'vs-dark' ? '#333' : '#f9f9f9',
            color: systemTheme === 'vs-dark' ? '#fff' : '#000',
            border: `1px solid ${systemTheme === 'vs-dark' ? '#555' : '#ccc'}`,
            borderRadius: '4px',
            padding: '5px',
            fontSize: '14px',
          }}
          onChange={(e) => {
            const source = examples[e.target.value] ?? ''
            setContent(source)
            onSourceChange(
              source,
              areEmptyJumpsEliminated,
              areIfTrueEliminated,
              areJumpChainsMerged,
              isSplitted,
              isDdgDrawn,
            )
          }}
          defaultValue="Hello World"
        >
          {Object.entries(examples).map(entry => (
            <option key={entry[0]} value={entry[0]}>{entry[0]}</option>
          ))}
        </select>
        <div className="hover-container">
          <input
            className="hover-input"
            type="checkbox"
            checked={areEmptyJumpsEliminated}
            onChange={(e) => {
              const areEmptyJumpsEliminated = e.target.checked
              setAreEmptyJumpsEliminated(areEmptyJumpsEliminated)
              onSourceChange(
                content,
                areEmptyJumpsEliminated,
                areIfTrueEliminated,
                areJumpChainsMerged,
                isSplitted,
                isDdgDrawn,
              )
            }}
          />
          <span className="hover-text">Eliminate Empty Jumps</span>
        </div>
        <div className="hover-container">
          <input
            className="hover-input"
            type="checkbox"
            checked={areIfTrueEliminated}
            onChange={(e) => {
              const areIfTrueEliminated = e.target.checked
              setIfTrueEliminated(areIfTrueEliminated)
              onSourceChange(
                content,
                areEmptyJumpsEliminated,
                areIfTrueEliminated,
                areJumpChainsMerged,
                isSplitted,
                isDdgDrawn,
              )
            }}
          />
          <span className="hover-text">Eliminate If True</span>
        </div>
        <div className="hover-container">
          <input
            className="hover-input"
            type="checkbox"
            checked={areJumpChainsMerged}
            onChange={(e) => {
              const areJumpChainsMerged = e.target.checked
              setJumpChainsMerged(areJumpChainsMerged)
              onSourceChange(
                content,
                areEmptyJumpsEliminated,
                areIfTrueEliminated,
                areJumpChainsMerged,
                isSplitted,
                isDdgDrawn,
              )
            }}
          />
          <span className="hover-text">Merge Jump Chains</span>
        </div>
        <div className="hover-container">
          <input
            className="hover-input"
            type="checkbox"
            checked={isSplitted}
            onChange={(e) => {
              const isSplitted = e.target.checked
              setSplitted(isSplitted)
              onSourceChange(
                content,
                areEmptyJumpsEliminated,
                areIfTrueEliminated,
                areJumpChainsMerged,
                isSplitted,
                isDdgDrawn,
              )
            }}
          />
          <span className="hover-text">Split CFG</span>
        </div>
        <div className="hover-container">
          <input
            className="hover-input"
            type="checkbox"
            checked={isDdgDrawn}
            onChange={(e) => {
              const isDdgDrawn = e.target.checked
              setDdgDrawn(isDdgDrawn)
              onSourceChange(
                content,
                areEmptyJumpsEliminated,
                areIfTrueEliminated,
                areJumpChainsMerged,
                isSplitted,
                isDdgDrawn,
              )
            }}
          />
          <span className="hover-text">Draw DDG Edges</span>
        </div>
        <Editor
          defaultLanguage="typescript"
          value={content}
          onChange={(value) => { onSourceChangeDebounced(value ?? '') }}
          theme={systemTheme}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden',
            },
            overviewRulerLanes: 0,
          }}
          onMount={() => {
            onSourceChange(
              content,
              areEmptyJumpsEliminated,
              areEmptyJumpsEliminated,
              areJumpChainsMerged,
              isSplitted,
              isDdgDrawn,
            )
          }}
        />
      </div>
      <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
        <h2>Control Flow Graph</h2>
        <ReactFlowProvider>
          <LayoutFlow />
        </ReactFlowProvider>
      </div>
      {// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        isCfgTextEnabled && (
          <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
            <h2>Control Flow Graph (Text)</h2>
            <Editor
              defaultLanguage="typescript"
              value={cfgText}
              theme={systemTheme}
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
        isDdgTextEnabled && (
          <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
            <h2>Data Dependency Graph (Text)</h2>
            <div
              style={{
                padding: '12px',
                fontSize: 18,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
              }}
            >
              {ddgText}
            </div>
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
