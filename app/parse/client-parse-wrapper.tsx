'use client'

import { useEffect, useState } from 'react'
import ParsePanel from './parse-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

export function ClientParseWrapper() {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  const getOffsetFromStorage = (): number => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('parse-offset')
      return stored ? parseInt(stored, 10) : 0
    }
    return 0
  }

  const setOffsetInStorage = (offset: number): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parse-offset', offset.toString())
    }
  }

  const fetchCourseAtOffset = async (offset: number) => {
    try {
      const response = await fetch(`/api/parse_attempts/next?offset=${offset}`, {
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
        // Update offset in localStorage for next time
        if (typeof data.offset === 'number') {
          setOffsetInStorage(data.offset)
        }
      } else {
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
    fetchCourseAtOffset(currentOffset)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Function to handle going to next course (for skip functionality)
  const handleNextCourse = () => {
    setLoading(true)
    const currentOffset = getOffsetFromStorage()
    fetchCourseAtOffset(currentOffset)
  }

  // Update course when it changes from the parent
  useEffect(() => {
    // This effect will re-run when course changes, no additional logic needed
  }, [course])

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          Fetching a course to parse...
        </CardContent>
      </Card>
    )
  }

  if (!course) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>No course available to parse</CardTitle>
        </CardHeader>
        <CardContent>
          Sorry, no courses are available to parse right now.
        </CardContent>
      </Card>
    )
  }

  return <ParsePanel key={course?.id} course={course} onNextCourse={handleNextCourse} />
}