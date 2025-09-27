import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { courseId, parsed, action } = body

    const supabase = await createClient()

    // Fetch the course by id to gather dept/number and original fields
    const { data: courseRows, error: courseErr } = await supabase
      .from('courses_sfu')
      .select('id, dept, number, prerequisites, corequisites, notes')
      .eq('id', courseId)
      .limit(1)

    if (courseErr) {
      console.error('Error fetching course for save:', courseErr)
      return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
    }

    const course = courseRows && courseRows.length > 0 ? courseRows[0] : null

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Insert parse_attempts row (if action is submit or skip we'll still record)
    const insertPayload = {
      dept: course.dept,
      number: course.number,
      original_prerequisites: course.prerequisites,
      original_corequisites: course.corequisites,
      original_notes: course.notes,
      parsed_prerequisites: parsed ? JSON.parse(JSON.stringify(parsed)) : null,
      parsed_corequisites: null,
      parsed_credit_conflicts: null,
    }

    const { error: insertErr } = await supabase.from('parse_attempts').insert(insertPayload)

    if (insertErr) {
      console.error('Error inserting parse_attempts:', insertErr)
      return NextResponse.json({ error: 'Failed to insert parse_attempts', details: insertErr }, { status: 500 })
    }

    // Optionally update the course parse_status when submitted
    if (action === 'submit') {
      await supabase.from('courses_sfu').update({ parse_status: 'human_parsed_once_success' }).eq('id', courseId)
    }

    // Find next course: prefer ai_parsed then ai_parsed_failed
    const { data: nextPref } = await supabase
      .from('courses_sfu')
      .select('id, dept, number, title, description, prerequisites, corequisites, notes')
      .eq('parse_status', 'ai_parsed')
      .order('id', { ascending: true })
      .limit(1)

    let nextCourse = nextPref && nextPref.length > 0 ? nextPref[0] : null

    if (!nextCourse) {
      const { data: nextFb } = await supabase
        .from('courses_sfu')
        .select('id, dept, number, title, description, prerequisites, corequisites, notes')
        .eq('parse_status', 'ai_parsed_failed')
        .order('id', { ascending: true })
        .limit(1)

      nextCourse = nextFb && nextFb.length > 0 ? nextFb[0] : null
    }

    return NextResponse.json({ ok: true, nextCourse })
  } catch (err) {
    console.error('Unexpected save error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
