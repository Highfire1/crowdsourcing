import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findAvailableCourse(supabase: any, user: any, dept: string | null, skippedCourses: string[], userParseAttempts: any[]) {
  // Create a set of courses this user has already worked on (database + localStorage)
  const userWorkedCourses = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userParseAttempts?.map((attempt: any) => `${attempt.dept}-${attempt.number}`) || []
  )
  
  // Add localStorage skipped courses to the exclusion set
  skippedCourses.forEach((courseKey: string) => userWorkedCourses.add(courseKey))

  // Build the query for available courses
  let query = supabase
    .from('courses_sfu')
    .select('id, dept, number, title, description, prerequisites, corequisites, notes, parse_status')
    .in('parse_status', ['ai_parsed', 'ai_parsed_failed'])
    .order('dept', { ascending: true })
    .order('number', { ascending: true })

  // Add department filter if specified
  if (dept) {
    query = query.eq('dept', dept)
  }

  const { data: availableCourses, error } = await query

  if (error) {
    throw error
  }

  if (!availableCourses || availableCourses.length === 0) {
    return null
  }

  // Filter out courses the user has already worked on
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unworkedCourses = availableCourses.filter((course: any) => 
    !userWorkedCourses.has(`${course.dept}-${course.number}`)
  )

  return unworkedCourses.length > 0 ? unworkedCourses[0] : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dept, skippedCourses = [] } = body
    
    const supabase = await createClient()
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log(`[parse_attempts/assign-with-skipped] Assigning course for user: ${user.id}${dept ? ` in department: ${dept}` : ''}, skipping: ${skippedCourses.join(', ')}`)

    // Check which courses this user has already worked on (from database)
    const { data: userParseAttempts, error: userParseError } = await supabase
      .from('parse_attempts')
      .select('dept, number')
      .eq('author', user.id)

    if (userParseError) {
      console.error('[parse_attempts/assign-with-skipped] Error fetching user parse attempts:', userParseError)
      return NextResponse.json({ error: 'Failed to check user history' }, { status: 500 })
    }

    // Try to find a course in the requested department first
    let assignedCourse = null
    
    if (dept) {
      try {
        assignedCourse = await findAvailableCourse(supabase, user, dept, skippedCourses, userParseAttempts)
        
        if (!assignedCourse) {
          console.log(`[parse_attempts/assign-with-skipped] No courses available for department ${dept}, trying other departments`)
          
          // Try other departments
          assignedCourse = await findAvailableCourse(supabase, user, null, skippedCourses, userParseAttempts)
        }
      } catch (error) {
        console.error('[parse_attempts/assign-with-skipped] Error fetching courses:', error)
        return NextResponse.json({ course: null, error: String(error) }, { status: 500 })
      }
    } else {
      // No specific department requested, try all departments
      try {
        assignedCourse = await findAvailableCourse(supabase, user, null, skippedCourses, userParseAttempts)
      } catch (error) {
        console.error('[parse_attempts/assign-with-skipped] Error fetching courses:', error)
        return NextResponse.json({ course: null, error: String(error) }, { status: 500 })
      }
    }

    if (!assignedCourse) {
      console.log(`[parse_attempts/assign-with-skipped] No courses available in any department, suggesting to clear skipped courses`)
      return NextResponse.json({ 
        course: null, 
        message: 'No courses available in any department',
        suggestion: 'clear_skipped',
        clearSkippedMessage: 'You have worked on or skipped all available courses. Would you like to clear your skipped courses to start over?'
      })
    }

    console.log(`[parse_attempts/assign-with-skipped] Assigned course: ${assignedCourse.dept} ${assignedCourse.number} to user ${user.id}`)

    return NextResponse.json({ 
      course: assignedCourse,
      fromDifferentDept: dept && assignedCourse.dept !== dept
    })

  } catch (err) {
    console.error('[parse_attempts/assign-with-skipped] Unexpected error:', err)
    return NextResponse.json({ course: null, error: 'Unexpected error' }, { status: 500 })
  }
}