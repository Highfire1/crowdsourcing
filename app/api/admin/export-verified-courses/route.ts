import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  // Use service role client for elevated permissions to access all tables
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Also get regular client for user authentication
  const userSupabase = await createClient()

  // verify user
  const { data: userRes, error: userErr } = await userSupabase.auth.getUser()
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = userRes.user
  if (user.email !== 'tseng.andersonn@gmail.com') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // First, get all verified courses
    const { data: verifiedCourses, error: coursesError } = await supabase
      .from('courses_sfu')
      .select('*')
      .eq('parse_status', 'human_verified')
      .order('dept', { ascending: true })
      .order('number', { ascending: true })

    if (coursesError) {
      console.error('Error fetching verified courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch verified courses' }, { status: 500 })
    }

    // For each verified course, get the verification record and associated parse attempt
    const processedCourses = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      verifiedCourses.map(async (course: any) => {
        // First try to get the verification record for this course
        const { data: verifications, error: verificationError } = await supabase
          .from('verifications_sfu')
          .select(`
            id,
            verification_status,
            created_at,
            author,
            parse_attempt_id
          `)
          .eq('dept', course.dept)
          .eq('number', course.number)
          .order('created_at', { ascending: false })
          .limit(1)

        if (verificationError) {
          console.error(`Error fetching verification for ${course.dept} ${course.number}:`, verificationError)
        }

        const verification = verifications?.[0]
        
        // If we have a verification, get the associated parse attempt
        let parseAttempt = null
        if (verification?.parse_attempt_id) {
          const { data: parseAttemptData, error: parseAttemptError } = await supabase
            .from('parse_attempts')
            .select('id, author, created_at, parsed_prerequisites, parsed_credit_conflicts, parse_notes, parse_status')
            .eq('id', verification.parse_attempt_id)
            .single()

          if (parseAttemptError) {
            console.error(`Error fetching parse attempt ${verification.parse_attempt_id} for ${course.dept} ${course.number}:`, parseAttemptError)
          } else {
            parseAttempt = parseAttemptData
          }
        }

        // If no verification record found, try to get parse attempts directly for this course
        if (!verification) {
          console.log(`No verification record found for ${course.dept} ${course.number}, trying to get parse attempts directly`)
          const { data: directParseAttempts, error: parseAttemptsError } = await supabase
            .from('parse_attempts')
            .select('id, author, created_at, parsed_prerequisites, parsed_credit_conflicts, parse_notes, parse_status')
            .eq('dept', course.dept)
            .eq('number', course.number)
            .eq('parse_status', 'success')
            .order('created_at', { ascending: false })
            .limit(1)

          if (parseAttemptsError) {
            console.error(`Error fetching parse attempts for ${course.dept} ${course.number}:`, parseAttemptsError)
          }

          const directParseAttempt = directParseAttempts?.[0]

          return {
            id: course.id,
            dept: course.dept,
            number: course.number,
            title: course.title,
            description: course.description,
            prerequisites: course.prerequisites,
            corequisites: course.corequisites,
            notes: course.notes,
            parse_status: course.parse_status,
            // Include the parsed data from the most recent successful parse attempt
            parsed_prerequisites: directParseAttempt?.parsed_prerequisites || null,
            parsed_credit_conflicts: directParseAttempt?.parsed_credit_conflicts || null,
            verified_at: null // No verification timestamp available
          }
        }

        return {
          id: course.id,
          dept: course.dept,
          number: course.number,
          title: course.title,
          description: course.description,
          prerequisites: course.prerequisites,
          corequisites: course.corequisites,
          notes: course.notes,
          parse_status: course.parse_status,
          // Include the parsed data from the verified parse attempt
          parsed_prerequisites: parseAttempt?.parsed_prerequisites || null,
          parsed_credit_conflicts: parseAttempt?.parsed_credit_conflicts || null,
          verified_at: verification?.created_at || null
        }
      })
    )

    // Get export metadata
    const exportData = {
      metadata: {
        title: "SFU Verified Course Prerequisites Export",
        description: "This file contains all courses that have been human-verified through the crowdsourcing system. Each course includes the original prerequisite text and the parsed/structured prerequisite data.",
        exportDate: new Date().toISOString(),
        totalCourses: processedCourses.length,
        fields: {
          id: "Unique course identifier",
          dept: "Department code (e.g., CMPT, MATH)",
          number: "Course number (e.g., 101, 215)",
          title: "Course title",
          description: "Course description",
          prerequisites: "Original prerequisite text from course catalog",
          corequisites: "Original corequisite text from course catalog", 
          notes: "Additional course notes from catalog",
          parse_status: "Current parsing status (should be 'human_verified' for all entries)",
          parsed_prerequisites: "Structured prerequisite data (JSON object) - the verified parsed requirements",
          parsed_credit_conflicts: "Credit exclusion data (JSON object) - courses that conflict with this one",
          verified_at: "Timestamp when the course was verified (from verification table)"
        },
        note: "The parsed_prerequisites field contains structured data representing course requirements. This data has been verified by human reviewers for accuracy."
      },
      courses: processedCourses
    }

    // Return as downloadable JSON file
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Content-Disposition', `attachment; filename="sfu-verified-courses-${new Date().toISOString().split('T')[0]}.json"`)

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers
    })

  } catch (err) {
    console.error('Error in export verified courses API:', err)
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}