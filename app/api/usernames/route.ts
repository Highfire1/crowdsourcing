import { createClient } from '@supabase/supabase-js'
import { filterRealUserIds, mapAIUsers } from '@/lib/ai-users'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()
    
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 })
    }
    
    const validIds = userIds.filter((id): id is string => typeof id === 'string' && id !== null)
    
    if (validIds.length === 0) {
      return NextResponse.json({ usernames: {} })
    }
    
    // Handle AI users first
    const aiUserMap = mapAIUsers(validIds)
    const realUserIds = filterRealUserIds(validIds)
    
    if (realUserIds.length === 0) {
      return NextResponse.json({ usernames: aiUserMap })
    }
    
    // Create service role client for real users
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
    
    // Fetch each real user individually using the auth admin API
    for (const userId of realUserIds) {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(userId)
        
        if (error) {
          console.error(`Error fetching user ${userId}:`, error)
          aiUserMap[userId] = userId // fallback to user ID
        } else if (data?.user) {
          // Try to get display name from user metadata or email
          const githubUsername = data.user.user_metadata?.user_name || data.user.user_metadata?.preferred_username
          const displayName = githubUsername || data.user.user_metadata?.full_name || data.user.email || userId
          aiUserMap[userId] = displayName
        } else {
          aiUserMap[userId] = userId // fallback to user ID
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err)
        aiUserMap[userId] = userId // fallback to user ID
      }
    }
    
    return NextResponse.json({ usernames: aiUserMap })
  } catch (error) {
    console.error('Error in usernames API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}