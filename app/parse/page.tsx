import { createClient } from '@/lib/supabase/server'
import { NavHeader } from '@/components/nav-header'
import ParsePanel from './parse-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ParsePage() {
  const supabase = await createClient()

  // Try to fetch one course with ai_parsed (prefer) or ai_parsed_failed
  const { data: preferred, error: prefErr } = await supabase
    .from('courses_sfu')
    .select('id, dept, number, title, description, prerequisites, corequisites, notes, parse_status')
    .eq('parse_status', 'ai_parsed')
    .order('id', { ascending: true })
    .limit(1)

  if (prefErr) console.error('Error fetching preferred course', prefErr)

  let course = preferred && preferred.length > 0 ? preferred[0] : null

  if (!course) {
    const { data: fallback, error: fbErr } = await supabase
      .from('courses_sfu')
      .select('id, dept, number, title, description, prerequisites, corequisites, notes, parse_status')
      .eq('parse_status', 'ai_parsed_failed')
      .order('id', { ascending: true })
      .limit(1)

    if (fbErr) console.error('Error fetching fallback course', fbErr)
    course = fallback && fallback.length > 0 ? fallback[0] : null
  }

  return (
    <main className="h-[100vh] flex flex-col items-stretch">
      <NavHeader />

      <div className="flex-1 w-full flex flex-col">
        <div className="w-full py-4 flex-1 flex items-stretch">
          {!course ? (
            <div className="m-4 flex-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>No course available to parse</CardTitle>
                </CardHeader>
                <CardContent>
                  There are no courses with parse_status `ai_parsed` or `ai_parsed_failed`.
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 m-2">
              <ParsePanel course={course} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
