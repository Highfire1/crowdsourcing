'use client'

import { useDraggable } from '@neodrag/react'
import { useReactFlow, XYPosition, Node } from '@xyflow/react'
import { useCallback, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  RequirementNode, 
  RequirementGroup
} from '@/lib/course_types'
import { 
  parsePrerequisiteText, 
  generateNodeId, 
  getRequirementTypeDisplayName, 
  getGroupLogicColor 
} from '@/lib/prerequisite-parser'

interface RequirementEditorSidebarProps {
  prerequisiteText?: string
  onNodeAdd?: (nodeType: string, nodeData: RequirementNode, position: XYPosition) => void
}

interface DraggableNodeProps {
  className?: string
  children: React.ReactNode
  nodeType: string
  nodeData: RequirementNode
  onDrop: (nodeType: string, nodeData: RequirementNode, position: XYPosition) => void
}

function DraggableNode({ className, children, nodeType, nodeData, onDrop }: DraggableNodeProps) {
  const draggableRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<XYPosition>({ x: 0, y: 0 })

  useDraggable(draggableRef as React.RefObject<HTMLElement>, {
    position: position,
    onDrag: ({ offsetX, offsetY }) => {
      setPosition({
        x: offsetX,
        y: offsetY,
      })
    },
    onDragEnd: ({ event }) => {
      setPosition({ x: 0, y: 0 })
      onDrop(nodeType, nodeData, {
        x: event.clientX,
        y: event.clientY,
      })
    },
  })

  return (
    <div 
      className={`cursor-grab active:cursor-grabbing transition-transform hover:scale-105 ${className}`} 
      ref={draggableRef}
    >
      {children}
    </div>
  )
}

export function RequirementEditorSidebar({ 
  prerequisiteText = '', 
  onNodeAdd 
}: RequirementEditorSidebarProps) {
  const { setNodes, screenToFlowPosition, getNodes, getIntersectingNodes } = useReactFlow()

  type NodeWithParent = Node & { parentId?: string }

  const handleNodeDrop = useCallback(
    (nodeType: string, nodeData: RequirementNode, screenPosition: XYPosition) => {
      const flow = document.querySelector('.react-flow')
      const flowRect = flow?.getBoundingClientRect()
      const isInFlow =
        flowRect &&
        screenPosition.x >= flowRect.left &&
        screenPosition.x <= flowRect.right &&
        screenPosition.y >= flowRect.top &&
        screenPosition.y <= flowRect.bottom

      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition)
        
        // Create new node with unique ID
        const newNode = {
          id: generateNodeId(),
          type: nodeType,
          position,
          data: { 
            label: getRequirementTypeDisplayName(nodeType), 
            requirementData: nodeData,
            onChange: (updatedData: RequirementNode) => {
              setNodes((nds) => 
                nds.map((node) => 
                  node.id === newNode.id 
                    ? { ...node, data: { ...node.data, requirementData: updatedData } }
                    : node
                )
              )
            }
          },
        }

        // add the new node
        setNodes((nds) => nds.concat(newNode))

        // After adding, determine if it was dropped inside a group and if so set parentId + extent
        // We use a small timeout to ensure the node exists in the flow before querying
        setTimeout(() => {
          try {
            const allNodes = getNodes()
            const groups = allNodes.filter((n: Node) => {
              const d = n.data as unknown as { requirementData?: { type?: string } }
              return d.requirementData?.type === 'group'
            })

            if (groups.length > 0) {
              const intersecting = getIntersectingNodes(newNode, true, groups)

              // choose the deepest/innermost group (most ancestors)
              const nodesById = new Map(allNodes.map(n => [n.id, n]))
              const computeDepth = (n: NodeWithParent) => {
                let depth = 0
                let cur: NodeWithParent | undefined = n
                while (cur && cur.parentId && nodesById.has(cur.parentId)) {
                  depth++
                  cur = nodesById.get(cur.parentId) as NodeWithParent | undefined
                }
                return depth
              }

              let targetGroup: Node | null = null
              if (intersecting && intersecting.length > 0) {
                targetGroup = intersecting.reduce((best: Node | null, candidate: Node) => {
                  if (!best) return candidate
                  const bd = computeDepth(best)
                  const cd = computeDepth(candidate)
                  return cd > bd ? candidate : best
                }, null)
              }

              if (targetGroup) {
                // compute position relative to the parent so the child stays where dropped
                const parentNode = nodesById.get(targetGroup.id) as Node | undefined
                type NodeWithParent = Node & { parentId?: string, positionAbsolute?: XYPosition }
                const computeAbsolutePosition = (start: NodeWithParent | undefined) : XYPosition => {
                  if (!start) return { x: 0, y: 0 }
                  const startTyped = start as NodeWithParent
                  let pos = startTyped.positionAbsolute ?? (startTyped.position as XYPosition) ?? { x: 0, y: 0 }
                  let cur: NodeWithParent | undefined = startTyped
                  const nodeById = new Map(allNodes.map(n => [n.id, n]))
                  while (cur && cur.parentId && nodeById.has(cur.parentId)) {
                    const parent = nodeById.get(cur.parentId) as NodeWithParent | undefined
                    if (!parent) break
                    const parentPos = parent.positionAbsolute ?? (parent.position as XYPosition) ?? { x: 0, y: 0 }
                    pos = { x: pos.x + parentPos.x, y: pos.y + parentPos.y }
                    cur = parent
                  }
                  return pos
                }

                const parentAbs = computeAbsolutePosition(parentNode)
                const absPos = position as XYPosition
                const relative = parentAbs ? { x: absPos.x - parentAbs.x, y: absPos.y - parentAbs.y } : absPos

                setNodes((nds) => nds.map((n) => n.id === newNode.id ? { ...n, parentId: targetGroup!.id, position: relative } : n))
              }
            }
          } catch {
            // ignore failures here
          }
        }, 50)
        onNodeAdd?.(nodeType, nodeData, position)
      }
    },
  [setNodes, screenToFlowPosition, onNodeAdd, getNodes, getIntersectingNodes]
  )

  // Parse prerequisite text to generate course nodes
  const parsedPrerequisites = parsePrerequisiteText(prerequisiteText)

  return (
    <Card className="w-80 h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Requirement Palette</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-6">
            
            {/* Auto-generated Course Requirements */}
            {(parsedPrerequisites.courses.length > 0 || parsedPrerequisites.hsCourses.length > 0) && (
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                  <Badge variant="secondary" className="mr-2">AUTO</Badge>
                  Detected Courses
                </h3>
                <div className="space-y-2">
                  {parsedPrerequisites.courses.map((course, index) => (
                    <DraggableNode
                      key={`course-${index}`}
                      className="block"
                      nodeType="course"
                      nodeData={course}
                      onDrop={handleNodeDrop}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-grab">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-sm font-bold">
                                {course.department} {course.number}
                              </p>
                              <p className="text-xs text-gray-500">University Course</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Course
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </DraggableNode>
                  ))}
                  
                  {parsedPrerequisites.hsCourses.map((hsCourse, index) => (
                    <DraggableNode
                      key={`hs-${index}`}
                      className="block"
                      nodeType="HSCourse"
                      nodeData={hsCourse}
                      onDrop={handleNodeDrop}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-grab">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">{hsCourse.course}</p>
                              <p className="text-xs text-gray-500">High School Course</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              HS
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </DraggableNode>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}
            
            {/* Group/Logic Nodes */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Logic Groups</h3>
              <div className="space-y-2">
                {(['ALL_OF', 'ONE_OF', 'TWO_OF'] as const).map((logic) => {
                  const groupData: RequirementGroup = {
                    type: 'group',
                    logic,
                    children: []
                  }
                  
                  return (
                    <DraggableNode
                      key={logic}
                      className="block"
                      nodeType="group"
                      nodeData={groupData}
                      onDrop={handleNodeDrop}
                    >
                      <Card 
                        className="hover:shadow-md transition-shadow cursor-grab"
                        style={{ borderLeftWidth: '4px', borderLeftColor: getGroupLogicColor(logic) }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">{logic.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-500">Logic Group</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ backgroundColor: getGroupLogicColor(logic) + '20' }}
                            >
                              Group
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </DraggableNode>
                  )
                })}
              </div>
              <Separator className="mt-4" />
            </div>

            {/* Manual Course Requirements */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Course Requirements</h3>
              <div className="space-y-2">
                <DraggableNode
                  className="block"
                  nodeType="course"
                  nodeData={{ type: 'course', department: '', number: '' }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">University Course</p>
                          <p className="text-xs text-gray-500">Configurable course requirement</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Course</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>

                <DraggableNode
                  className="block"
                  nodeType="HSCourse"
                  nodeData={{ type: 'HSCourse', course: '' }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">High School Course</p>
                          <p className="text-xs text-gray-500">High school requirement</p>
                        </div>
                        <Badge variant="outline" className="text-xs">HS</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>
              </div>
              <Separator className="mt-4" />
            </div>

            {/* Academic Requirements */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Academic Requirements</h3>
              <div className="space-y-2">
                <DraggableNode
                  className="block"
                  nodeType="CGPA"
                  nodeData={{ type: 'CGPA', minCGPA: 2.0 }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Cumulative GPA</p>
                          <p className="text-xs text-gray-500">Overall GPA requirement</p>
                        </div>
                        <Badge variant="outline" className="text-xs">GPA</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>

                <DraggableNode
                  className="block"
                  nodeType="UDGPA"
                  nodeData={{ type: 'UDGPA', minUDGPA: 2.0 }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Upper Division GPA</p>
                          <p className="text-xs text-gray-500">300-400 level GPA requirement</p>
                        </div>
                        <Badge variant="outline" className="text-xs">UD GPA</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>

                <DraggableNode
                  className="block"
                  nodeType="creditCount"
                  nodeData={{ type: 'creditCount', credits: 0 }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Credit Count</p>
                          <p className="text-xs text-gray-500">Minimum credits required</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Credits</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>

                <DraggableNode
                  className="block"
                  nodeType="courseCount"
                  nodeData={{ type: 'courseCount', count: 0 }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Course Count</p>
                          <p className="text-xs text-gray-500">Number of courses required</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Count</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>

                <DraggableNode
                  className="block"
                  nodeType="program"
                  nodeData={{ type: 'program', program: '' }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Program Requirement</p>
                          <p className="text-xs text-gray-500">Specific program enrollment</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Program</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>
              </div>
              <Separator className="mt-4" />
            </div>

            {/* Other Requirements */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Other Requirements</h3>
              <div className="space-y-2">
                <DraggableNode
                  className="block"
                  nodeType="permission"
                  nodeData={{ type: 'permission', note: '' }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Permission Required</p>
                          <p className="text-xs text-gray-500">Instructor or department permission</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Permission</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>

                <DraggableNode
                  className="block"
                  nodeType="other"
                  nodeData={{ type: 'other', note: '' }}
                  onDrop={handleNodeDrop}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-grab">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Other Requirement</p>
                          <p className="text-xs text-gray-500">Custom requirement description</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Other</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableNode>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}