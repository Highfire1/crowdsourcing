'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  RequirementNode, 
  RequirementGroup, 
  RequirementCourse, 
  RequirementHSCourse,
  RequirementProgram,
  RequirementCGPA,
  RequirementUDGPA,
  RequirementCreditCount,
  RequirementCourseCount,
  RequirementPermission,
  RequirementOther
} from '@/lib/course_types'
import { getGroupLogicColor } from '@/lib/prerequisite-parser'
import { NodeResizer } from '@xyflow/react'

export interface NodeData {
  label: string
  requirementData: RequirementNode
  onChange?: (data: RequirementNode) => void
}

// Group/Subflow Node Component
export function GroupNode({ data, id }: { data: NodeData & { __highlight?: boolean }, id: string }) {
  const groupData = data.requirementData as RequirementGroup
  
  const handleLogicChange = (logic: 'ALL_OF' | 'ONE_OF' | 'TWO_OF') => {
    const updated = { ...groupData, logic }
    data.onChange?.(updated)
  }

  const borderColor = getGroupLogicColor(groupData.logic)
  
  return (
    <Card 
      className={"min-w-[300px] min-h-[200px] h-full relative " + (data.__highlight ? 'ring-4 ring-blue-300/40' : '')} 
      style={{ borderColor, borderWidth: '3px', willChange: 'transform' }}
    >
      {/* Resizer for group node */}
      <NodeResizer nodeId={id} minWidth={200} minHeight={120} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Group</CardTitle>
          <Badge 
            variant="outline" 
            style={{ backgroundColor: borderColor + '20', color: borderColor }}
          >
            {groupData.logic.replace('_', ' ')}
          </Badge>
        </div>
        <Select value={groupData.logic} onValueChange={handleLogicChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_OF">ALL OF (AND)</SelectItem>
            <SelectItem value="ONE_OF">ONE OF (OR)</SelectItem>
            <SelectItem value="TWO_OF">TWO OF</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="text-xs text-gray-500 flex-1">
        Drop nodes inside this group
        {data.__highlight ? (
          <div className="pointer-events-none absolute inset-0 rounded" />
        ) : null}
      </CardContent>
    </Card>
  )
}

// University Course Node
export function CourseNode({ data }: { data: NodeData }) {
  const courseData = data.requirementData as RequirementCourse
  
  const handleChange = (field: keyof RequirementCourse, value: string | undefined) => {
    const updated = { ...courseData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">University Course</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Department</Label>
            <Input 
              value={courseData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="h-8 text-xs"
              placeholder="ECON"
            />
          </div>
          <div>
            <Label className="text-xs">Number</Label>
            <Input 
              value={courseData.number}
              onChange={(e) => handleChange('number', e.target.value)}
              className="h-8 text-xs"
              placeholder="103"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-xs">Minimum Grade</Label>
          <Select 
            value={courseData.minGrade || 'none'} 
            onValueChange={(value: string) => handleChange('minGrade', value === 'none' ? undefined : value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No minimum</SelectItem>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="C+">C+</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="C-">C-</SelectItem>
              <SelectItem value="D">D</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="concurrent"
            checked={courseData.canBeTakenConcurrently === 'true'}
            onCheckedChange={(checked) => handleChange('canBeTakenConcurrently', checked ? 'true' : undefined)}
          />
          <Label htmlFor="concurrent" className="text-xs">Can be taken concurrently</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="equivalent"
            checked={courseData.orEquivalent === 'true'}
            onCheckedChange={(checked) => handleChange('orEquivalent', checked ? 'true' : undefined)}
          />
          <Label htmlFor="equivalent" className="text-xs">Or equivalent</Label>
        </div>
      </CardContent>
    </Card>
  )
}

// High School Course Node
export function HSCourseNode({ data }: { data: NodeData }) {
  const hsCourseData = data.requirementData as RequirementHSCourse
  
  const handleChange = (field: keyof RequirementHSCourse, value: string | undefined) => {
    const updated = { ...hsCourseData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">High School Course</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Course</Label>
          <Input 
            value={hsCourseData.course}
            onChange={(e) => handleChange('course', e.target.value)}
            className="h-8 text-xs"
            placeholder="BC Math 12"
          />
        </div>
        
        <div>
          <Label className="text-xs">Minimum Grade</Label>
          <Input 
            value={hsCourseData.minGrade || ''}
            onChange={(e) => handleChange('minGrade', e.target.value || undefined)}
            className="h-8 text-xs"
            placeholder="Optional (e.g., 75%)"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hs-equivalent"
            checked={hsCourseData.orEquivalent === 'true'}
            onCheckedChange={(checked) => handleChange('orEquivalent', checked ? 'true' : undefined)}
          />
          <Label htmlFor="hs-equivalent" className="text-xs">Or equivalent</Label>
        </div>
      </CardContent>
    </Card>
  )
}

// Program Requirement Node
export function ProgramNode({ data }: { data: NodeData }) {
  const programData = data.requirementData as RequirementProgram
  
  const handleChange = (field: keyof RequirementProgram, value: string) => {
    const updated = { ...programData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Program Requirement</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label className="text-xs">Program</Label>
          <Input 
            value={programData.program}
            onChange={(e) => handleChange('program', e.target.value)}
            className="h-8 text-xs"
            placeholder="Business Administration"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// CGPA Node
export function CGPANode({ data }: { data: NodeData }) {
  const cgpaData = data.requirementData as RequirementCGPA
  
  const handleChange = (field: keyof RequirementCGPA, value: number) => {
    const updated = { ...cgpaData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Cumulative GPA</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label className="text-xs">Minimum CGPA</Label>
          <Input 
            type="number"
            step="0.01"
            min="0"
            max="4.33"
            value={cgpaData.minCGPA}
            onChange={(e) => handleChange('minCGPA', parseFloat(e.target.value))}
            className="h-8 text-xs"
            placeholder="2.50"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// UDGPA Node
export function UDGPANode({ data }: { data: NodeData }) {
  const udgpaData = data.requirementData as RequirementUDGPA
  
  const handleChange = (field: keyof RequirementUDGPA, value: number) => {
    const updated = { ...udgpaData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Upper Division GPA</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label className="text-xs">Minimum UD GPA</Label>
          <Input 
            type="number"
            step="0.01"
            min="0"
            max="4.33"
            value={udgpaData.minUDGPA}
            onChange={(e) => handleChange('minUDGPA', parseFloat(e.target.value))}
            className="h-8 text-xs"
            placeholder="2.50"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Credit Count Node
export function CreditCountNode({ data }: { data: NodeData }) {
  const creditData = data.requirementData as RequirementCreditCount
  
  const handleChange = (field: keyof RequirementCreditCount, value: number | string | string[] | undefined) => {
    const updated = { ...creditData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Credit Count</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Credits Required</Label>
          <Input 
            type="number"
            min="0"
            value={creditData.credits}
            onChange={(e) => handleChange('credits', parseInt(e.target.value))}
            className="h-8 text-xs"
            placeholder="6"
          />
        </div>
        
        <div>
          <Label className="text-xs">Department (optional)</Label>
          <Input 
            value={Array.isArray(creditData.department) ? creditData.department.join(', ') : (creditData.department || '')}
            onChange={(e) => {
              const value = e.target.value.trim()
              handleChange('department', value ? value.split(',').map(d => d.trim()) : undefined)
            }}
            className="h-8 text-xs"
            placeholder="ECON, MATH"
          />
        </div>
        
        <div>
          <Label className="text-xs">Level</Label>
          <Select 
            value={creditData.level || 'any'} 
            onValueChange={(value: string) => handleChange('level', value === 'any' ? undefined : value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any level</SelectItem>
              <SelectItem value="1XX">100-level</SelectItem>
              <SelectItem value="2XX">200-level</SelectItem>
              <SelectItem value="3XX">300-level</SelectItem>
              <SelectItem value="4XX">400-level</SelectItem>
              <SelectItem value="LD">Lower Division</SelectItem>
              <SelectItem value="UD">Upper Division</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

// Course Count Node (similar to Credit Count but counts courses instead of credits)
export function CourseCountNode({ data }: { data: NodeData }) {
  const courseCountData = data.requirementData as RequirementCourseCount
  
  const handleChange = (field: keyof RequirementCourseCount, value: number | string | string[] | undefined) => {
    const updated = { ...courseCountData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Course Count</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Courses Required</Label>
          <Input 
            type="number"
            min="0"
            value={courseCountData.count}
            onChange={(e) => handleChange('count', parseInt(e.target.value))}
            className="h-8 text-xs"
            placeholder="2"
          />
        </div>
        
        <div>
          <Label className="text-xs">Department (optional)</Label>
          <Input 
            value={Array.isArray(courseCountData.department) ? courseCountData.department.join(', ') : (courseCountData.department || '')}
            onChange={(e) => {
              const value = e.target.value.trim()
              handleChange('department', value ? value.split(',').map(d => d.trim()) : undefined)
            }}
            className="h-8 text-xs"
            placeholder="ECON, MATH"
          />
        </div>
        
        <div>
          <Label className="text-xs">Level</Label>
          <Select 
            value={courseCountData.level || 'any'} 
            onValueChange={(value: string) => handleChange('level', value === 'any' ? undefined : value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any level</SelectItem>
              <SelectItem value="1XX">100-level</SelectItem>
              <SelectItem value="2XX">200-level</SelectItem>
              <SelectItem value="3XX">300-level</SelectItem>
              <SelectItem value="4XX">400-level</SelectItem>
              <SelectItem value="LD">Lower Division</SelectItem>
              <SelectItem value="UD">Upper Division</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

// Permission Node
export function PermissionNode({ data }: { data: NodeData }) {
  const permissionData = data.requirementData as RequirementPermission
  
  const handleChange = (field: keyof RequirementPermission, value: string) => {
    const updated = { ...permissionData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Permission Required</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label className="text-xs">Note</Label>
          <Input 
            value={permissionData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="h-8 text-xs"
            placeholder="Instructor permission required"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Other/Miscellaneous Node
export function OtherNode({ data }: { data: NodeData }) {
  const otherData = data.requirementData as RequirementOther
  
  const handleChange = (field: keyof RequirementOther, value: string) => {
    const updated = { ...otherData, [field]: value }
    data.onChange?.(updated)
  }

  return (
    <Card className="w-[250px]" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Other Requirement</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label className="text-xs">Description</Label>
          <Input 
            value={otherData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="h-8 text-xs"
            placeholder="Special requirement description"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Node type mapping

// Comparator that avoids re-rendering node content when only the node position changes.
// It does a cheap reference check first and falls back to a JSON stringify compare for
// data when references differ. This keeps drag performance acceptable while still
// updating when the node's data (requirement) changes.
function nodePropsAreEqual(prev: unknown, next: unknown) {
  try {
    if (prev === next) return true
    const p = prev as { data?: unknown; selected?: boolean }
    const n = next as { data?: unknown; selected?: boolean }
    // If the data reference didn't change, we don't need to re-render the node.
    if (p.data === n.data) return true
    // Keep selection/dragging updates through, but if only position changed React Flow
    // typically doesn't touch `data`, so this prevents extra renders.
    if (p.selected !== n.selected) return false
    // Fallback: deep compare data objects if references differ (rare for our usage).
    return JSON.stringify(p.data) === JSON.stringify(n.data)
  } catch {
    return false
  }
}

const MemoGroupNode = React.memo(GroupNode, nodePropsAreEqual)
const MemoCourseNode = React.memo(CourseNode, nodePropsAreEqual)
const MemoHSCourseNode = React.memo(HSCourseNode, nodePropsAreEqual)
const MemoProgramNode = React.memo(ProgramNode, nodePropsAreEqual)
const MemoCGPANode = React.memo(CGPANode, nodePropsAreEqual)
const MemoUDGPANode = React.memo(UDGPANode, nodePropsAreEqual)
const MemoCreditCountNode = React.memo(CreditCountNode, nodePropsAreEqual)
const MemoCourseCountNode = React.memo(CourseCountNode, nodePropsAreEqual)
const MemoPermissionNode = React.memo(PermissionNode, nodePropsAreEqual)
const MemoOtherNode = React.memo(OtherNode, nodePropsAreEqual)

export const nodeTypes = {
  group: MemoGroupNode,
  course: MemoCourseNode,
  HSCourse: MemoHSCourseNode,
  program: MemoProgramNode,
  CGPA: MemoCGPANode,
  UDGPA: MemoUDGPANode,
  creditCount: MemoCreditCountNode,
  courseCount: MemoCourseCountNode,
  permission: MemoPermissionNode,
  other: MemoOtherNode,
}