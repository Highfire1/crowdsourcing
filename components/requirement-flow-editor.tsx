'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
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

interface RequirementEditorProps {
  prerequisiteText?: string
  initialData?: RequirementNode
  onSave?: (data?: RequirementNode) => void
  onExport?: (data: RequirementNode) => void
  onRequirementChange?: (data: RequirementNode | null) => void
  submitted?: boolean
  loading?: boolean
  onSkip?: () => void
  submitState?: 'idle' | 'success' | 'error'
}

type NodeWithParent = Node & { parentId?: string; positionAbsolute?: XYPosition }

function computeAbsolutePosition(node: Node | undefined, nodesById: Map<string, Node>): XYPosition {
  if (!node) return { x: 0, y: 0 }
  const nodeTyped = node as NodeWithParent
  let pos = nodeTyped.positionAbsolute ?? (nodeTyped.position as XYPosition) ?? { x: 0, y: 0 }
  let cur: NodeWithParent | undefined = nodeTyped

  while (cur && cur.parentId && nodesById.has(cur.parentId)) {
    const parent = nodesById.get(cur.parentId) as NodeWithParent | undefined
    if (!parent) break
    const parentPos = parent.positionAbsolute ?? (parent.position as XYPosition) ?? { x: 0, y: 0 }
    pos = { x: pos.x + parentPos.x, y: pos.y + parentPos.y }
    cur = parent
  }

  return pos
}

export function RequirementEditor(props: RequirementEditorProps) {
  const { prerequisiteText = '', onSave, onExport, onRequirementChange, loading = false, submitState = 'idle' } = props

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])

  const nodesById = useMemo(() => new Map(nodes.map((n: Node) => [n.id, n])), [nodes])

  const currentRequirementJSON = useMemo(() => {
    const rootNodes = nodes.filter((n: Node) => !n.parentId)
    if (rootNodes.length === 0) return null
    if (rootNodes.length === 1) {
      const root = rootNodes[0]
      return (root.data as unknown as NodeData).requirementData as RequirementNode
    }
    const children = rootNodes.map((r: Node) => (r.data as unknown as NodeData).requirementData as RequirementNode)
    const rootGroup: RequirementGroup = { type: 'group', logic: 'ALL_OF', children }
    return rootGroup
  }, [nodes])

  useEffect(() => {
    onRequirementChange?.(currentRequirementJSON)
  }, [currentRequirementJSON, onRequirementChange])

  const handleClear = useCallback(() => {
    setNodes([])
    setEdges([])
  }, [setNodes, setEdges])

  const handleSave = useCallback(() => {
    if (currentRequirementJSON) onSave?.(currentRequirementJSON)
  }, [currentRequirementJSON, onSave])

  const handleExport = useCallback(() => {
    if (currentRequirementJSON) onExport?.(currentRequirementJSON)
  }, [currentRequirementJSON, onExport])

  function computeRelativeInsideParent(parent: NodeWithParent, currentChildren: NodeWithParent[]) : XYPosition {
    const groups = currentChildren.filter((c: NodeWithParent) => c.parentId === parent.id && ((c.data as unknown as { requirementData?: { type?: string } }).requirementData?.type === 'group'))
    const nonGroups = currentChildren.filter((c: NodeWithParent) => c.parentId === parent.id && ((c.data as unknown as { requirementData?: { type?: string } }).requirementData?.type !== 'group'))

    const padding = 8
    const childHeight = 120
    const groupWidth = 300

    if (currentChildren.filter((c: NodeWithParent) => c.parentId === parent.id).length === 0) {
      return { x: padding, y: padding }
    }

    const nextY = padding + nonGroups.length * (childHeight + padding)
    const nextX = padding + groups.length * (groupWidth + padding)

    if (groups.length > nonGroups.length) return { x: nextX, y: padding }
    return { x: padding, y: nextY }
  }

  const handleNodeDragStop = useCallback((_: unknown, node: Node) => {
    try {
      const all = nodes
  const groups = all.filter((n: Node) => ((n.data as unknown as { requirementData?: { type?: string } }).requirementData?.type === 'group'))
      const childAbs = computeAbsolutePosition(node, nodesById)

      const candidates = groups.filter((g: Node) => {
        const gPos = computeAbsolutePosition(g, nodesById)
        const gData = g.data as unknown as { width?: number; height?: number }
        const gw = gData.width ?? 300
        const gh = gData.height ?? 200
        return childAbs.x >= gPos.x && childAbs.x <= gPos.x + gw && childAbs.y >= gPos.y && childAbs.y <= gPos.y + gh
      })

      const nodesByIdLocal = new Map(all.map((n: Node) => [n.id, n]))
      const computeDepth = (n?: NodeWithParent) => {
        let d = 0
        let cur = n
        while (cur && cur.parentId && nodesByIdLocal.has(cur.parentId)) {
          d++
          cur = nodesByIdLocal.get(cur.parentId) as NodeWithParent
        }
        return d
      }

      let target: Node | undefined
      if (candidates.length > 0) {
        target = candidates.reduce((best: Node | undefined, c: Node) => {
          if (!best) return c
          return computeDepth(c) > computeDepth(best) ? c : best
        }, undefined as Node | undefined)
      }

      if (target) {
        const rel = computeRelativeInsideParent(target as NodeWithParent, all as NodeWithParent[])
        setNodes((nds: Node[]) => nds.map((n: Node) => n.id === node.id ? { ...n, parentId: (target as NodeWithParent).id, position: rel } : n))
      } else {
        if ((node as NodeWithParent).parentId) {
          setNodes((nds: Node[]) => nds.map((n: Node) => n.id === node.id ? { ...n, parentId: undefined, position: computeAbsolutePosition(node, nodesById) } : n))
        }
      }
    } catch (err) {
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
              <h2 className="text-lg font-semibold">Requirement Editor</h2>
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

export function RequirementFlowEditor(props: RequirementEditorProps) {
  return (
    <ReactFlowProvider>
      <RequirementEditor {...props} />
    </ReactFlowProvider>
  )
}
