"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

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

  return (
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
  )
}
