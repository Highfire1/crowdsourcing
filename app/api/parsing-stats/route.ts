import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all parse statuses with range to ensure we get all records
    const { data: courses, error, count } = await supabase
      .from('courses_sfu')
      .select('parse_status', { count: 'exact' })
      .range(0, 9999) // Get up to 10k records to be safe

    if (error) {
      console.error('Error fetching course statistics:', error)
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

    console.log('Parsing stats:', stats) // Debug log
    return NextResponse.json(stats)
  } catch (err) {
    console.error('Error in parsing stats API:', err)
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}