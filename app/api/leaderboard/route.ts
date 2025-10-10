import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface LeaderboardEntry {
  userId: string
  username: string
  count: number
}

export async function GET() {
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

  try {
    // Get top 10 users by parse attempts count
    const { data: parseAttempts, error: parseError } = await supabase
      .from('parse_attempts')
      .select('author')
      .not('author', 'is', null)

    if (parseError) {
      console.error('Error fetching parse attempts:', parseError)
      return NextResponse.json({ error: 'Failed to fetch parse attempts' }, { status: 500 })
    }

    // Get top 10 users by verifications count
    const { data: verifications, error: verifyError } = await supabase
      .from('verifications_sfu')
      .select('author')
      .not('author', 'is', null)

    if (verifyError) {
      console.error('Error fetching verifications:', verifyError)
      return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 })
    }

    // Count parse attempts per user
    const parseCounts = new Map<string, number>()
    parseAttempts.forEach((attempt: { author: string }) => {
      const current = parseCounts.get(attempt.author) || 0
      parseCounts.set(attempt.author, current + 1)
    })

    // Count verifications per user
    const verifyCounts = new Map<string, number>()
    verifications.forEach((verify: { author: string }) => {
      const current = verifyCounts.get(verify.author) || 0
      verifyCounts.set(verify.author, current + 1)
    })

    // Get unique user IDs
    const allUserIds = new Set([
      ...Array.from(parseCounts.keys()),
      ...Array.from(verifyCounts.keys())
    ])

    // Fetch usernames for all users
    const usernames = new Map<string, string>()
    for (const userId of allUserIds) {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(userId)
        if (error || !data?.user) {
          usernames.set(userId, userId) // Fallback to UUID
          continue
        }

        const githubUsername = data.user.user_metadata?.user_name
        const displayName = githubUsername || data.user.user_metadata?.full_name || data.user.email || userId
        usernames.set(userId, displayName)
      } catch {
        usernames.set(userId, userId) // Fallback to UUID on error
      }
    }

    // Build top 10 parsing leaderboard
    const parsingLeaderboard: LeaderboardEntry[] = Array.from(parseCounts.entries())
      .map(([userId, count]) => ({
        userId,
        username: usernames.get(userId) || userId,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Build top 10 verification leaderboard
    const verificationLeaderboard: LeaderboardEntry[] = Array.from(verifyCounts.entries())
      .map(([userId, count]) => ({
        userId,
        username: usernames.get(userId) || userId,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      parsing: parsingLeaderboard,
      verification: verificationLeaderboard
    })

  } catch (err) {
    console.error('Error in leaderboard API:', err)
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
