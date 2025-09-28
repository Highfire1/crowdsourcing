import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const dept = url.searchParams.get('dept')
    const number = url.searchParams.get('number')
    
    if (!dept || !number) {
      return NextResponse.json({ error: 'dept and number parameters required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get user info for authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log(`Fetching specific course: ${dept} ${number} for user: ${user.id}`)

    // Get the specific course
    const { data: courses, error: coursesError } = await supabase
      .from('courses_sfu')
      .select('*')
      .eq('dept', dept)
      .eq('number', number)
      .limit(1)

    if (coursesError) {
      console.error('Error fetching specific course:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({
        course: null,
        message: `Course ${dept} ${number} not found`
      })
    }

    const course = courses[0]
    console.log(`Found course: ${course.dept} ${course.number}`)

    return NextResponse.json({
      course: course
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}