"use client"

import React from 'react'
import { RequirementDndEditorProvider as RequirementFlowEditor } from '@/components/requirement-dnd-editor'
// Button import not needed here; editor toolbar shows the buttons
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirementNode } from '@/lib/course_types'
import Link from 'next/link'

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
    }
}

export default function ParsePanel({ course }: Props) {
    const [currentCourse, setCurrentCourse] = React.useState<typeof course | null>(course)
    const [currentParsed, setCurrentParsed] = React.useState<RequirementNode | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)
    const [submitState, setSubmitState] = React.useState<'idle'|'success'|'error'>('idle')
    // nextCourseCandidate moved into local submit flow; not stored at panel level
    const nextRef = React.useRef<typeof course | null>(null)

    const submit = async (parsed?: RequirementNode | null) => {
        if (!currentCourse) return
        setLoading(true)

        try {
            const res = await fetch('/api/parse_attempts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: currentCourse.id,
                    parsed: parsed ?? currentParsed,
                    action: 'submit',
                }),
            })

            if (!res.ok) {
                const text = await res.text()
                console.warn('Save error', text || res.statusText)
                setSubmitState('error')
            } else {
                const body = await res.json()
                // store nextCourse in a ref so Next can load it later
                nextRef.current = body?.nextCourse ?? null
                if (!submitted) {
                    setSubmitted(true)
                    setSubmitState('success')
                } else {
                    // user clicked Next — load candidate immediately
                    if (nextRef.current) {
                        setCurrentCourse(nextRef.current)
                        setCurrentParsed(null)
                        setSubmitted(false)
                        nextRef.current = null
                        setSubmitState('idle')
                    } else {
                        setCurrentCourse(null)
                        setSubmitState('idle')
                    }
                }
            }
        } catch (err: unknown) {
            console.error('Save error', err)
            setSubmitState('error')
        } finally {
            setLoading(false)
        }
    }

    const skip = async () => {
        if (!currentCourse) return
        setLoading(true)

        try {
            // Just get the next course without saving anything
            const res = await fetch('/api/parse_attempts/next', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!res.ok) {
                console.warn('Skip error', res.statusText)
            } else {
                const body = await res.json()
                // Auto-load next course if available
                if (body?.course) {
                    setCurrentCourse(body.course)
                    setCurrentParsed(null)
                    setSubmitted(false)
                    setSubmitState('idle')
                } else {
                    setCurrentCourse(null)
                    setSubmitState('idle')
                }
            }
        } catch (err: unknown) {
            console.error('Skip error', err)
        } finally {
            setLoading(false)
        }
    }

    if (!currentCourse) {
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
                            <Link href={`/courses/${currentCourse.dept}/${currentCourse.number}`} className="text-blue-500 underline">
                            Parsing: {currentCourse.dept} {currentCourse.number} {currentCourse.title ? `- ${currentCourse.title}` : ''}
                        </Link>
                    </CardTitle>
                    <CardDescription className='text-white text-md ml-4'>
                        <p>Prerequisites: {currentCourse.prerequisites || 'None'}</p>
                        <p>Corequisites: {currentCourse.corequisites || 'None.'}</p>
                        <p>Notes: {currentCourse.notes || 'None.'}</p>
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
                    {/* editor area */}
                            <div className="flex-1 min-h-0">
                                {currentCourse ? (
                                    <RequirementFlowEditor
                                                key={currentCourse?.id ?? 'no-course'}
                                                prerequisiteText={currentCourse.prerequisites || ''}
                                                onSave={(data) => submit(data)}
                                                onSkip={() => skip()}
                                                onRequirementChange={(d) => setCurrentParsed(d)}
                                                loading={loading}
                                                submitState={submitState}
                                            />
                                ) : (
                                    <div className="p-6">No courses available</div>
                                )}
                            </div>
                </CardContent>

                {/* Lower JSON preview removed — editor already shows a live preview on the right */}
            </Card>
        </div>
    )
}
