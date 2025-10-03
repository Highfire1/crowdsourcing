'use client'

import { useEffect, useState } from 'react'
import VerifyPanel from './verify-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirementNode } from '@/lib/course_types'

interface Course {
  id?: number
  dept: string
  number: string
  title?: string | null
  description?: string | null
  prerequisites?: string | null
  corequisites?: string | null
  notes?: string | null
  parse_status?: string
}

interface ParseAttempt {
  id: string
  author: string
  created_at: string
  parsed_prerequisites?: RequirementNode
}

interface CourseWithParseAttempts extends Course {
  parse_attempts: ParseAttempt[]
}

export function ClientVerifyWrapper() {
  const [course, setCourse] = useState<CourseWithParseAttempts | null>(null)
  const [loading, setLoading] = useState(true)

  const getOffsetFromStorage = (): number => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('verify-offset')
      return stored ? parseInt(stored, 10) : 0
    }
    return 0
  }

  const setOffsetInStorage = (offset: number): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('verify-offset', offset.toString())
    }
  }

  const fetchCourseAtOffset = async (offset: number, incrementOffset: boolean = false) => {
    try {
      const response = await fetch(`/api/verify/next?offset=${offset}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        console.error('Error fetching course:', response.statusText)
        setCourse(null)
        return
      }

      const data = await response.json()
      if (data.course) {
        setCourse(data.course)
        // Only update offset if we want to increment (i.e., when moving to next course)
        if (incrementOffset && typeof data.offset === 'number') {
          setOffsetInStorage(data.offset)
        }
      } else {
        // No course available - reset offset to start over
        console.log('No courses available, resetting offset to 0')
        setOffsetInStorage(0)
        setCourse(null)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      setCourse(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const currentOffset = getOffsetFromStorage()
    // Don't increment offset on initial load - just fetch the course at current offset
    fetchCourseAtOffset(currentOffset, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Function to handle going to next course (for skip functionality)
  const handleNextCourse = () => {
    setLoading(true)
    const currentOffset = getOffsetFromStorage()
    // Increment the offset and save it, then fetch the next course
    const nextOffset = currentOffset + 1
    setOffsetInStorage(nextOffset)
    fetchCourseAtOffset(nextOffset, false)
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          Fetching a course to verify...
        </CardContent>
      </Card>
    )
  }

  if (!course) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>No course available to verify</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No courses are available to verify right now. Come back later.</p>
          {/* <p className="mt-2 text-sm text-gray-600">
            We&apos;ve reset to the beginning - refresh the page to start over, or try again later when new courses are added.
          </p> */}
        </CardContent>
      </Card>
    )
  }

  return <VerifyPanel key={course?.id} course={course} onNextCourse={handleNextCourse} />
}