import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { courseId, parsed, action, parseNotes, parseStatus, parsedCreditConflicts } = body

    // Get user info from the regular client (for auth)
    const userSupabase = await createUserClient()
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Use service_role client for elevated permissions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the course by id to gather dept/number and original fields
    const { data: courseRows, error: courseErr } = await supabase
      .from('courses_sfu')
      .select('id, dept, number, prerequisites, corequisites, notes, parse_status')
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
      parsed_credit_conflicts: parsedCreditConflicts ? JSON.parse(JSON.stringify(parsedCreditConflicts)) : null,
      author: user.id, // Add the user ID as the author
      parse_notes: parseNotes || '',
      parse_status: parseStatus || 'success',
    }

    const { error: insertErr } = await supabase.from('parse_attempts').insert(insertPayload)

    if (insertErr) {
      console.error('Error inserting parse_attempts:', insertErr)
      return NextResponse.json({ error: 'Failed to insert parse_attempts', details: insertErr }, { status: 500 })
    }

    // Update parse_status when submitted
    if (action === 'submit') {
      // Ambiguous should always mark unclear, regardless of prior status
      if (parseStatus === 'ambiguous') {
        const { error: updateErr } = await supabase
          .from('courses_sfu')
          .update({ parse_status: 'human_parsed_unclear' })
          .eq('id', courseId)

        if (updateErr) {
          console.error('Error updating parse_status (ambiguous):', updateErr)
          return NextResponse.json({ error: 'Failed to update parse_status' }, { status: 500 })
        }
      } else if (course.parse_status === 'ai_parsed' || course.parse_status === 'ai_parsed_failed') {
        // Only promote to success from AI states
        const { error: updateErr } = await supabase
          .from('courses_sfu')
          .update({ parse_status: 'human_parsed_once_success' })
          .eq('id', courseId)

        if (updateErr) {
          console.error('Error updating parse_status (success):', updateErr)
          return NextResponse.json({ error: 'Failed to update parse_status' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Unexpected save error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
