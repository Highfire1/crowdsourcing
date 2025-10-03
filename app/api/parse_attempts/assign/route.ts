import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dept = searchParams.get('dept')
    
    const supabase = await createClient()
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log(`[parse_attempts/assign] Assigning course for user: ${user.id}${dept ? ` in department: ${dept}` : ''}`)

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
      console.error('[parse_attempts/assign] Error fetching courses:', error)
      return NextResponse.json({ course: null, error: error.message }, { status: 500 })
    }

    if (!availableCourses || availableCourses.length === 0) {
      console.log(`[parse_attempts/assign] No courses available${dept ? ` for department ${dept}` : ''}`)
      return NextResponse.json({ 
        course: null, 
        message: `No courses available${dept ? ` for department ${dept}` : ''}` 
      })
    }

    // Check which courses this user has already worked on (including skipped)
    const { data: userParseAttempts, error: userParseError } = await supabase
      .from('parse_attempts')
      .select('dept, number')
      .eq('author', user.id)

    if (userParseError) {
      console.error('[parse_attempts/assign] Error fetching user parse attempts:', userParseError)
      return NextResponse.json({ error: 'Failed to check user history' }, { status: 500 })
    }

    // Create a set of courses this user has already worked on
    const userWorkedCourses = new Set(
      userParseAttempts?.map(attempt => `${attempt.dept}-${attempt.number}`) || []
    )

    // Filter out courses the user has already worked on
    const unworkedCourses = availableCourses.filter(course => 
      !userWorkedCourses.has(`${course.dept}-${course.number}`)
    )

    if (unworkedCourses.length === 0) {
      console.log(`[parse_attempts/assign] User has already worked on all available courses${dept ? ` in department ${dept}` : ''}`)
      return NextResponse.json({ 
        course: null, 
        message: `You have already worked on all available courses${dept ? ` in department ${dept}` : ''}` 
      })
    }

    // For now, just return the first unworked course
    // Later we could add more sophisticated assignment logic like:
    // - Least recently assigned courses
    // - Courses with fewest parse attempts
    // - Random assignment within a department
    const assignedCourse = unworkedCourses[0]

    console.log(`[parse_attempts/assign] Assigned course: ${assignedCourse.dept} ${assignedCourse.number} to user ${user.id}`)

    return NextResponse.json({ 
      course: assignedCourse,
      totalAvailable: availableCourses.length,
      totalUnworked: unworkedCourses.length
    })

  } catch (err) {
    console.error('[parse_attempts/assign] Unexpected error:', err)
    return NextResponse.json({ course: null, error: 'Unexpected error' }, { status: 500 })
  }
}