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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { RequirementEditorSidebarSimple as RequirementEditorSidebar } from './requirement-editor-sidebar-simple'
import { nodeTypes, NodeData } from './requirement-nodes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Download, Trash2 } from 'lucide-react'
import { RequirementNode, RequirementGroup } from '@/lib/course_types'

// Simplified editor that works WITH React Flow instead of against it
// Key principles:
// 1. Let React Flow handle all positioning and dragging naturally
// 2. No complex position calculations or drag interceptors
// 3. Simple parent-child relationships using React Flow's built-in parentId
// 4. Trust React Flow's optimized rendering

interface RequirementEditorProps {
  prerequisiteText?: string
  initialData?: RequirementNode
  onSave?: (data?: RequirementNode) => void
  onExport?: (data: RequirementNode) => void
  onRequirementChange?: (data: RequirementNode | null) => void
  loading?: boolean
  submitState?: 'idle' | 'success' | 'error'
}

export function RequirementFlowEditorV3(props: RequirementEditorProps) {
  const { prerequisiteText = '', onSave, onExport, onRequirementChange, loading = false, submitState = 'idle' } = props

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])

  // Simple JSON generation - no complex logic
  const currentRequirementJSON = useMemo(() => {
    const rootNodes = nodes.filter(n => !n.parentId)
    if (rootNodes.length === 0) return null
    if (rootNodes.length === 1) {
      const nodeData = rootNodes[0].data as unknown as NodeData
      return nodeData.requirementData
    }
    // Multiple root nodes - wrap in ALL_OF group
    const children = rootNodes.map(n => (n.data as unknown as NodeData).requirementData)
    const rootGroup: RequirementGroup = { type: 'group', logic: 'ALL_OF', children }
    return rootGroup
  }, [nodes])

  React.useEffect(() => {
    onRequirementChange?.(currentRequirementJSON)
  }, [currentRequirementJSON, onRequirementChange])

  const handleClear = useCallback(() => {
    setNodes([])
    setEdges([])
  }, [setNodes, setEdges])

  const handleSave = useCallback(() => {
    if (currentRequirementJSON) {
      onSave?.(currentRequirementJSON)
    }
  }, [currentRequirementJSON, onSave])

  const handleExport = useCallback(() => {
    if (currentRequirementJSON) {
      onExport?.(currentRequirementJSON)
    }
  }, [currentRequirementJSON, onExport])

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <RequirementEditorSidebar prerequisiteText={prerequisiteText} onNodeAdd={() => {}} />
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">Requirement Editor (Simple)</h2>
              <Badge variant="outline">{nodes.length} node{nodes.length !== 1 ? 's' : ''}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear} 
                disabled={nodes.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport} 
                disabled={!currentRequirementJSON}
              >
                <Download className="w-4 h-4 mr-2"/>
                Export JSON
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={!currentRequirementJSON || loading}
              >
                <Save className="w-4 h-4 mr-2"/>
                {loading ? 'Sending...' : (submitState === 'success' ? 'Submitted!' : 'Submit')}
              </Button>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes as NodeTypes}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            className=""
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* JSON Preview */}
      <div className="w-96 flex-shrink-0 border-l border-gray-200">
        <Card className="h-full rounded-none border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">JSON Preview</CardTitle>
          </CardHeader>
          <CardContent className="h-full overflow-auto">
            {currentRequirementJSON ? (
              <pre className="text-xs p-4 rounded whitespace-pre-wrap overflow-auto">
                {JSON.stringify(currentRequirementJSON, null, 2)}
              </pre>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No requirements added yet</p>
                <p className="text-xs text-gray-400 mt-2">Drag items from the sidebar to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function RequirementFlowEditorV3Provider(props: RequirementEditorProps) {
  return (
    <ReactFlowProvider>
      <RequirementFlowEditorV3 {...props} />
    </ReactFlowProvider>
  )
}