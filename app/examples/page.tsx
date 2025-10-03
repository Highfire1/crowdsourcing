import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavHeader } from '@/components/nav-header'
import { ArrowRight, AlertTriangle } from 'lucide-react'

export default function ExamplesPage() {
  return (
    <main className="min-h-screen">
      <NavHeader />
      
      <div className="max-w-4xl mx-auto p-6 space-y-12">
        {/* Header */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Parsing Examples</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              How to handle ambiguous prerequisite statements
            </p>
          </div>
        </section>

        {/* Key Rules */}
        <Card className="border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Parsing Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>• &quot;Normally required&quot; = Required (not optional)</li>
              <li>• Permission statements = separate Permission requirement</li>
              <li>• Program restrictions = Program requirement</li>
              <li>• Time/completion constraints = Other Requirement</li>
            </ul>
          </CardContent>
        </Card>

        {/* Example 1: Co-op Prerequisites */}
        <Card>
          <CardHeader>
            <CardTitle>Permission + Academic Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-sm font-mono">
                &quot;Students must apply and receive permission from the co-op coordinator at least one but preferably two terms in advance. They will normally be required to have completed 45 units with a GPA of 2.50.&quot;
              </p>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">ALL OF</Badge>
              </div>
              <div className="ml-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-800 text-xs">Permission</Badge>
                  <span className="text-sm">Students must apply and receive permission from the co-op coordinator at least one but preferably two terms in advance.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-800 text-xs">Credits</Badge>
                  <span className="text-sm">45 units</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-xs">CGPA</Badge>
                  <span className="text-sm">CGPA ≥ 2.50</span>
                </div>
              </div>
            </div>

            <div className="p-2 border-l-4 border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 text-sm">
              <strong>Decision:</strong> Permission goes in separate requirement. &quot;Normally required&quot; = required.
            </div>
          </CardContent>
        </Card>

        {/* Example 2: Program Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Program + Time Constraints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-sm font-mono">
                &quot;Applied Mathematics PhD stream students only. Must be completed within first six terms of the program.&quot;
              </p>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">ALL OF</Badge>
              </div>
              <div className="ml-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-800 text-xs">Program</Badge>
                  <span className="text-sm">Applied Mathematics PhD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-800 text-xs">Other Requirement</Badge>
                  <span className="text-sm">Must be completed within first six terms of the program.</span>
                </div>
              </div>
            </div>

            {/* <div className="p-2 border-l-4 border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 text-sm">
              <strong>Decision:</strong> Program restriction = Program requirement. Time constraint = Other Requirement.
            </div> */}
          </CardContent>
        </Card>

        {/* Example 3: Ambiguous Permission Scope */}
        <Card>
          <CardHeader>
            <CardTitle>Ambiguous Permission Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-sm font-mono">
                &quot;POL 141 and three lower division units in political science or permission of the department.&quot;
              </p>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 font-medium">Mark as Ambiguous</span>
              </div>
            </div>

            <div className="p-2 border-l-4 border-amber-200 bg-amber-50/50 dark:bg-amber-900/20 text-sm">
              <strong>Problem:</strong> It&apos;s unclear what &quot;or permission of the department&quot; applies to:
              <ul className="mt-2 ml-4 space-y-1">
                <li>• Just the 3 lower division units?</li>
                <li>• Both POL 141 AND the 3 units?</li>
                <li>• The entire requirement?</li>
              </ul>
              <strong className="block mt-2">Decision:</strong> Mark as ambiguous - cannot parse definitively without clarification.
            </div>
          </CardContent>
        </Card>

        <div className="pb-24"></div>
      </div>
    </main>
  )
}