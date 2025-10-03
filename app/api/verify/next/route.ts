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

    // console.log(`Fetching verification courses at offset: ${offset} for user: ${user.id}`)

    // First get courses that have been successfully parsed by humans
    const { data: eligibleCourses, error: coursesError, count } = await supabase
      .from('courses_sfu')
      .select('*', { count: 'exact' })
      .eq('parse_status', 'human_parsed_once_success')
      .order('dept', { ascending: true })
      .order('number', { ascending: true })
      .range(offset, offset)
    
    // console.log(eligibleCourses, coursesError, count)

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    if (!eligibleCourses || eligibleCourses.length === 0) {
      return NextResponse.json({
        course: null,
        offset: offset, // Don't increment when no courses found
        total: count || 0,
        message: 'No more courses available for verification'
      })
    }

    const course = eligibleCourses[0]

    // Check if current user has attempted to parse this course
    const { data: userParseAttempts, error: userParseError } = await supabase
      .from('parse_attempts')
      .select('id')
      .eq('dept', course.dept)
      .eq('number', course.number)
      .eq('author', user.id)
      .limit(1)

    if (userParseError) {
      console.error('Error checking user parse attempts:', userParseError)
      return NextResponse.json({ error: 'Failed to check parse attempts' }, { status: 500 })
    }

    // If user has parse attempts or course is already verified, skip to next course
    if ((userParseAttempts && userParseAttempts.length > 0) || course.parse_status === 'human_verified') {
      // console.log(`Skipping course ${course.dept} ${course.number} - user has parse attempts or already verified`)
      // Recursively try the next course
      const nextUrl = new URL(request.url)
      nextUrl.searchParams.set('offset', (offset + 1).toString())
      return GET(new Request(nextUrl.toString()))
    }

    // Get all parse attempts for this course
    const { data: parseAttempts, error: parseAttemptsError } = await supabase
      .from('parse_attempts')
      .select('id, author, created_at, parsed_prerequisites')
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
      offset: offset, // Return current offset, don't increment here
      total: count || 0
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}