"use client"

import React from 'react'
import { ReadOnlyRequirementViewer } from '@/components/read-only-requirement-viewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequirementNode } from '@/lib/course_types'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ParseAttempt {
  id: string
  author: string
  created_at: string
  requirements_json?: RequirementNode
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

export default function VerifyPanel({ course, onNextCourse }: Props) {
    const [loading, setLoading] = React.useState(false)
    const [showJson, setShowJson] = useState(false)

    // Get the most recent parse attempt with valid JSON
    const latestParseAttempt = course.parse_attempts
        .filter(attempt => attempt.requirements_json)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

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
                    <CardDescription className='text-white text-md ml-4'>
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
                            disabled={loading || !latestParseAttempt}
                        >
                            {loading ? 'Verifying...' : 'Verify Correct'}
                        </Button>
                        <Button 
                            onClick={redirectToParse} 
                            variant="destructive"
                            disabled={loading}
                        >
                            Something doesn&apos;t look right
                        </Button>
                    </div>

                    {/* JSON toggle */}
                    <div className="p-4 border-b">
                        <Button 
                            onClick={() => setShowJson(!showJson)}
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            {showJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {showJson ? 'Hide JSON' : 'Show JSON'}
                        </Button>
                    </div>

                    {/* JSON view (collapsible) */}
                    {showJson && latestParseAttempt && (
                        <div className="p-4 border-b">
                            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                                {JSON.stringify(latestParseAttempt.requirements_json, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Requirement viewer */}
                    <div className="flex-1 min-h-0">
                        {latestParseAttempt?.requirements_json ? (
                            <ReadOnlyRequirementViewer 
                                key={course?.id ?? 'no-course'}
                                requirements={latestParseAttempt.requirements_json}
                            />
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                No valid parse attempts found for this course
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}