"use client"

import React from 'react'
import { RequirementDndEditorProvider as RequirementFlowEditor } from '@/components/requirement-dnd-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirementNode, CreditConflict } from '@/lib/course_types'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { X, AlertCircle } from 'lucide-react'

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
    onSkipToDepartment?: (dept: string) => Promise<void>
}

export default function ParsePanel({ course, onNextCourse, onSkipToDepartment }: Props) {
    const [currentCourse, setCurrentCourse] = React.useState<typeof course | null>(course)
    const [currentParsed, setCurrentParsed] = React.useState<RequirementNode | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [parseNotes, setParseNotes] = React.useState('')
    const [creditConflicts, setCreditConflicts] = React.useState<CreditConflict[]>([])

    const showErrorToast = (message: string) => {
        toast.custom((t) => (
            <div className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Error
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-200 dark:border-gray-600">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        ))
    }

    const submit = async (
        parsed: RequirementNode | null | undefined,
        status: 'success' | 'ambiguous'
    ) => {
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
                    parseNotes: parseNotes.trim() || null,
                    parseStatus: status,
                    parsedCreditConflicts: creditConflicts.length > 0 ? creditConflicts : null,
                }),
            })

            if (!res.ok) {
                const text = await res.text()
                let errorMessage = 'Failed to save parse attempt'
                try {
                    const errorData = JSON.parse(text)
                    if (errorData.error) {
                        errorMessage = errorData.error
                        if (errorData.details?.message) {
                            errorMessage += ': ' + errorData.details.message
                        }
                    }
                } catch {
                    // If parsing fails, use the raw text or status
                    errorMessage = text || res.statusText || errorMessage
                }
                console.warn('Save error', text || res.statusText)
                showErrorToast(errorMessage)
            } else {
                const courseName = `${currentCourse.dept} ${currentCourse.number}`
                toast.success(status === 'ambiguous' 
                    ? `${courseName} marked as ambiguous` 
                    : `${courseName} submitted successfully`)
                
                // Always advance to next course automatically
                setTimeout(() => {
                    if (onNextCourse) {
                        onNextCourse()
                    } else {
                        setCurrentCourse(null)
                    }
                }, 1000) // Small delay so user can see the success message
            }
        } catch (err: unknown) {
            console.error('Save error', err)
            showErrorToast('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const markAsAmbiguous = async () => {
        if (!parseNotes.trim()) {
            showErrorToast('Please add a reason explaining why this course is ambiguous before marking it.')
            return
        }
        await submit(currentParsed, 'ambiguous')
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
            <Card className="flex flex-col h-full">
                <CardHeader className="h-32 flex-shrink-0 py-3">
                    <CardTitle>
                            <Link href={`/courses/${currentCourse.dept}/${currentCourse.number}`} className="text-blue-500 underline">
                            Parsing: {currentCourse.dept} {currentCourse.number} {currentCourse.title ? `- ${currentCourse.title}` : ''}
                        </Link>
                    </CardTitle>
                    <CardDescription className='text-md ml-4 text-black dark:text-white overflow-y-auto flex-1'>
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
                                        onSave={(data) => submit(data, 'success')}
                                        onSkip={() => skip()}
                                        onSkipToDepartment={onSkipToDepartment}
                                        onMarkAmbiguous={markAsAmbiguous}
                                        onRequirementChange={(d) => setCurrentParsed(d)}
                                        parseNotes={parseNotes}
                                        onParseNotesChange={setParseNotes}
                                        creditConflicts={creditConflicts}
                                        onCreditConflictsChange={setCreditConflicts}
                                        courseNotes={currentCourse.notes || ''}
                                        currentCourse={{
                                            department: currentCourse.dept,
                                            number: currentCourse.number
                                        }}
                                        loading={loading}
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
