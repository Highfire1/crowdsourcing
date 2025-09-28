import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    console.log(`[parse_attempts/next] Fetching course at offset: ${offset}`)

    const supabase = await createClient()

    // Get courses in order with offset, filtering for empty notes
    const { data: parsedData, error, count } = await supabase
      .from('courses_sfu')
      .select('id, dept, number, title, description, prerequisites, corequisites, notes, parse_status', { count: 'exact' })
      .in('parse_status', ['ai_parsed', 'ai_parsed_failed'])
      .eq('notes', '')
      .order('id', { ascending: true })
      .range(offset, offset)
      .limit(1)

    console.log(`[parse_attempts/next] Query result:`, {
      dataLength: parsedData?.length || 0,
      totalCount: count,
      error: error,
      offset: offset,
      firstCourse: parsedData?.[0] ? {
        id: parsedData[0].id,
        dept: parsedData[0].dept,
        number: parsedData[0].number,
        parse_status: parsedData[0].parse_status,
        notes: parsedData[0].notes
      } : null
    })

    if (error) {
      console.error('[parse_attempts/next] Supabase error:', error)
      return NextResponse.json({ course: null, error: error.message }, { status: 500 })
    }

    if (!parsedData || parsedData.length === 0) {
      console.log(`[parse_attempts/next] No courses found at offset ${offset}. Total available courses: ${count}`)
      return NextResponse.json({ course: null, offset, totalCount: count })
    }

    console.log(`[parse_attempts/next] Successfully returning course: ${parsedData[0].dept} ${parsedData[0].number}`)
    return NextResponse.json({ 
      course: parsedData[0],
      offset: offset + 1,
      totalCount: count
    })
  } catch (err) {
    console.error('Error fetching next course', err)
    return NextResponse.json({ course: null }, { status: 500 })
  }
}
