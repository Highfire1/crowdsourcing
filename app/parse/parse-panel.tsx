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
    onNextCourse?: () => void
}

export default function ParsePanel({ course, onNextCourse }: Props) {
    const [currentCourse, setCurrentCourse] = React.useState<typeof course | null>(course)
    const [currentParsed, setCurrentParsed] = React.useState<RequirementNode | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)
    const [submitState, setSubmitState] = React.useState<'idle'|'success'|'error'>('idle')

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
                if (!submitted) {
                    setSubmitted(true)
                    setSubmitState('success')
                } else {
                    // user clicked Next — use the parent's offset-based next course handler
                    if (onNextCourse) {
                        onNextCourse()
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
                    <CardDescription className='text-md ml-4 text-black dark:text-white'>
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
