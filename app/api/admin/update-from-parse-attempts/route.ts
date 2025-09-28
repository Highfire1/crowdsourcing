import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Get user info from the regular client (for auth)
    const userSupabase = await createUserClient()
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow specific email
    if (user.email !== 'tseng.andersonn@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Use service_role client for elevated permissions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authorId = '59e32dde-8d7f-4a53-ada4-78575a5a16de'

    // Find all parse attempts by the specific author
    const { data: parseAttempts, error: parseAttemptsError } = await supabase
      .from('parse_attempts')
      .select('dept, number')
      .eq('author', authorId)

    if (parseAttemptsError) {
      console.error('Error fetching parse attempts:', parseAttemptsError)
      return NextResponse.json({ error: 'Failed to fetch parse attempts' }, { status: 500 })
    }

    if (!parseAttempts || parseAttempts.length === 0) {
      return NextResponse.json({ 
        message: 'No parse attempts found for this author', 
        updatedCount: 0 
      })
    }

    // Get unique dept/number combinations
    const uniqueCourses = Array.from(
      new Map(parseAttempts.map(pa => [`${pa.dept}-${pa.number}`, pa])).values()
    )

    console.log(`Found ${uniqueCourses.length} unique courses with parse attempts`)

    // Update courses that are currently ai_parsed or ai_parsed_failed
    let updatedCount = 0
    for (const course of uniqueCourses) {
      const { error: updateError, count } = await supabase
        .from('courses_sfu')
        .update({ parse_status: 'human_parsed_once_success' })
        .eq('dept', course.dept)
        .eq('number', course.number)
        .in('parse_status', ['ai_parsed', 'ai_parsed_failed'])

      if (updateError) {
        console.error(`Error updating ${course.dept} ${course.number}:`, updateError)
      } else {
        updatedCount += count || 0
      }
    }

    return NextResponse.json({ 
      message: `Successfully updated ${updatedCount} courses to human_parsed_once_success`,
      totalParseAttempts: parseAttempts.length,
      uniqueCourses: uniqueCourses.length,
      updatedCount,
      authorId
    })

  } catch (err) {
    console.error('Unexpected error in update-from-parse-attempts:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}