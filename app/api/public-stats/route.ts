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

    // Use parallel count queries for optimal performance
    const promises = [
      supabase.from('courses_sfu').select('*', { count: 'exact', head: true }),
      supabase.from('courses_sfu').select('*', { count: 'exact', head: true }).eq('parse_status', 'no_parse_needed'),
      supabase.from('courses_sfu').select('*', { count: 'exact', head: true }).eq('parse_status', 'human_verified'),
      supabase.from('courses_sfu').select('*', { count: 'exact', head: true }).in('parse_status', ['human_parsed_once_success', 'human_parsed_twice_success']),
      supabase.from('courses_sfu').select('*', { count: 'exact', head: true }).in('parse_status', ['ai_parsed', 'ai_parsed_failed']),
      supabase.from('courses_sfu').select('*', { count: 'exact', head: true }).eq('parse_status', 'human_parsed_unclear'),
      supabase.from('courses_sfu').select('*', { count: 'exact', head: true }).is('parse_status', null)
    ]

    const results = await Promise.all(promises)

    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error in count query:', result.error)
        return NextResponse.json(
          { error: `Database error: ${result.error.message}` },
          { status: 500 }
        )
      }
    }

    const stats = {
      total: results[0].count || 0,
      noPrerequisites: results[1].count || 0,
      verified: results[2].count || 0,
      parsedOnce: results[3].count || 0,
      notYetParsed: (results[4].count || 0) + (results[6].count || 0),
      ambiguous: results[5].count || 0
    }
    
    // Disable all caching to ensure fresh data
    const headers = new Headers()
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    return NextResponse.json(stats, { headers })
  } catch (err) {
    console.error('Error in public parsing stats API:', err)
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}