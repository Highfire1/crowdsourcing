'use client'

import React, { useCallback, useMemo } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  XYPosition,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { RequirementEditorSidebar } from './requirement-editor-sidebar'
import { nodeTypes, NodeData } from './requirement-nodes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Download, Trash2 } from 'lucide-react'
import { RequirementNode, RequirementGroup } from '@/lib/course_types'

// Lightweight, well-typed MVP editor that keeps the old file untouched.
// Key design points:
// - Deterministic stacking inside groups: non-groups vertically, groups horizontally.
// - Static sizes used for layout calculation.
// - No fitView/auto-zoom on add.
// - Compute absolute position when needed and convert to relative when parenting.

interface RequirementEditorProps {
  prerequisiteText?: string
  initialData?: RequirementNode
  onSave?: (data?: RequirementNode) => void
  onExport?: (data: RequirementNode) => void
  onRequirementChange?: (data: RequirementNode | null) => void
  loading?: boolean
  submitState?: 'idle' | 'success' | 'error'
}

type NodeWithParent = Node & { parentId?: string; positionAbsolute?: XYPosition }

const CHILD_HEIGHT = 120
const GROUP_WIDTH = 300
const GROUP_HEIGHT = 200
const PADDING = 8

function computeAbsolutePosition(node: NodeWithParent | undefined, nodesById: Map<string, NodeWithParent>): XYPosition {
  if (!node) return { x: 0, y: 0 }
  let pos = node.positionAbsolute ?? (node.position as XYPosition) ?? { x: 0, y: 0 }
  let cur: NodeWithParent | undefined = node

  while (cur && cur.parentId && nodesById.has(cur.parentId)) {
    const parent = nodesById.get(cur.parentId) as NodeWithParent | undefined
    if (!parent) break
    const parentPos = parent.positionAbsolute ?? (parent.position as XYPosition) ?? { x: 0, y: 0 }
    pos = { x: pos.x + parentPos.x, y: pos.y + parentPos.y }
    cur = parent
  }

  return pos
}

function computeRelativeInsideParent(parent: NodeWithParent, children: NodeWithParent[]) : XYPosition {
  // children: all nodes on canvas
  const groups = children.filter(c => c.parentId === parent.id && ((c.data as unknown as { requirementData?: { type?: string } }).requirementData?.type === 'group'))
  const nonGroups = children.filter(c => c.parentId === parent.id && ((c.data as unknown as { requirementData?: { type?: string } }).requirementData?.type !== 'group'))

  if (groups.length === 0 && nonGroups.length === 0) return { x: PADDING, y: PADDING }

  // Place next non-group below existing non-groups; group children to the right of groups
  const nextY = PADDING + nonGroups.length * (CHILD_HEIGHT + PADDING)
  const nextX = PADDING + groups.length * (GROUP_WIDTH + PADDING)

  // Heuristic: if more groups than nonGroups, prefer horizontal placement, else vertical
  return (groups.length > nonGroups.length) ? { x: nextX, y: PADDING } : { x: PADDING, y: nextY }
}

export function RequirementFlowEditorV2(props: RequirementEditorProps) {
  const { prerequisiteText = '', onSave, onExport, onRequirementChange, loading = false, submitState = 'idle' } = props

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])

  const nodesById = useMemo(() => new Map(nodes.map(n => [n.id, n as NodeWithParent])), [nodes])

  const currentRequirementJSON = useMemo(() => {
    const rootNodes = nodes.filter(n => !n.parentId)
    if (rootNodes.length === 0) return null
    if (rootNodes.length === 1) return (rootNodes[0].data as unknown as NodeData).requirementData as RequirementNode
    const children = rootNodes.map(r => (r.data as unknown as NodeData).requirementData as RequirementNode)
    const rootGroup: RequirementGroup = { type: 'group', logic: 'ALL_OF', children }
    return rootGroup
  }, [nodes])

  React.useEffect(() => {
    onRequirementChange?.(currentRequirementJSON)
  }, [currentRequirementJSON, onRequirementChange])

  const handleClear = useCallback(() => { setNodes([]); setEdges([]) }, [setNodes, setEdges])
  const handleSave = useCallback(() => { if (currentRequirementJSON) onSave?.(currentRequirementJSON) }, [currentRequirementJSON, onSave])
  const handleExport = useCallback(() => { if (currentRequirementJSON) onExport?.(currentRequirementJSON) }, [currentRequirementJSON, onExport])

  const handleNodeDragStop = useCallback((_: unknown, node: Node) => {
    // On drag stop, check whether node lies within any group bounds and set parentId+relative position deterministically
    try {
      const all = nodes as NodeWithParent[]
  const groups = all.filter(n => ((n.data as unknown as { requirementData?: { type?: string } }).requirementData?.type === 'group'))
      const childAbs = computeAbsolutePosition(node as NodeWithParent, nodesById)

      const candidates = groups.filter(g => {
        const gPos = computeAbsolutePosition(g, nodesById)
        const gw = ((g.data as unknown) as { width?: number }).width ?? GROUP_WIDTH
        const gh = ((g.data as unknown) as { height?: number }).height ?? GROUP_HEIGHT
        return childAbs.x >= gPos.x && childAbs.x <= gPos.x + gw && childAbs.y >= gPos.y && childAbs.y <= gPos.y + gh
      })

      const nodesByIdLocal = new Map(all.map(n => [n.id, n]))
      const computeDepth = (n?: NodeWithParent) => {
        let d = 0
        let cur = n
        while (cur && cur.parentId && nodesByIdLocal.has(cur.parentId)) { d++; cur = nodesByIdLocal.get(cur.parentId) as NodeWithParent }
        return d
      }

      let target: NodeWithParent | undefined
      if (candidates.length > 0) {
        target = candidates.reduce((best: NodeWithParent | undefined, c: NodeWithParent) => {
          if (!best) return c
          return computeDepth(c) > computeDepth(best) ? c : best
        }, undefined as NodeWithParent | undefined)
      }

      if (target) {
        const rel = computeRelativeInsideParent(target, all)
        setNodes(nds => nds.map(n => n.id === node.id ? { ...n, parentId: target!.id, position: rel } : n))
      } else {
        // If node previously had a parent, detach and keep absolute position (so it doesn't jump)
        if ((node as NodeWithParent).parentId) {
          setNodes(nds => nds.map(n => n.id === node.id ? { ...n, parentId: undefined, position: computeAbsolutePosition(node as NodeWithParent, nodesById) } : n))
        }
      }
    } catch (err) {
      // swallow errors in UI path
      console.warn('drag stop failed', err)
    }
  }, [nodes, nodesById, setNodes])

  return (
    <div className="flex h-full min-h-0">
      <div className="w-80 flex-shrink-0">
        <RequirementEditorSidebar prerequisiteText={prerequisiteText} onNodeAdd={() => {}} />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">Requirement Editor (v2)</h2>
              <Badge variant="outline">{nodes.length} node{nodes.length!==1?'s':''}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleClear} disabled={nodes.length===0}><Trash2 className="w-4 h-4 mr-2" />Clear</Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!currentRequirementJSON}><Download className="w-4 h-4 mr-2"/>Export JSON</Button>
              <Button size="sm" onClick={handleSave} disabled={!currentRequirementJSON || loading}><Save className="w-4 h-4 mr-2"/>{loading? 'Sending...' : (submitState==='success'?'Submitted!':'Submit')}</Button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={nodeTypes as NodeTypes}
            nodesDraggable={true}
            nodesConnectable={false}
            panOnDrag={false}
            className=""
          >
            <Background />
            <Controls className=" dark:text-black" />
          </ReactFlow>
        </div>
      </div>

      <div className="w-96 flex-shrink-0 border-l border-gray-200 h-fit">
        <Card className="h-full rounded-none border-0">
          <CardHeader className="pb-4"><CardTitle className="text-lg">JSON Preview</CardTitle></CardHeader>
          <CardContent className="h-full overflow-auto">
            {currentRequirementJSON ? (
              <pre className="text-xs p-4 rounded whitespace-pre-wrap overflow-auto">{JSON.stringify(currentRequirementJSON, null, 2)}</pre>
            ) : (
              <div className="text-center text-gray-500 py-8"><p className="text-sm">No requirements</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function RequirementFlowEditorV2Provider(props: RequirementEditorProps) {
  return (
    <ReactFlowProvider>
      <RequirementFlowEditorV2 {...props} />
    </ReactFlowProvider>
  )
}
