import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dept, number, verification_status, parse_attempt_id } = body

    // Validate required fields
    if (!dept || !number || !verification_status || !parse_attempt_id) {
      return NextResponse.json(
        { error: 'Missing required fields: dept, number, verification_status, parse_attempt_id' },
        { status: 400 }
      )
    }

    // Get user info from the regular client
    const userSupabase = await createClient()
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log(`Saving verification for ${dept} ${number} by user ${user.id}`)

    // Use service_role client for elevated permissions
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate that the parse_attempt_id exists and matches the course
    const { data: parseAttempt, error: parseError } = await serviceSupabase
      .from('parse_attempts')
      .select('id, dept, number, author')
      .eq('id', parse_attempt_id)
      .single()

    if (parseError || !parseAttempt) {
      return NextResponse.json({ error: 'Invalid parse_attempt_id' }, { status: 400 })
    }

    // Verify that the dept and number match the parse attempt
    if (parseAttempt.dept !== dept || parseAttempt.number !== number) {
      return NextResponse.json(
        { error: 'Department and number must match the parse attempt' },
        { status: 400 }
      )
    }

    // Check if user has attempted to parse this course (should not be able to verify)
    const { data: userParseAttempts, error: userParseError } = await serviceSupabase
      .from('parse_attempts')
      .select('id')
      .eq('dept', dept)
      .eq('number', number)
      .eq('author', user.id)
      .limit(1)

    if (userParseError) {
      console.error('Error checking user parse attempts:', userParseError)
      return NextResponse.json({ error: 'Failed to check parse attempts' }, { status: 500 })
    }

    if (userParseAttempts && userParseAttempts.length > 0) {
      return NextResponse.json({ error: 'Cannot verify courses you have attempted to parse' }, { status: 403 })
    }

    // Insert the verification into verifications_sfu table
    const { data: verification, error: verificationError } = await serviceSupabase
      .from('verifications_sfu')
      .insert({
        author: user.id,
        dept,
        number,
        verification_status,
        parse_attempt_id
      })
      .select()
      .single()

    if (verificationError) {
      console.error('Error inserting verification:', verificationError)
      return NextResponse.json({ error: 'Failed to save verification' }, { status: 500 })
    }

    // If verification is approved, update course status to 'human_verified'
    if (verification_status === 'success') {
      const { error: updateError } = await serviceSupabase
        .from('courses_sfu')
        .update({ parse_status: 'human_verified' })
        .eq('dept', dept)
        .eq('number', number)

      if (updateError) {
        console.error('Error updating course status:', updateError)
        // Don't fail the whole request if this fails
      }
    }

    console.log(`Successfully verified ${dept} ${number} by ${user.id}`)

    return NextResponse.json({ 
      message: 'Verification saved successfully',
      verification,
      dept,
      number,
      verification_status,
      parse_attempt_id,
      author: user.id
    })

  } catch (err) {
    console.error('Unexpected error in verification save:', err)
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}