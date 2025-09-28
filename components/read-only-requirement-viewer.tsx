'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { Separator } from '@/components/ui/separator'
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
import { getGroupLogicColor } from '@/lib/prerequisite-parser'

interface ReadOnlyRequirementViewerProps {
  requirements: RequirementNode
}

function ReadOnlyRequirementItem({ requirement }: { requirement: RequirementNode }) {
  const renderRequirement = () => {
    switch (requirement.type) {
      case 'group':
        const group = requirement as RequirementGroup
        return (
          <Card className="mb-2">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${getGroupLogicColor(group.logic)} text-white border-0`}
                >
                  {group.logic.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-gray-600">
                  {group.logic === 'ALL_OF' ? 'All of the following:' : 
                   group.logic === 'ONE_OF' ? 'Any one of the following:' :
                   'Any two of the following:'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {group.children.map((child, index) => (
                  <ReadOnlyRequirementItem key={index} requirement={child} />
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'course':
        const course = requirement as RequirementCourse
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Badge variant="secondary">Course</Badge>
            <span className="font-mono text-sm">
              {course.department} {course.number}
            </span>
            {course.minGrade && (
              <Badge variant="outline" className="ml-auto">
                Min Grade: {course.minGrade}
              </Badge>
            )}
          </div>
        )

      case 'HSCourse':
        const hsCourse = requirement as RequirementHSCourse
        return (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <Badge variant="secondary" className="bg-blue-100">HS Course</Badge>
            <span className="text-sm">{hsCourse.course}</span>
            {hsCourse.minGrade && (
              <Badge variant="outline" className="ml-auto">
                Min Grade: {hsCourse.minGrade}
              </Badge>
            )}
          </div>
        )

      case 'CGPA':
        const cgpa = requirement as RequirementCGPA
        return (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <Badge variant="secondary" className="bg-green-100">CGPA</Badge>
            <span className="text-sm">
              Minimum {cgpa.minCGPA} CGPA
            </span>
          </div>
        )

      case 'UDGPA':
        const udGpa = requirement as RequirementUDGPA
        return (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <Badge variant="secondary" className="bg-green-100">UD GPA</Badge>
            <span className="text-sm">
              Minimum {udGpa.minUDGPA} upper division GPA
            </span>
          </div>
        )

      case 'creditCount':
        const creditCount = requirement as RequirementCreditCount
        return (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
            <Badge variant="secondary" className="bg-yellow-100">Credits</Badge>
            <span className="text-sm">
              {creditCount.credits} credits
              {creditCount.level && ` at ${creditCount.level} level`}
              {creditCount.department && (
                <span> in {Array.isArray(creditCount.department) ? creditCount.department.join(', ') : creditCount.department}</span>
              )}
            </span>
          </div>
        )

      case 'courseCount':
        const courseCount = requirement as RequirementCourseCount
        return (
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
            <Badge variant="secondary" className="bg-purple-100">Course Count</Badge>
            <span className="text-sm">
              {courseCount.count} courses
              {courseCount.level && ` at ${courseCount.level} level`}
              {courseCount.department && (
                <span> in {Array.isArray(courseCount.department) ? courseCount.department.join(', ') : courseCount.department}</span>
              )}
            </span>
          </div>
        )

      case 'program':
        const program = requirement as RequirementProgram
        return (
          <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded">
            <Badge variant="secondary" className="bg-indigo-100">Program</Badge>
            <span className="text-sm">{program.program}</span>
          </div>
        )

      case 'permission':
        const permission = requirement as RequirementPermission
        return (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
            <Badge variant="secondary" className="bg-orange-100">Permission</Badge>
            <span className="text-sm">{permission.note}</span>
          </div>
        )

      case 'other':
        const other = requirement as RequirementOther
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Badge variant="secondary">Other</Badge>
            <span className="text-sm">{other.note}</span>
          </div>
        )

      default:
        return (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
            <Badge variant="destructive">Unknown</Badge>
            <span className="text-sm">Unknown requirement type</span>
          </div>
        )
    }
  }

  return renderRequirement()
}

export function ReadOnlyRequirementViewer({ requirements }: ReadOnlyRequirementViewerProps) {
  return (
    <div className="h-full flex">
      {/* Main content - requirement tree */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Requirements Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <ReadOnlyRequirementItem requirement={requirements} />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right sidebar - JSON preview */}
      <div className="w-80 border-l">
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle className="text-sm">JSON Structure</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap">
                {JSON.stringify(requirements, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}