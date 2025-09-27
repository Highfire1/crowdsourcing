import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  // verify user
  const { data: userRes, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = userRes.user
  if (user.email !== 'tseng.andersonn@gmail.com') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update courses where prereqs, coreqs, and notes are null/empty
  // We'll perform two updates: first matching NULLs, then matching empty strings
  try {
    // Page through all courses in batches to avoid Supabase limits ( > 1000 rows )
    const pageSize = 1000
    let from = 0
    let to = pageSize - 1
    const allCourseRows: { id: number; prerequisites: string | null; corequisites: string | null; notes: string | null }[] = []

    type CourseRow = { id: number; prerequisites: string | null; corequisites: string | null; notes: string | null }
    while (true) {
      const { data: page, error: pageErr } = await supabase
        .from('courses_sfu')
        .select('id, prerequisites, corequisites, notes')
        .range(from, to) as { data: CourseRow[] | null; error: unknown }

      if (pageErr) {
        console.error('Failed to fetch page:', pageErr)
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
      }

      if (!page || page.length === 0) break

      allCourseRows.push(...page)

      // If fetched less than pageSize, we're done
      if (page.length < pageSize) break

      from += pageSize
      to += pageSize
    }

    const toUpdateIds: number[] = []

    // Normalizer: trim, replace NBSP, collapse whitespace, and lower-case
    const normalize = (v: string | null | undefined) => {
      if (v === null || v === undefined) return ''
      // Replace non-breaking spaces and other unicode spaces with normal space
      const replaced = v.replace(/\u00A0/g, ' ')
      return replaced.replace(/\s+/g, ' ').trim().toLowerCase()
    }

    // Treat these sentinel texts as empty (case-insensitive)
    const SENTINEL_EMPTY = new Set(['', 'empty', 'n/a', 'na', 'none', 'tba', 'null', '—', '-', 'none listed'])

    for (const row of allCourseRows) {
      const prereq = normalize(row.prerequisites)
      const coreq = normalize(row.corequisites)
      const notes = normalize(row.notes)

      const emptyish = (norm: string) => {
        return SENTINEL_EMPTY.has(norm)
      }

      if (emptyish(prereq) && emptyish(coreq) && emptyish(notes)) {
        toUpdateIds.push(row.id)
      }
    }

    if (toUpdateIds.length === 0) {
      return NextResponse.json({ updated: 0, candidateCount: allCourseRows.length, toUpdateCount: 0 })
    }

    // Perform batched updates and count updated rows per-chunk to avoid very long query params.
    const chunkSize = 500
    let totalUpdated = 0
    for (let i = 0; i < toUpdateIds.length; i += chunkSize) {
      const chunk = toUpdateIds.slice(i, i + chunkSize)

      const updateResp = await supabase
        .from('courses_sfu')
        .update({ parse_status: 'no_parse_needed' })
        .in('id', chunk)

      // Try to derive how many rows were updated from the response data when available
      // The supabase client may or may not return the rows depending on configuration and RLS.
      const updateData = (updateResp as { data?: { id: number }[] | null }).data
      const updateErr = (updateResp as { error?: unknown }).error

      if (updateErr) {
        console.error('Failed to update chunk:', updateErr)
      }

      if (Array.isArray(updateData)) {
        totalUpdated += updateData.length
        continue
      }

      // Fallback: count how many in this chunk now have the desired status
      const { count: chunkCount, error: countErr } = await supabase
        .from('courses_sfu')
        .select('id', { count: 'exact', head: true })
        .in('id', chunk)
        .eq('parse_status', 'no_parse_needed') as { count: number | null; error: unknown }

      if (countErr) {
        console.error('Failed to count chunk after update:', countErr)
      } else {
        totalUpdated += (chunkCount ?? 0)
      }
    }

    // Return diagnostic info to help debug partial updates
  return NextResponse.json({ updated: totalUpdated, candidateCount: allCourseRows.length, toUpdateCount: toUpdateIds.length, sampleIds: toUpdateIds.slice(0, 20) })
  } catch (err) {
    console.error('Unexpected error updating courses:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
