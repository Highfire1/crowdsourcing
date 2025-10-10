import { NavHeader } from '@/components/nav-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, FileText, CheckCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface LeaderboardEntry {
  userId: string
  username: string
  count: number
}

interface LeaderboardData {
  parsing: LeaderboardEntry[]
  verification: LeaderboardEntry[]
}

async function getLeaderboardData(): Promise<LeaderboardData> {
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
      return { parsing: [], verification: [] }
    }

    // Get top 10 users by verifications count
    const { data: verifications, error: verifyError } = await supabase
      .from('verifications_sfu')
      .select('author')
      .not('author', 'is', null)

    if (verifyError) {
      console.error('Error fetching verifications:', verifyError)
      return { parsing: [], verification: [] }
    }

    // Count parse attempts per user (exclude Gemini bot)
    const parseCounts = new Map<string, number>()
    parseAttempts.forEach((attempt: { author: string }) => {
      if (attempt.author === 'b8ac96f0-90ba-52ef-9682-2df39ace553e') return // Skip Gemini bot
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

    return {
      parsing: parsingLeaderboard,
      verification: verificationLeaderboard
    }

  } catch (err) {
    console.error('Error in leaderboard:', err)
    return { parsing: [], verification: [] }
  }
}

export default async function LeaderboardPage() {
  const data = await getLeaderboardData()

  return (
    <main className="min-h-screen">
      <NavHeader />

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <h1 className="text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Top contributors to the SFU course prerequisite crowdsourcing project
          </p>
        </section>

        {/* Leaderboards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Parsing Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Top Parsers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.parsing.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No parsing data yet</p>
              ) : (
                <div className="space-y-2">
                  {data.parsing.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                          {index === 1 && <Trophy className="h-6 w-6 text-gray-400" />}
                          {index === 2 && <Trophy className="h-6 w-6 text-amber-600" />}
                          {index > 2 && (
                            <span className="text-sm font-semibold text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{entry.username}</span>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900">
                        {entry.count} {entry.count === 1 ? 'parse' : 'parses'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Top Verifiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.verification.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No verification data yet</p>
              ) : (
                <div className="space-y-2">
                  {data.verification.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                          {index === 1 && <Trophy className="h-6 w-6 text-gray-400" />}
                          {index === 2 && <Trophy className="h-6 w-6 text-amber-600" />}
                          {index > 2 && (
                            <span className="text-sm font-semibold text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{entry.username}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                        {entry.count} {entry.count === 1 ? 'verification' : 'verifications'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
