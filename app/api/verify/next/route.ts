import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    
    const supabase = await createClient()
    
    // Get user info for filtering
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get all courses that need verification and user hasn't parsed
    // First, get all course dept/number pairs the user has already parsed
    const { data: userParsedCourses } = await supabase
      .from('parse_attempts')
      .select('dept, number')
      .eq('author', user.id)

    // Create a set of "dept-number" strings for quick lookup
    const userParsedSet = new Set(
      (userParsedCourses || []).map(pa => `${pa.dept}-${pa.number}`)
    )

    // Get all eligible courses
    const { data: allEligibleCourses, error: coursesError } = await supabase
      .from('courses_sfu')
      .select('*')
      .eq('parse_status', 'human_parsed_once_success')
      .order('dept', { ascending: true })
      .order('number', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    // Filter out courses user has already parsed (in-memory)
    const availableCourses = (allEligibleCourses || []).filter(course => 
      !userParsedSet.has(`${course.dept}-${course.number}`)
    )

    if (availableCourses.length === 0) {
      return NextResponse.json({
        course: null,
        offset: 0,
        total: 0,
        message: 'No more courses available for verification'
      })
    }

    // Apply offset after filtering
    const courseIndex = Math.min(offset, availableCourses.length - 1)
    const course = availableCourses[courseIndex]

    // Get all parse attempts for this course
    const { data: parseAttempts, error: parseAttemptsError } = await supabase
      .from('parse_attempts')
      .select('id, author, created_at, parsed_prerequisites, parsed_credit_conflicts, parse_notes')
      .eq('dept', course.dept)
      .eq('number', course.number)
      .order('created_at', { ascending: false })

    if (parseAttemptsError) {
      console.error('Error fetching parse attempts:', parseAttemptsError)
      return NextResponse.json({ error: 'Failed to fetch parse attempts' }, { status: 500 })
    }

    const courseWithParseAttempts = {
      ...course,
      parse_attempts: parseAttempts || []
    }

    console.log(`Found valid course: ${course.dept} ${course.number} with ${parseAttempts?.length || 0} parse attempts`)

    return NextResponse.json({
      course: courseWithParseAttempts,
      offset: courseIndex,
      total: availableCourses.length
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}