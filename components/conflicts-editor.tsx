import React, { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, GripVertical, Plus } from "lucide-react"
import { CreditConflict, ConflictEquivalentCourse, ConflictOther } from '@/lib/course_types'
import { parsePrerequisiteText } from '@/lib/prerequisite-parser'

interface ConflictsEditorProps {
  notesText?: string
  initialConflicts?: CreditConflict[]
  onConflictsChange?: (conflicts: CreditConflict[]) => void
  // Current course being parsed (to exclude from conflicts)
  currentCourse?: {
    department: string
    number: string
  }
}

// Generate unique IDs for conflicts
let conflictIdCounter = 0
function generateConflictId(): string {
  return `conflict_${++conflictIdCounter}`
}

type ConflictWithId = (ConflictEquivalentCourse | ConflictOther) & { id: string }

function SortableConflictItem({ 
  conflict, 
  onUpdate, 
  onDelete 
}: { 
  conflict: ConflictWithId
  onUpdate: (id: string, updatedConflict: CreditConflict) => void
  onDelete: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: conflict.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleUpdate = (field: string, value: string) => {
    if (conflict.type === 'conflict_course') {
      const conflictData = conflict as ConflictEquivalentCourse
      onUpdate(conflict.id, {
        ...conflictData,
        [field]: value,
      } as ConflictEquivalentCourse)
    } else {
      const conflictData = conflict as ConflictOther
      onUpdate(conflict.id, {
        ...conflictData,
        [field]: value,
      } as ConflictOther)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-6 h-6 text-gray-400 cursor-grab hover:text-gray-600 dark:hover:text-gray-300"
      >
        <GripVertical size={16} />
      </div>

      <div className="flex-1 space-y-2">
        {conflict.type === 'conflict_course' ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Department (e.g., CMPT)"
              value={conflict.department}
              onChange={(e) => handleUpdate('department', e.target.value.toUpperCase())}
              className="font-mono text-sm"
            />
            <Input
              placeholder="Course Number (e.g., 120)"
              value={conflict.number}
              onChange={(e) => handleUpdate('number', e.target.value)}
              className="font-mono text-sm"
            />
            <Input
              placeholder="Course Title (optional)"
              value={conflict.title || ''}
              onChange={(e) => handleUpdate('title', e.target.value)}
              className="col-span-2 text-sm"
            />
          </div>
        ) : (
          <Textarea
            placeholder="Describe the conflict..."
            value={conflict.note}
            onChange={(e) => handleUpdate('note', e.target.value)}
            className="text-sm"
            rows={2}
          />
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(conflict.id)}
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  )
}

export function ConflictsEditor({ notesText, initialConflicts = [], onConflictsChange, currentCourse }: ConflictsEditorProps) {
  const [conflicts, setConflicts] = useState<ConflictWithId[]>(() => {
    return initialConflicts.map(conflict => ({
      ...conflict,
      id: generateConflictId()
    }))
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Auto-extract conflicts from notes text
  const extractedConflicts = useMemo(() => {
    if (!notesText) return []
    
    const parsed = parsePrerequisiteText(notesText)
    return parsed.courses
      .filter(course => {
        // Exclude the current course being parsed
        if (currentCourse && 
            course.department === currentCourse.department && 
            course.number === currentCourse.number) {
          return false
        }
        return true
      })
      .map(course => ({
        type: 'conflict_course' as const,
        department: course.department,
        number: course.number,
      }))
  }, [notesText, currentCourse])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = conflicts.findIndex(item => item.id === active.id)
      const newIndex = conflicts.findIndex(item => item.id === over.id)
      
      const newConflicts = arrayMove(conflicts, oldIndex, newIndex)
      setConflicts(newConflicts)
      onConflictsChange?.(newConflicts.map(({ id, ...conflict }) => conflict))
    }
  }

  const addConflict = (type: 'conflict_course' | 'conflict_other') => {
    const newConflict: ConflictWithId = type === 'conflict_course' 
      ? {
          id: generateConflictId(),
          type: 'conflict_course',
          department: '',
          number: '',
        }
      : {
          id: generateConflictId(),
          type: 'conflict_other',
          note: '',
        }

    const newConflicts = [...conflicts, newConflict]
    setConflicts(newConflicts)
    onConflictsChange?.(newConflicts.map(({ id, ...conflict }) => conflict))
  }

  const updateConflict = (id: string, updatedConflict: CreditConflict) => {
    const newConflicts = conflicts.map(conflict => 
      conflict.id === id ? { ...updatedConflict, id } : conflict
    )
    setConflicts(newConflicts)
    onConflictsChange?.(newConflicts.map(({ id, ...conflict }) => conflict))
  }

  const deleteConflict = (id: string) => {
    const newConflicts = conflicts.filter(conflict => conflict.id !== id)
    setConflicts(newConflicts)
    onConflictsChange?.(newConflicts.map(({ id, ...conflict }) => conflict))
  }

  const addExtractedConflicts = () => {
    const newConflicts = [...conflicts]
    
    extractedConflicts.forEach(extracted => {
      // Check if this course is already in the conflicts
      const exists = newConflicts.some(conflict => 
        conflict.type === 'conflict_course' && 
        (conflict as ConflictEquivalentCourse).department === extracted.department && 
        (conflict as ConflictEquivalentCourse).number === extracted.number
      )
      
      if (!exists) {
        newConflicts.push({
          ...extracted,
          id: generateConflictId()
        })
      }
    })
    
    setConflicts(newConflicts)
    onConflictsChange?.(newConflicts.map(({ id, ...conflict }) => conflict))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Credit Conflicts</h3>
        <div className="flex gap-2">
          {extractedConflicts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addExtractedConflicts}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Add from Notes ({extractedConflicts.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addConflict('conflict_course')}
          >
            <Plus size={16} className="mr-1" />
            Course
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addConflict('conflict_other')}
          >
            <Plus size={16} className="mr-1" />
            Other
          </Button>
        </div>
      </div>

      {conflicts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {/* <p>No credit conflicts defined.</p> */}
          <p className="text-sm">Add conflicts that students cannot receive credit for along with this course.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={conflicts.map(c => c.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {conflicts.map(conflict => (
                <SortableConflictItem
                  key={conflict.id}
                  conflict={conflict}
                  onUpdate={updateConflict}
                  onDelete={deleteConflict}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}