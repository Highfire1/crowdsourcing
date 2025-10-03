'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const [currentDepartment, setCurrentDepartment] = useState<string | null>(null)

  const getDepartmentFromStorage = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parse-current-department')
    }
    return null
  }

  const setDepartmentInStorage = useCallback((dept: string | null): void => {
    if (typeof window !== 'undefined') {
      if (dept) {
        localStorage.setItem('parse-current-department', dept)
      } else {
        localStorage.removeItem('parse-current-department')
      }
    }
  }, [])

  const getSkippedCoursesFromStorage = (): Set<string> => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('parse-skipped-courses')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  }

  const addSkippedCourseToStorage = (dept: string, number: string): void => {
    if (typeof window !== 'undefined') {
      const skipped = getSkippedCoursesFromStorage()
      skipped.add(`${dept}-${number}`)
      localStorage.setItem('parse-skipped-courses', JSON.stringify(Array.from(skipped)))
    }
  }

  const fetchSpecificCourse = async (dept: string, number: string) => {
    try {
      const response = await fetch(`/api/courses/specific?dept=${dept}&number=${number}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        console.error('Error fetching specific course:', response.statusText)
        setCourse(null)
        return
      }

      const data = await response.json()
      if (data.course) {
        setCourse(data.course)
      } else {
        setCourse(null)
      }
    } catch (error) {
      console.error('Error fetching specific course:', error)
      setCourse(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignedCourse = useCallback(async (dept?: string) => {
    try {
      // Get skipped courses from localStorage
      const skippedCourses = Array.from(getSkippedCoursesFromStorage())
      
      const response = await fetch('/api/parse_attempts/assign-with-skipped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept: dept || null,
          skippedCourses: skippedCourses
        }),
      })

      if (!response.ok) {
        console.error('Error fetching assigned course:', response.statusText)
        setCourse(null)
        return
      }

      const data = await response.json()
      if (data.course) {
        setCourse(data.course)
        // Update the current department when we get a course
        const courseDept = data.course.dept
        setCurrentDepartment(courseDept)
        setDepartmentInStorage(courseDept)
      } else {
        console.log(data.message || 'No courses available')
        setCourse(null)
      }
    } catch (error) {
      console.error('Error fetching assigned course:', error)
      setCourse(null)
    } finally {
      setLoading(false)
    }
  }, [setCurrentDepartment, setDepartmentInStorage])

  useEffect(() => {
    // Check for URL parameters first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const dept = urlParams.get('dept')
      const number = urlParams.get('number')
      
      if (dept && number) {
        console.log(`Loading specific course from URL: ${dept} ${number}`)
        fetchSpecificCourse(dept, number)
        return
      }
    }
    
    // Check if we have a stored department from previous session
    const storedDept = getDepartmentFromStorage()
    if (storedDept) {
      console.log(`Resuming in department: ${storedDept}`)
      setCurrentDepartment(storedDept)
      fetchAssignedCourse(storedDept)
    } else {
      // If no stored department, get an assigned course from any department
      fetchAssignedCourse()
    }
  }, [fetchAssignedCourse])

  // Function to handle going to next course (for skip functionality)
  const handleNextCourse = async () => {
    if (!course) return
    
    setLoading(true)
    
    try {
      // Add this course to the skipped list immediately
      addSkippedCourseToStorage(course.dept, course.number)
      
      // Also save to database (but don't wait for it)
      fetch('/api/parse_attempts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          parsed: null,
          action: 'skip',
          parseStatus: 'skipped',
        }),
      }).catch(error => console.error('Error saving skip entry:', error))

      // Stay in the current department if we have one
      const currentDept = getDepartmentFromStorage()
      fetchAssignedCourse(currentDept || undefined)
    } catch (error) {
      console.error('Error handling skip:', error)
      // Fall back to just fetching next course
      const currentDept = getDepartmentFromStorage()
      fetchAssignedCourse(currentDept || undefined)
    }
  }

  // Function to skip to a specific department
  const handleSkipToDepartment = async (dept: string) => {
    setLoading(true)
    setCurrentDepartment(dept)
    setDepartmentInStorage(dept)
    fetchAssignedCourse(dept)
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
          <p>No more courses are available to parse right now.</p>
          <p className="mt-2 text-sm text-gray-600">
            You may have already worked on all available courses, or try selecting a specific department from the skip dropdown.
          </p>
        </CardContent>
      </Card>
    )
  }

  return <ParsePanel key={course?.id} course={course} onNextCourse={handleNextCourse} onSkipToDepartment={handleSkipToDepartment} />
}