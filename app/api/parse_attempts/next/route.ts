import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const dept = searchParams.get('dept')
    
    console.log(`[parse_attempts/next] Fetching course at offset: ${offset}${dept ? ` for department: ${dept}` : ''}`)

    const supabase = await createClient()

    // Build the query with optional department filter
    let query = supabase
      .from('courses_sfu')
      .select('id, dept, number, title, description, prerequisites, corequisites, notes, parse_status', { count: 'exact' })
      .in('parse_status', ['ai_parsed', 'ai_parsed_failed'])
      .order('dept', { ascending: true })
      .order('number', { ascending: true })

    // If department is specified, we want to find the offset of the first course in that department
    if (dept) {
      // First, get all courses to find the position of the first course in this department
      const { data: allCourses, error: allCoursesError } = await supabase
        .from('courses_sfu')
        .select('dept, number')
        .in('parse_status', ['ai_parsed', 'ai_parsed_failed'])
        .order('dept', { ascending: true })
        .order('number', { ascending: true })

      if (allCoursesError) {
        console.error('[parse_attempts/next] Error fetching all courses:', allCoursesError)
        return NextResponse.json({ course: null, error: allCoursesError.message }, { status: 500 })
      }

      // Find the index of the first course in the specified department
      const departmentOffset = allCourses?.findIndex(course => course.dept === dept) ?? -1
      
      if (departmentOffset === -1) {
        console.log(`[parse_attempts/next] No courses found for department ${dept}`)
        return NextResponse.json({ course: null, offset: offset, message: `No courses available for department ${dept}` })
      }

      // Now get the specific course at that offset
      query = query.range(departmentOffset, departmentOffset).limit(1)
      
      const { data: parsedData, error, count } = await query

      if (error) {
        console.error('[parse_attempts/next] Supabase error:', error)
        return NextResponse.json({ course: null, error: error.message }, { status: 500 })
      }

      if (!parsedData || parsedData.length === 0) {
        return NextResponse.json({ course: null, offset: departmentOffset, totalCount: count })
      }

      console.log(`[parse_attempts/next] Successfully returning course: ${parsedData[0].dept} ${parsedData[0].number} at offset ${departmentOffset}`)
      return NextResponse.json({ 
        course: parsedData[0],
        offset: departmentOffset, // Return the actual offset of this course
        totalCount: count
      })
    } else {
      // Normal offset-based query
      const { data: parsedData, error, count } = await query
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
        offset: offset, // Return current offset, don't increment here
        totalCount: count
      })
    }
  } catch (err) {
    console.error('Error fetching next course', err)
    return NextResponse.json({ course: null }, { status: 500 })
  }
}
