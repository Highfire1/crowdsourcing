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
  const [exportLoading, setExportLoading] = useState(false)

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

  const exportVerifiedCourses = async () => {
    setExportLoading(true)

    try {
      const res = await fetch('/api/admin/export-verified-courses', { method: 'GET' })
      
      if (!res.ok) {
        throw new Error(`Export failed: ${res.status}`)
      }

      // Get the blob and create download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sfu-verified-courses-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: unknown) {
      console.error('Export error:', err)
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setExportLoading(false)
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

      <Card>
        <CardHeader>
          <CardTitle>Export Verified Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Export all human-verified courses as a JSON file. The file includes metadata about the export and structured prerequisite data.</p>
          <p className="mb-4 text-sm text-muted-foreground">File will be downloaded with filename: sfu-verified-courses-[date].json</p>

          <div className="flex items-center gap-4">
            <Button onClick={exportVerifiedCourses} disabled={exportLoading}>
              {exportLoading ? 'Exporting…' : "Export Verified Courses"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
