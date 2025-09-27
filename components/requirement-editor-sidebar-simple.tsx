'use client'

import { useReactFlow, XYPosition } from '@xyflow/react'
import { useCallback } from 'react'
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
  onAdd: (nodeType: string, nodeData: RequirementNode) => void
}

function DraggableNode({ className, children, nodeType, nodeData, onAdd }: DraggableNodeProps) {
  const handleClick = () => {
    onAdd(nodeType, nodeData)
  }

  return (
    <div 
      className={`cursor-pointer transition-transform hover:scale-105 ${className}`} 
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

export function RequirementEditorSidebarSimple({ 
  prerequisiteText = '', 
  onNodeAdd 
}: RequirementEditorSidebarProps) {
  const { setNodes } = useReactFlow()

  const handleNodeAdd = useCallback(
    (nodeType: string, nodeData: RequirementNode) => {
      // Add node at a random position to avoid overlap
      const position = {
        x: Math.random() * 400,
        y: Math.random() * 300,
      }
      
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

      // Add the new node
      setNodes((nds) => nds.concat(newNode))
      onNodeAdd?.(nodeType, nodeData, position)
    },
    [setNodes, onNodeAdd]
  )

  // Parse prerequisite text to generate course nodes
  const parsedPrerequisites = parsePrerequisiteText(prerequisiteText)

  return (
    <Card className="w-80 h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Add Requirements</CardTitle>
        <p className="text-sm text-gray-500">Click to add nodes to the canvas</p>
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
                      onAdd={handleNodeAdd}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                      onAdd={handleNodeAdd}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                      onAdd={handleNodeAdd}
                    >
                      <Card 
                        className="hover:shadow-md transition-shadow cursor-pointer"
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  onAdd={handleNodeAdd}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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