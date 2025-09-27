import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Try to pick a random course from ai_parsed or ai_parsed_failed
    const { data: parsedData } = await supabase
      .from('courses_sfu')
      .select('id, dept, number, title, description, prerequisites, corequisites, notes, parse_status')
      .in('parse_status', ['ai_parsed', 'ai_parsed_failed'])
      .limit(1000)

    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json({ course: null })
    }

    // choose a random row from the fetched set
    const idx = Math.floor(Math.random() * parsedData.length)
    return NextResponse.json({ course: parsedData[idx] })
  } catch (err) {
    console.error('Error fetching next course', err)
    return NextResponse.json({ course: null }, { status: 500 })
  }
}
