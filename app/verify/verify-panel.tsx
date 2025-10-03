"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RequirementNode, RequirementGroup, RequirementCourse, RequirementProgram, RequirementPermission, RequirementOther, RequirementCreditCount, RequirementCourseCount, RequirementCGPA, RequirementUDGPA, RequirementHSCourse, CreditConflict } from '@/lib/course_types'
import { getGroupLogicColor } from '@/lib/prerequisite-parser'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ParseAttempt {
  id: string
  author: string
  created_at: string
  parsed_prerequisites?: RequirementNode
  parsed_credit_conflicts?: Record<string, unknown> | null
  parse_notes?: string | null
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
            <Badge variant="secondary" className="text-xs">Program</Badge>
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
      
      case 'creditCount':
        const creditCount = req as RequirementCreditCount
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">Credit Count</Badge>
            <span className="text-sm">
              {creditCount.credits} credits
              {creditCount.department && ` in ${Array.isArray(creditCount.department) ? creditCount.department.join(', ') : creditCount.department}`}
              {creditCount.level && ` at ${creditCount.level} level`}
            </span>
            {creditCount.minGrade && <Badge variant="outline" className="text-xs">Min: {creditCount.minGrade}</Badge>}
          </div>
        )
      
      case 'courseCount':
        const courseCount = req as RequirementCourseCount
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">Course Count</Badge>
            <span className="text-sm">
              {courseCount.count} courses
              {courseCount.department && ` in ${Array.isArray(courseCount.department) ? courseCount.department.join(', ') : courseCount.department}`}
              {courseCount.level && ` at ${courseCount.level} level`}
            </span>
            {courseCount.minGrade && <Badge variant="outline" className="text-xs">Min: {courseCount.minGrade}</Badge>}
          </div>
        )
      
      case 'CGPA':
        const cgpa = req as RequirementCGPA
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">CGPA</Badge>
            <span className="text-sm">Minimum CGPA: {cgpa.minCGPA}</span>
          </div>
        )
      
      case 'UDGPA':
        const udgpa = req as RequirementUDGPA
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">UDGPA</Badge>
            <span className="text-sm">Minimum Upper Division GPA: {udgpa.minUDGPA}</span>
          </div>
        )
      
      case 'HSCourse':
        const hsCourse = req as RequirementHSCourse
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">High School</Badge>
            <span className="text-sm">{hsCourse.course}</span>
            {hsCourse.minGrade && <Badge variant="outline" className="text-xs">Min: {hsCourse.minGrade}</Badge>}
            {hsCourse.orEquivalent && <Badge variant="outline" className="text-xs">Or Equivalent</Badge>}
          </div>
        )
      
      default:
        return (
          <div key={Math.random()} style={{ marginLeft: indent }} className="flex items-center gap-2 py-1">
            <Badge variant="secondary" className="text-xs">{(req as RequirementNode).type || 'Unknown'}</Badge>
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
    const [usernames, setUsernames] = useState<Record<string, string>>({})
    const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)

    // Get all parse attempts (show all attempts, not just ones with prerequisites)
    const validParseAttempts = course.parse_attempts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Extract user IDs
    const userIds = validParseAttempts.map(attempt => attempt.author).filter(Boolean)
    // Create a stable key for the user IDs to prevent infinite loops
    const userIdsKey = userIds.join(',')

    // Fetch usernames for all authors when user IDs change
    useEffect(() => {
        if (userIds.length === 0) return
        
        const fetchUsernames = async () => {
            try {
                const response = await fetch('/api/usernames', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userIds })
                })
                
                if (response.ok) {
                    const data = await response.json()
                    setUsernames(data.usernames || {})
                } else {
                    console.error('Failed to fetch usernames')
                    // Fallback to showing user IDs
                    const fallbackMap: Record<string, string> = {}
                    userIds.forEach((id: string) => {
                        fallbackMap[id] = id
                    })
                    setUsernames(fallbackMap)
                }
            } catch (error) {
                console.error('Error fetching usernames:', error)
                // Fallback to showing user IDs
                const fallbackMap: Record<string, string> = {}
                userIds.forEach((id: string) => {
                    fallbackMap[id] = id
                })
                setUsernames(fallbackMap)
            }
        }
        
        fetchUsernames()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userIdsKey]) // Only re-run when the actual user IDs change

    const getDisplayName = (userId: string | null) => {
        if (!userId) return 'Unknown'
        return usernames[userId] || userId
    }

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
        if (!course || !selectedAttemptId) {
            toast.error('Please select a parse attempt to verify')
            return
        }
        setLoading(true)

        try {
            const res = await fetch('/api/verify/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dept: course.dept,
                    number: course.number,
                    verification_status: 'success',
                    parse_attempt_id: parseInt(selectedAttemptId)
                }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                console.warn('Verify error', errorData)
                toast.error(errorData.error || 'Error saving verification')
            } else {
                toast.success(`Verification saved successfully for ${course.dept} ${course.number}!`)
                // Move to next course
                if (onNextCourse) {
                    onNextCourse()
                }
            }
        } catch (err: unknown) {
            console.error('Verify error', err)
            toast.error('Error saving verification')
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
                    {/* Verification controls */}
                    <div className="p-4 border-b space-y-4">
                        {validParseAttempts.length > 0 && selectedAttemptId && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Selected: Parse Attempt #{validParseAttempts.findIndex(a => a.id === selectedAttemptId) !== -1 ? 
                                        validParseAttempts.length - validParseAttempts.findIndex(a => a.id === selectedAttemptId) : 
                                        'Unknown'}
                                </p>
                            </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
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
                                disabled={loading || !selectedAttemptId || validParseAttempts.length === 0}
                            >
                                {loading ? 'Submitting...' : 'Verify Selected Parse'}
                            </Button>
                            <Button 
                                onClick={redirectToParse} 
                                variant="destructive"
                                disabled={loading}
                            >
                                Reparse Course
                            </Button>
                        </div>
                    </div>

                    {/* Parse attempts list */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {validParseAttempts.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                No parse attempts found for this course
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {validParseAttempts.map((attempt, index) => (
                                    <Card 
                                        key={attempt.id} 
                                        className={`border transition-colors cursor-pointer hover:border-blue-300 ${selectedAttemptId === attempt.id ? 'border-blue-500' : ''}`}
                                        onClick={() => setSelectedAttemptId(attempt.id)}
                                    >
                                        <CardHeader className="pb-2 pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {selectedAttemptId === attempt.id && (
                                                        <div className="flex items-center gap-1 px-2 py-1 border border-blue-500 rounded text-blue-700">
                                                            <Check className="h-3 w-3" />
                                                            <span className="text-xs font-medium">Selected</span>
                                                        </div>
                                                    )}
                                                    <CardTitle className="text-sm">
                                                        Parse Attempt #{validParseAttempts.length - index} {index === 0 && '(Most Recent)'}
                                                    </CardTitle>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(attempt.created_at).toLocaleDateString()}
                                                        {attempt.author && (
                                                            <span>
                                                                {' • by '}
                                                                <span title={`UUID: ${attempt.author}`} className="cursor-help">
                                                                    {getDisplayName(attempt.author)}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleAttemptExpansion(attempt.id)
                                                        }}
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
                                        <CardContent className="pt-0 pb-2">
                                            
                                            {/* Parse Notes */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold mb-2">Parse Notes:</h4>
                                                {attempt.parse_notes ? (
                                                    <div className="p-3 rounded border bg-blue-50">
                                                        <p className="text-sm whitespace-pre-wrap">{attempt.parse_notes}</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-2 text-center text-gray-500 rounded border-2 border-dashed">
                                                        <p className="text-sm">No parse notes</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Show the visual requirements if available */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold mb-2">Prerequisites:</h4>
                                                {attempt.parsed_prerequisites ? (
                                                    <SimpleRequirementDisplay requirement={attempt.parsed_prerequisites} />
                                                ) : (
                                                    <div className="p-4 text-center text-gray-500  rounded border-2 border-dashed">
                                                        <p className="text-sm">No prerequisites parsed</p>
                                                        <p className="text-xs mt-1">This might indicate &ldquo;Prerequisites: None&rdquo; or a parsing error</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Credit Conflicts */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold mb-2">Credit Conflicts:</h4>
                                                {attempt.parsed_credit_conflicts ? (
                                                    <div className="space-y-2">
                                                        {Array.isArray(attempt.parsed_credit_conflicts) ? (
                                                            (attempt.parsed_credit_conflicts as CreditConflict[]).map((conflict: CreditConflict, index: number) => (
                                                                <div key={index} className="p-3 rounded-lg border">
                                                                    {conflict.type === 'conflict_course' ? (
                                                                        <div>
                                                                            <Badge variant="secondary" className="text-xs mb-1">Course Conflict</Badge>
                                                                            <p className="text-sm font-mono">
                                                                                {conflict.department} {conflict.number}
                                                                                {conflict.title && ` - ${conflict.title}`}
                                                                            </p>
                                                                            {conflict.conflict_only_when_taken_first && (
                                                                                <p className="text-xs text-orange-600 mt-1">
                                                                                    Only conflicts when taken first
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <Badge variant="secondary" className="text-xs mb-1">Other Conflict</Badge>
                                                                            <p className="text-sm">{conflict.note || 'No description'}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <pre className="text-xs p-3 rounded border whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                                                                {JSON.stringify(attempt.parsed_credit_conflicts, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-2 text-center text-gray-500 rounded border-2 border-dashed">
                                                        <p className="text-sm">No credit conflicts</p>
                                                    </div>
                                                )}
                                            </div>

                                            
                                            {/* Collapsible JSON */}
                                            {expandedAttempts.has(attempt.id) && (
                                                <div className="mt-4 border-t pt-4">
                                                    <h4 className="text-sm font-medium mb-2">JSON Structure:</h4>
                                                    <pre className="p-3 rounded text-xs overflow-auto max-h-48 border">
                                                        {attempt.parsed_prerequisites ? 
                                                            JSON.stringify(attempt.parsed_prerequisites, null, 2) : 
                                                            'null (no prerequisites parsed)'
                                                        }
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