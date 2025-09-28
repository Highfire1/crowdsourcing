"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RequirementNode, RequirementGroup, RequirementCourse, RequirementProgram, RequirementPermission, RequirementOther } from '@/lib/course_types'
import { getGroupLogicColor } from '@/lib/prerequisite-parser'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ParseAttempt {
  id: string
  author: string
  created_at: string
  parsed_prerequisites?: RequirementNode
}

interface Props {
    course: {
        id?: number
        dept: string
        number: string
        title?: string | null
        description?: string | null
        prerequisites?: string | null
        corequisites?: string | null
        notes?: string | null
        parse_attempts: ParseAttempt[]
    }
    onNextCourse?: () => void
}

// Simple requirement renderer for inline display
function SimpleRequirementDisplay({ requirement }: { requirement: RequirementNode }) {
  const renderRequirement = (req: RequirementNode, depth = 0): React.ReactNode => {
    const indent = depth * 20
    
    switch (req.type) {
      case 'group':
        const group = req as RequirementGroup
        return (
          <div key={Math.random()} style={{ marginLeft: indent }}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`${getGroupLogicColor(group.logic)} border-0 text-xs`}>
                {group.logic.replace('_', ' ')}
              </Badge>
              <span className="text-sm ">
                {group.logic === 'ALL_OF' ? 'All of:' : 
                 group.logic === 'ONE_OF' ? 'Any one of:' : 'Any two of:'}
              </span>
            </div>
            <div className="space-y-1">
              {group.children.map((child, index) => (
                <div key={index}>{renderRequirement(child, depth + 1)}</div>
              ))}
            </div>
          </div>
        )
      
      case 'course':
        const course = req as RequirementCourse
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">Course</Badge>
            <span className="font-mono text-sm">{course.department} {course.number}</span>
            {course.minGrade && <Badge variant="outline" className="text-xs">Min: {course.minGrade}</Badge>}
          </div>
        )
      
      case 'program':
        const program = req as RequirementProgram
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs bg-indigo-100">Program</Badge>
            <span className="text-sm">{program.program}</span>
          </div>
        )
      
      case 'permission':
        const permission = req as RequirementPermission
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">Permission</Badge>
            <span className="text-sm">{permission.note}</span>
          </div>
        )
      
      case 'other':
        const other = req as RequirementOther
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">Other</Badge>
            <span className="text-sm">{other.note}</span>
          </div>
        )
      
      default:
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">{req.type}</Badge>
            <span className="text-sm">Unknown requirement</span>
          </div>
        )
    }
  }
  
  return <div className="space-y-1">{renderRequirement(requirement)}</div>
}

export default function VerifyPanel({ course, onNextCourse }: Props) {
    const [loading, setLoading] = React.useState(false)
    const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set())

    // Get all parse attempts with valid JSON, sorted by most recent first
    const validParseAttempts = course.parse_attempts
        .filter(attempt => attempt.parsed_prerequisites)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const toggleAttemptExpansion = (attemptId: string) => {
        const newExpanded = new Set(expandedAttempts)
        if (newExpanded.has(attemptId)) {
            newExpanded.delete(attemptId)
        } else {
            newExpanded.add(attemptId)
        }
        setExpandedAttempts(newExpanded)
    }

    const verify = async () => {
        if (!course) return
        setLoading(true)

        try {
            const res = await fetch('/api/verify/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dept: course.dept,
                    number: course.number,
                    verification_status: 'verified_correct',
                }),
            })

            if (!res.ok) {
                const text = await res.text()
                console.warn('Verify error', text || res.statusText)
                alert('Error saving verification')
            } else {
                // Move to next course
                if (onNextCourse) {
                    onNextCourse()
                }
            }
        } catch (err: unknown) {
            console.error('Verify error', err)
            alert('Error saving verification')
        } finally {
            setLoading(false)
        }
    }

    const skip = async () => {
        if (!course) return
        setLoading(true)

        try {
            // Use the parent component's next course handler which manages offset
            if (onNextCourse) {
                onNextCourse()
            }
        } catch (err: unknown) {
            console.error('Skip error', err)
        } finally {
            setLoading(false)
        }
    }

    const redirectToParse = () => {
        // Redirect to parse page with this course pre-loaded
        const params = new URLSearchParams({
            dept: course.dept,
            number: course.number
        })
        window.location.href = `/parse?${params.toString()}`
    }

    if (!course) {
        return (
            <div className="w-full h-full flex flex-col">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>No more courses</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        )
    }   

    return (
        <div className="w-full h-full flex flex-col">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>
                        <Link href={`/courses/${course.dept}/${course.number}`} className="text-blue-500 underline">
                            Verifying: {course.dept} {course.number} {course.title ? `- ${course.title}` : ''}
                        </Link>
                    </CardTitle>
                    <CardDescription className='text-md ml-4'>
                        <p>Prerequisites: {course.prerequisites || 'None'}</p>
                        <p>Corequisites: {course.corequisites || 'None.'}</p>
                        <p>Notes: {course.notes || 'None.'}</p>
                        <p className="mt-2">Parse attempts: {course.parse_attempts.length}</p>
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
                    {/* Action buttons */}
                    <div className="p-4 border-b flex gap-2">
                        <Button 
                            onClick={skip} 
                            variant="outline"
                            disabled={loading}
                        >
                            Skip
                        </Button>
                        <Button 
                            onClick={verify} 
                            variant="default"
                            disabled={loading || validParseAttempts.length === 0}
                        >
                            {loading ? 'Verifying...' : 'Verify Correct'}
                        </Button>
                        <Button 
                            onClick={redirectToParse} 
                            variant="destructive"
                            disabled={loading}
                        >
                            Something doesn&apos;t look right (reparse the course)
                        </Button>
                    </div>

                    {/* Parse attempts list */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {validParseAttempts.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                No valid parse attempts found for this course
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {validParseAttempts.map((attempt, index) => (
                                    <Card key={attempt.id} className="border">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">
                                                    Parse Attempt #{validParseAttempts.length - index} {index === 0 && '(Most Recent)'}
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(attempt.created_at).toLocaleDateString()}
                                                    </span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => toggleAttemptExpansion(attempt.id)}
                                                        className="p-1 h-6 w-6"
                                                    >
                                                        {expandedAttempts.has(attempt.id) ? 
                                                            <ChevronUp className="h-3 w-3" /> : 
                                                            <ChevronDown className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            {/* Always show the visual requirements */}
                                            <div className="mb-4">
                                                <SimpleRequirementDisplay requirement={attempt.parsed_prerequisites!} />
                                            </div>
                                            
                                            {/* Collapsible JSON */}
                                            {expandedAttempts.has(attempt.id) && (
                                                <div className="mt-4 border-t pt-4">
                                                    <h4 className="text-sm font-medium mb-2">JSON Structure:</h4>
                                                    <pre className="p-3 rounded text-xs overflow-auto max-h-48">
                                                        {JSON.stringify(attempt.parsed_prerequisites, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}