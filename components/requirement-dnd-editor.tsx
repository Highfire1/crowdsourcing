'use client'

import React, { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Save, Download, Trash2, Grip, SkipForward } from 'lucide-react'
import { 
  RequirementNode, 
  RequirementGroup,
  RequirementCourse,
  RequirementHSCourse,
  RequirementCGPA,
  RequirementUDGPA,
  RequirementCreditCount,
  RequirementCourseCount,
  RequirementProgram,
  RequirementPermission,
  RequirementOther
} from '@/lib/course_types'
import { 
  parsePrerequisiteText, 
  generateNodeId, 
  getGroupLogicColor 
} from '@/lib/prerequisite-parser'

interface RequirementEditorProps {
  prerequisiteText?: string
  initialData?: RequirementNode
  onSave?: (data?: RequirementNode) => void
  onSkip?: () => void
  onExport?: (data: RequirementNode) => void
  onRequirementChange?: (data: RequirementNode | null) => void
  loading?: boolean
  submitState?: 'idle' | 'success' | 'error'
}

interface RequirementItem {
  id: string
  requirement: RequirementNode
  parentId?: string
}

interface GroupItem extends RequirementItem {
  requirement: RequirementGroup
  children: RequirementItem[]
}

// Draggable sidebar item
function DraggableSidebarItem({ 
  id, 
  children, 
  requirement, 
  onClick 
}: { 
  id: string
  children: React.ReactNode
  requirement: RequirementNode
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ 
    id: `sidebar-${id}`,
    data: { type: 'sidebar-item', requirement }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'transform 150ms ease',
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        onClick={onClick}
        className="cursor-grab hover:cursor-grabbing touch-none"
      >
        {children}
      </div>
    </div>
  )
}

// Main droppable area component
function MainDroppableArea({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'main-area',
  })

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-h-[200px] p-4 transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-700 border-dashed' : 'border-2 border-transparent'}`}
    >
      {children}
    </div>
  )
}

function DroppableGroupZone({ 
  groupId, 
  children, 
  isOver 
}: { 
  groupId: string
  children: React.ReactNode
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({
    id: `group-${groupId}`,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`ml-8 mt-3 border-l-2 pl-4 min-h-[60px] rounded-r transition-colors ${
        isOver ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {children}
      {/* Always show drop area, even with children */}
      <div className={`mt-2 p-3 border-2 border-dashed rounded transition-colors ${
        isOver ? 'border-blue-400 dark:border-blue-600 bg-blue-100 dark:bg-blue-950/30' : 'border-gray-300 dark:border-gray-600'
      }`}>
        {isOver ? (
          <div className="text-sm text-blue-600 dark:text-blue-400 italic text-center">
            Drop here to add to group
          </div>
        ) : (
          <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center">
            Drop requirements here
          </div>
        )}
      </div>
    </div>
  )
}

// Sortable item component
function SortableRequirementItem({ 
  item, 
  onUpdate, 
  onDelete,
  level = 0,
  isOverGroup 
}: { 
  item: RequirementItem | GroupItem
  onUpdate: (id: string, requirement: RequirementNode) => void
  onDelete: (id: string) => void
  level?: number
  isOverGroup?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    data: { type: 'requirement', item }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isGroup = item.requirement.type === 'group'
  const groupItem = isGroup ? item as GroupItem : null
  const maxLevels = 4
  const indentClass = level > 0 ? `ml-${Math.min(level * 4, maxLevels * 4)}` : ''

  return (
    <div className={`mb-2 ${indentClass}`}>
      <div ref={setNodeRef} style={style}>
        <Card className={`${isDragging ? 'shadow-lg' : ''} ${isGroup ? 'border-l-4' : ''} ${isOverGroup ? 'ring-2 ring-blue-400' : ''}`}
              style={isGroup ? { borderLeftColor: getGroupLogicColor((item.requirement as RequirementGroup).logic) } : {}}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100 touch-none"
              >
                <Grip className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex-1">
                <RequirementForm 
                  requirement={item.requirement}
                  onChange={(updated) => onUpdate(item.id, updated)}
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Render children for groups with drop zone */}
      {groupItem && (
        <DroppableGroupZone 
          groupId={item.id}
          isOver={isOverGroup || false}
        >
          <SortableContext items={groupItem.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {groupItem.children.map((child) => (
              <SortableRequirementItem
                key={child.id}
                item={child}
                onUpdate={onUpdate}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </SortableContext>
        </DroppableGroupZone>
      )}
    </div>
  )
}

// Form component for editing individual requirements
function RequirementForm({ 
  requirement, 
  onChange 
}: { 
  requirement: RequirementNode
  onChange: (updated: RequirementNode) => void 
}) {
  const handleFieldChange = useCallback((field: string, value: unknown) => {
    onChange({ ...requirement, [field]: value })
  }, [requirement, onChange])

  switch (requirement.type) {
    case 'group':
      const group = requirement as RequirementGroup
      return (
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: getGroupLogicColor(group.logic) + '20' }}>
            Group
          </Badge>
          <select
            value={group.logic}
            onChange={(e) => handleFieldChange('logic', e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="ALL_OF">ALL OF (AND)</option>
            <option value="ONE_OF">ONE OF (OR)</option>
            <option value="TWO_OF">TWO OF</option>
          </select>
        </div>
      )

    case 'course':
      const course = requirement as RequirementCourse
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Course</Badge>
            <input
              type="text"
              placeholder="Dept"
              value={course.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              className="px-2 py-1 border rounded text-sm w-16"
            />
            <input
              type="text"
              placeholder="Number"
              value={course.number}
              onChange={(e) => handleFieldChange('number', e.target.value)}
              className="px-2 py-1 border rounded text-sm w-16"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Min Grade"
              value={course.minGrade || ''}
              onChange={(e) => handleFieldChange('minGrade', e.target.value || undefined)}
              className="px-2 py-1 border rounded text-sm w-20"
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={course.canBeTakenConcurrently === 'true'}
                onChange={(e) => handleFieldChange('canBeTakenConcurrently', e.target.checked ? 'true' : undefined)}
              />
              <span>Can be concurrent</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={course.orEquivalent === 'true'}
                onChange={(e) => handleFieldChange('orEquivalent', e.target.checked ? 'true' : undefined)}
              />
              <span>Or Equivalent</span>
            </label>
          </div>
        </div>
      )

    case 'HSCourse':
      const hsCourse = requirement as RequirementHSCourse
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">HS Course</Badge>
            <input
              type="text"
              placeholder="Course name"
              value={hsCourse.course}
              onChange={(e) => handleFieldChange('course', e.target.value)}
              className="px-2 py-1 border rounded text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Min Grade"
              value={hsCourse.minGrade || ''}
              onChange={(e) => handleFieldChange('minGrade', e.target.value || undefined)}
              className="px-2 py-1 border rounded text-sm w-20"
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hsCourse.orEquivalent === 'true'}
                onChange={(e) => handleFieldChange('orEquivalent', e.target.checked ? 'true' : undefined)}
              />
              <span>Or Equivalent</span>
            </label>
          </div>
        </div>
      )

    case 'CGPA':
      const cgpa = requirement as RequirementCGPA
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">CGPA</Badge>
          <span className="text-sm">Min:</span>
          <input
            type="number"
            step="0.01"
            value={cgpa.minCGPA}
            onChange={(e) => handleFieldChange('minCGPA', parseFloat(e.target.value))}
            className="px-2 py-1 border rounded text-sm w-20"
          />
        </div>
      )

    case 'UDGPA':
      const udgpa = requirement as RequirementUDGPA
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">UD GPA</Badge>
          <span className="text-sm">Min:</span>
          <input
            type="number"
            step="0.01"
            value={udgpa.minUDGPA}
            onChange={(e) => handleFieldChange('minUDGPA', parseFloat(e.target.value))}
            className="px-2 py-1 border rounded text-sm w-20"
          />
        </div>
      )

    case 'creditCount':
      const credits = requirement as RequirementCreditCount
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Credits</Badge>
            <input
              type="number"
              value={credits.credits}
              onChange={(e) => handleFieldChange('credits', parseInt(e.target.value))}
              className="px-2 py-1 border rounded text-sm w-16"
            />
            <span className="text-sm">credits</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Department(s)"
              value={Array.isArray(credits.department) ? credits.department.join(', ') : (credits.department || '')}
              onChange={(e) => {
                const value = e.target.value
                const departments = value.includes(',') ? value.split(',').map(d => d.trim()) : value
                handleFieldChange('department', departments || undefined)
              }}
              className="px-2 py-1 border rounded text-sm w-32"
            />
            <select
              value={credits.level || ''}
              onChange={(e) => handleFieldChange('level', e.target.value || undefined)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">Any Level</option>
              <option value="1XX">100-level</option>
              <option value="2XX">200-level</option>
              <option value="3XX">300-level</option>
              <option value="4XX">400-level</option>
              <option value="LD">Lower Division</option>
              <option value="UD">Upper Division</option>
            </select>
            <input
              type="text"
              placeholder="Min Grade"
              value={credits.minGrade || ''}
              onChange={(e) => handleFieldChange('minGrade', e.target.value || undefined)}
              className="px-2 py-1 border rounded text-sm w-20"
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={credits.canBeTakenConcurrently === 'true'}
                onChange={(e) => handleFieldChange('canBeTakenConcurrently', e.target.checked ? 'true' : undefined)}
              />
              <span>Concurrent</span>
            </label>
          </div>
        </div>
      )

    case 'courseCount':
      const courseCount = requirement as RequirementCourseCount
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Course Count</Badge>
            <input
              type="number"
              value={courseCount.count}
              onChange={(e) => handleFieldChange('count', parseInt(e.target.value))}
              className="px-2 py-1 border rounded text-sm w-16"
            />
            <span className="text-sm">courses</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Department(s)"
              value={Array.isArray(courseCount.department) ? courseCount.department.join(', ') : (courseCount.department || '')}
              onChange={(e) => {
                const value = e.target.value
                const departments = value.includes(',') ? value.split(',').map(d => d.trim()) : value
                handleFieldChange('department', departments || undefined)
              }}
              className="px-2 py-1 border rounded text-sm w-32"
            />
            <select
              value={courseCount.level || ''}
              onChange={(e) => handleFieldChange('level', e.target.value || undefined)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">Any Level</option>
              <option value="1XX">100-level</option>
              <option value="2XX">200-level</option>
              <option value="3XX">300-level</option>
              <option value="4XX">400-level</option>
              <option value="LD">Lower Division</option>
              <option value="UD">Upper Division</option>
            </select>
            <input
              type="text"
              placeholder="Min Grade"
              value={courseCount.minGrade || ''}
              onChange={(e) => handleFieldChange('minGrade', e.target.value || undefined)}
              className="px-2 py-1 border rounded text-sm w-20"
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={courseCount.canBeTakenConcurrently === 'true'}
                onChange={(e) => handleFieldChange('canBeTakenConcurrently', e.target.checked ? 'true' : undefined)}
              />
              <span>Can be concurrent</span>
            </label>
          </div>
        </div>
      )

    case 'program':
      const program = requirement as RequirementProgram
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">Program</Badge>
          <input
            type="text"
            placeholder="Program name"
            value={program.program}
            onChange={(e) => handleFieldChange('program', e.target.value)}
            className="px-2 py-1 border rounded text-sm flex-1"
          />
        </div>
      )

    case 'permission':
      const permission = requirement as RequirementPermission
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">Permission</Badge>
          <input
            type="text"
            placeholder="Permission note"
            value={permission.note}
            onChange={(e) => handleFieldChange('note', e.target.value)}
            className="px-2 py-1 border rounded text-sm flex-1"
          />
        </div>
      )

    case 'other':
      const other = requirement as RequirementOther
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">Other</Badge>
          <input
            type="text"
            placeholder="Description"
            value={other.note}
            onChange={(e) => handleFieldChange('note', e.target.value)}
            className="px-2 py-1 border rounded text-sm flex-1"
          />
        </div>
      )

    default:
      return <div>Unknown requirement type</div>
  }
}

export function RequirementDndEditor(props: RequirementEditorProps) {
  const { prerequisiteText = '', onSave, onSkip, onExport, onRequirementChange, loading = false, submitState = 'idle' } = props

  const [items, setItems] = useState<(RequirementItem | GroupItem)[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Find an item by ID, searching recursively through groups
  const findItem = (id: string): RequirementItem | GroupItem | null => {
    const search = (items: (RequirementItem | GroupItem)[]): RequirementItem | GroupItem | null => {
      for (const item of items) {
        if (item.id === id) return item
        if (item.requirement.type === 'group') {
          const found = search((item as GroupItem).children)
          if (found) return found
        }
      }
      return null
    }
    return search(items)
  }

  // Remove an item from wherever it is in the tree
  const removeItem = (id: string, fromItems: (RequirementItem | GroupItem)[]): (RequirementItem | GroupItem)[] => {
    return fromItems.filter(item => {
      if (item.id === id) return false
      if (item.requirement.type === 'group') {
        const groupItem = item as GroupItem
        groupItem.children = removeItem(id, groupItem.children)
      }
      return true
    })
  }

  // Add an item to a specific parent group
  const addToGroup = (groupId: string, newItem: RequirementItem | GroupItem, toItems: (RequirementItem | GroupItem)[]): (RequirementItem | GroupItem)[] => {
    return toItems.map(item => {
      if (item.id === groupId && item.requirement.type === 'group') {
        const groupItem = item as GroupItem
        return {
          ...groupItem,
          children: [...groupItem.children, newItem]
        }
      }
      if (item.requirement.type === 'group') {
        const groupItem = item as GroupItem
        return {
          ...groupItem,
          children: addToGroup(groupId, newItem, groupItem.children)
        }
      }
      return item
    })
  }

  // Generate JSON from current items
  const currentRequirementJSON = React.useMemo(() => {
    if (items.length === 0) return null
    
    const buildRequirement = (item: RequirementItem | GroupItem): RequirementNode => {
      if (item.requirement.type === 'group') {
        const groupItem = item as GroupItem
        return {
          ...item.requirement,
          children: groupItem.children.map(buildRequirement)
        } as RequirementGroup
      }
      return item.requirement
    }

    if (items.length === 1) {
      return buildRequirement(items[0])
    }

    // Multiple root items - wrap in ALL_OF group
    return {
      type: 'group',
      logic: 'ALL_OF',
      children: items.map(buildRequirement)
    } as RequirementGroup
  }, [items])

  React.useEffect(() => {
    onRequirementChange?.(currentRequirementJSON)
  }, [currentRequirementJSON, onRequirementChange])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id as string | null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle dragging from sidebar
    if (activeId.startsWith('sidebar-')) {
      const requirement = active.data.current?.requirement as RequirementNode
      if (!requirement) return

      if (overId.startsWith('group-')) {
        // Drag from sidebar to group
        const groupId = overId.replace('group-', '')
        addRequirement(requirement.type, requirement, groupId)
      } else if (overId === 'main-area') {
        // Drag from sidebar to main area
        addRequirement(requirement.type, requirement)
      }
      return
    }

    // Handle moving existing items
    if (overId.startsWith('group-')) {
      const groupId = overId.replace('group-', '')
      const draggedItem = findItem(activeId)
      
      if (!draggedItem) return

      setItems(prev => {
        // Remove the item from its current location
        let newItems = removeItem(activeId, prev)
        // Add it to the target group
        newItems = addToGroup(groupId, draggedItem, newItems)
        return newItems
      })
    } else if (overId === 'main-area') {
      // Move item to main area (remove from any group)
      const draggedItem = findItem(activeId)
      if (!draggedItem) return

      setItems(prev => {
        // Remove the item from its current location
        let newItems = removeItem(activeId, prev)
        // Add it to the root level
        newItems = [...newItems, { ...draggedItem, parentId: undefined }]
        return newItems
      })
    }
    // Handle other reordering logic as needed
  }

  const addRequirement = (type: string, requirement: RequirementNode, parentId?: string) => {
    const newItem: RequirementItem | GroupItem = {
      id: generateNodeId(),
      requirement,
      parentId
    }

    if (requirement.type === 'group') {
      (newItem as GroupItem).children = []
    }

    if (parentId) {
      // Add to parent group
      setItems(prev => prev.map(item => {
        if (item.id === parentId && item.requirement.type === 'group') {
          const groupItem = item as GroupItem
          return {
            ...groupItem,
            children: [...groupItem.children, newItem]
          }
        }
        return item
      }))
    } else {
      // Add to root level
      setItems(prev => [...prev, newItem])
    }
  }

  const updateRequirement = (id: string, requirement: RequirementNode) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, requirement }
      }
      if (item.requirement.type === 'group') {
        const groupItem = item as GroupItem
        return {
          ...groupItem,
          children: groupItem.children.map(child => 
            child.id === id ? { ...child, requirement } : child
          )
        }
      }
      return item
    }))
  }

  const deleteRequirement = (id: string) => {
    setItems(prev => prev.filter(item => {
      if (item.id === id) return false
      if (item.requirement.type === 'group') {
        const groupItem = item as GroupItem
        groupItem.children = groupItem.children.filter(child => child.id !== id)
      }
      return true
    }))
  }

  const handleClear = () => setItems([])
  const handleSave = () => currentRequirementJSON && onSave?.(currentRequirementJSON)
  const handleExport = () => currentRequirementJSON && onExport?.(currentRequirementJSON)

  // Parse prerequisite text for auto-suggestions
  const parsedPrerequisites = parsePrerequisiteText(prerequisiteText)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r">
          <Card className="h-full rounded-none border-0 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Add Requirements</CardTitle>
              <p className="text-sm text-gray-500">Click or drag to add</p>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                
                {/* Auto-detected courses */}
                {(parsedPrerequisites.courses.length > 0 || parsedPrerequisites.hsCourses.length > 0) && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center">
                      <Badge variant="secondary" className="mr-2">AUTO</Badge>
                      Detected Courses
                    </h3>
                    <div className="space-y-1">
                      {parsedPrerequisites.courses.map((course, index) => (
                        <DraggableSidebarItem
                          key={`course-${index}`}
                          id={`auto-course-${index}`}
                          requirement={course}
                          onClick={() => addRequirement('course', course)}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                          >
                            {course.department} {course.number}
                          </Button>
                        </DraggableSidebarItem>
                      ))}
                      {parsedPrerequisites.hsCourses.map((hsCourse, index) => (
                        <DraggableSidebarItem
                          key={`hs-${index}`}
                          id={`auto-hs-${index}`}
                          requirement={hsCourse}
                          onClick={() => addRequirement('HSCourse', hsCourse)}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                          >
                            {hsCourse.course}
                          </Button>
                        </DraggableSidebarItem>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                )}

                {/* Logic Groups */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Logic Groups</h3>
                  <div className="space-y-1">
                    {(['ALL_OF', 'ONE_OF', 'TWO_OF'] as const).map((logic) => (
                      <DraggableSidebarItem
                        key={logic}
                        id={`group-${logic}`}
                        requirement={{ type: 'group', logic, children: [] }}
                        onClick={() => addRequirement('group', { type: 'group', logic, children: [] })}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          {logic.replace('_', ' ')}
                        </Button>
                      </DraggableSidebarItem>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>

                {/* Other requirement types */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Requirements</h3>
                  <div className="space-y-1">
                    <DraggableSidebarItem
                      id="course"
                      requirement={{ type: 'course', department: '', number: '' }}
                      onClick={() => addRequirement('course', { type: 'course', department: '', number: '' })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        University Course
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="HSCourse"
                      requirement={{ type: 'HSCourse', course: '' }}
                      onClick={() => addRequirement('HSCourse', { type: 'HSCourse', course: '' })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        High School Course
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="CGPA"
                      requirement={{ type: 'CGPA', minCGPA: 2.0 }}
                      onClick={() => addRequirement('CGPA', { type: 'CGPA', minCGPA: 2.0 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Cumulative GPA
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="UDGPA"
                      requirement={{ type: 'UDGPA', minUDGPA: 2.0 }}
                      onClick={() => addRequirement('UDGPA', { type: 'UDGPA', minUDGPA: 2.0 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Upper Division GPA
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="creditCount"
                      requirement={{ type: 'creditCount', credits: 0 }}
                      onClick={() => addRequirement('creditCount', { type: 'creditCount', credits: 0 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Credit Count
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="courseCount"
                      requirement={{ type: 'courseCount', count: 1 }}
                      onClick={() => addRequirement('courseCount', { type: 'courseCount', count: 1 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Course Count
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="program"
                      requirement={{ type: 'program', program: '' }}
                      onClick={() => addRequirement('program', { type: 'program', program: '' })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Program Requirement
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="permission"
                      requirement={{ type: 'permission', note: '' }}
                      onClick={() => addRequirement('permission', { type: 'permission', note: '' })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Permission Required
                      </Button>
                    </DraggableSidebarItem>
                    <DraggableSidebarItem
                      id="other"
                      requirement={{ type: 'other', note: '' }}
                      onClick={() => addRequirement('other', { type: 'other', note: '' })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Other Requirement
                      </Button>
                    </DraggableSidebarItem>
                  </div>
                </div>
                  </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        {/* Main Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold">Requirement Builder</h2>
                <Badge variant="outline">{items.length} item{items.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleClear} disabled={items.length === 0}>
                  <Trash2 className="w-4 h-4 mr-2" />Clear
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={!currentRequirementJSON}>
                  <Download className="w-4 h-4 mr-2"/>Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={onSkip}>
                  <SkipForward className="w-4 h-4 mr-2"/>Skip
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!currentRequirementJSON || loading}>
                  <Save className="w-4 h-4 mr-2"/>
                  {loading ? 'Sending...' : (submitState === 'success' ? 'Submitted! Click here for next course.' : 'Submit')}
                </Button>
              </div>
            </div>
          </div>

          {/* Drag and Drop Area */}
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col">
              <MainDroppableArea>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {items.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <p className="text-gray-500">No requirements added yet</p>
                        <p className="text-sm text-gray-400 mt-1">Click or drag items from the sidebar to add them</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {items.map((item) => (
                        <SortableRequirementItem
                          key={item.id}
                          item={item}
                          onUpdate={updateRequirement}
                          onDelete={deleteRequirement}
                          isOverGroup={overId === `group-${item.id}`}
                        />
                      ))}
                    </div>
                  )}
                </SortableContext>
              </MainDroppableArea>
            </div>

            {/* JSON Preview */}
            <div className="w-96 border-l">
              <Card className="h-full rounded-none border-0 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">JSON Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                    {currentRequirementJSON ? (
                      <pre className="text-xs p-3 rounded whitespace-pre-wrap">
                        {JSON.stringify(currentRequirementJSON, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">No requirements added yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <Card className="opacity-80">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Grip className="h-4 w-4 text-gray-400" />
                <span>Dragging requirement...</span>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export function RequirementDndEditorProvider(props: RequirementEditorProps) {
  return <RequirementDndEditor {...props} />
}