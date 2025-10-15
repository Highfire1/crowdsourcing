"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AI_USER_IDS } from '@/lib/ai-users'

export default function AdminPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [parseAttemptsLoading, setParseAttemptsLoading] = useState(false)
  const [parseAttemptsResult, setParseAttemptsResult] = useState<string | null>(null)

  const runUpdate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/set-no-parse-needed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setResult(JSON.stringify({ ok: false, status: res.status, body: data }, null, 2))
      } else {
        setResult(JSON.stringify({ ok: true, status: res.status, body: data }, null, 2))
      }
    } catch (err: unknown) {
      setResult(JSON.stringify({ ok: false, error: String(err) }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const runParseAttemptsUpdate = async () => {
    setParseAttemptsLoading(true)
    setParseAttemptsResult(null)

    try {
      const res = await fetch('/api/admin/update-from-parse-attempts', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setParseAttemptsResult(JSON.stringify({ ok: false, status: res.status, body: data }, null, 2))
      } else {
        setParseAttemptsResult(JSON.stringify({ ok: true, status: res.status, body: data }, null, 2))
      }
    } catch (err: unknown) {
      setParseAttemptsResult(JSON.stringify({ ok: false, error: String(err) }, null, 2))
    } finally {
      setParseAttemptsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin: Course Parse Status Update</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will set <code>parse_status = &quot;no_parse_needed&quot;</code> for any course where prerequisites, corequisites, and notes are empty or null.</p>

          <div className="flex items-center gap-4">
            <Button onClick={runUpdate} disabled={loading}>
              {loading ? 'Running…' : "Run Update"}
            </Button>
            {result && (
              <pre className="text-xs p-2 rounded border max-h-48 overflow-auto bg-muted text-muted-foreground">{result}</pre>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Courses from Parse Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will find all courses where you have parse_attempts and update their status from <code>ai_parsed</code> or <code>ai_parsed_failed</code> to <code>human_parsed_once_success</code>.</p>
          <p className="mb-4 text-sm text-muted-foreground">Author ID: {AI_USER_IDS.GEMINI_PRO}</p>

          <div className="flex items-center gap-4">
            <Button onClick={runParseAttemptsUpdate} disabled={parseAttemptsLoading}>
              {parseAttemptsLoading ? 'Running…' : "Update from Parse Attempts"}
            </Button>
            {parseAttemptsResult && (
              <pre className="text-xs p-2 rounded border max-h-48 overflow-auto bg-muted text-muted-foreground">{parseAttemptsResult}</pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
