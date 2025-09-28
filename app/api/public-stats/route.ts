import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Create service role client for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all parse statuses with range to ensure we get all records
    const { data: courses, error, count } = await supabase
      .from('courses_sfu')
      .select('parse_status', { count: 'exact' })
      .range(0, 9999) // Get up to 10k records to be safe

    if (error) {
      console.error('Error fetching public course statistics:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Count each status manually with new categories
    const stats = {
      total: count || courses?.length || 0,
      noPrerequisites: 0,
      verified: 0,
      parsedOnce: 0,
      notYetParsed: 0,
      ambiguous: 0
    }

    if (courses) {
      courses.forEach(course => {
        switch (course.parse_status) {
          case 'no_parse_needed':
            stats.noPrerequisites++
            break
          case 'human_verified':
            stats.verified++
            break
          case 'human_parsed_once_success':
          case 'human_parsed_twice_success':
            stats.parsedOnce++
            break
          case 'ai_parsed':
          case 'ai_parsed_failed':
          case null:
          case undefined:
          case '':
            stats.notYetParsed++
            break
          case 'human_parsed_unclear':
            stats.ambiguous++
            break
          default:
            // Log unknown statuses for debugging
            console.log('Unknown status:', course.parse_status)
            stats.notYetParsed++
        }
      })
    }

    console.log('Public parsing stats:', stats) // Debug log
    
    // Set cache headers for public endpoint
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600') // 5 min cache, 10 min stale
    
    return NextResponse.json(stats, { headers })
  } catch (err) {
    console.error('Error in public parsing stats API:', err)
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}