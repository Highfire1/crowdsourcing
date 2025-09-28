import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  console.log('=== VERIFY SAVE API CALLED ===')
  try {
    console.log('1. Parsing request body...')
    const body = await request.json()
    console.log('2. Request body parsed:', body)
    
    const { dept, number, verification_status } = body
    console.log('3. Extracted fields:', { dept, number, verification_status })

    console.log('4. Creating user supabase client...')
    // Get user info from the regular client
    const userSupabase = await createClient()
    console.log('5. Getting user from supabase...')
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    
    console.log('6. User data:', user ? { id: user.id, email: user.email } : 'null')
    console.log('7. User error:', userError)
    
    if (userError || !user) {
      console.log('8. Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log(`9. Saving verification for ${dept} ${number} by user ${user.id}`)

    console.log('10. Creating service supabase client...')
    // Use service_role client for elevated permissions
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    console.log('11. Service client created')

    console.log('12. Checking if user has attempted to parse this course...')
    // Check if user has attempted to parse this course (should not be able to verify)
    const { data: userParseAttempts, error: userParseError } = await serviceSupabase
      .from('parse_attempts')
      .select('id')
      .eq('dept', dept)
      .eq('number', number)
      .eq('author', user.id)
      .limit(1)

    console.log('13. User parse attempts check result:', { userParseAttempts, userParseError })

    if (userParseError) {
      console.error('14. Error checking user parse attempts:', userParseError)
      return NextResponse.json({ error: 'Failed to check parse attempts' }, { status: 500 })
    }

    if (userParseAttempts && userParseAttempts.length > 0) {
      console.log('15. User has parse attempts - cannot verify')
      return NextResponse.json({ error: 'Cannot verify courses you have attempted to parse' }, { status: 403 })
    }

    console.log('16. User can verify this course - proceeding...')
    // For now, skip the course_verifications table since it may not exist yet
    // Just update the course status to 'human_verified'
    console.log('17. Updating course status to human_verified')
    const { error: updateError } = await serviceSupabase
      .from('courses_sfu')
      .update({ parse_status: 'human_verified' })
      .eq('dept', dept)
      .eq('number', number)

    console.log('18. Course update result:', { updateError })

    if (updateError) {
      console.error('19. Error updating course status:', updateError)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      return NextResponse.json({ error: 'Failed to update course status', details: updateError.message }, { status: 500 })
    }

    console.log(`20. Successfully verified ${dept} ${number} by ${user.id}`)

    return NextResponse.json({ 
      message: 'Verification saved successfully (course_verifications table pending)',
      dept,
      number,
      verification_status,
      author: user.id
    })

  } catch (err) {
    console.error('=== UNEXPECTED ERROR IN VERIFICATION SAVE ===')
    console.error('Error object:', err)
    console.error('Error name:', err instanceof Error ? err.name : 'Unknown')
    console.error('Error message:', err instanceof Error ? err.message : 'Unknown')
    console.error('Error stack:', err instanceof Error ? err.stack : 'Unknown')
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}