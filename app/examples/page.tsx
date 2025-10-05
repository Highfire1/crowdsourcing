import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavHeader } from '@/components/nav-header'
import { ArrowRight, AlertTriangle, MessageCircle } from 'lucide-react'

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
        {/* <Card className="border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20">
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
        </Card> */}

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
              <div className="p-2 border-l-4 border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 text-sm">
                <strong>Decision:</strong> The second requirement cannot be represented as any other prerequisite type, so we put it under Other Requirement. Technically, this is not a prerequisite, but since it is in the prerequisite field and it is mandatory, we include it.
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
                {/* <li>• The entire requirement?</li> */}
              </ul>
              <strong className="block mt-2">Decision:</strong> Mark as ambiguous - cannot parse definitively without clarification.
            </div>
          </CardContent>
        </Card>

        {/* Example 4: Complex Prerequisites with Corequisites */}
        <Card>
          <CardHeader>
            <CardTitle>Complex Prerequisites + Corequisites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-sm font-mono">
                &quot;Prerequisites: Pre-Calculus 12 (or equivalent), MATH 100 or MATH 110 (either may be taken concurrently), or permission of the department. Corequisite: CHEM 110.&quot;
              </p>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Prerequisites:</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">ONE OF</Badge>
                  <span className="text-sm">Any one of:</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-800 text-xs">HS Course</Badge>
                    <span className="text-sm">Pre-Calculus 12 (or equivalent)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Course</Badge>
                    <span className="text-sm">MATH 100 (concurrent allowed)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Course</Badge>
                    <span className="text-sm">MATH 110 (concurrent allowed)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-800 text-xs">Permission</Badge>
                    <span className="text-sm">Permission of the department</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Corequisites:</h4>
                <div className="ml-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Course</Badge>
                    <span className="text-sm">CHEM 110 (concurrent allowed)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 border-l-4 border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 text-sm">
              <strong>Key Points:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• &quot;Either may be taken concurrently&quot; applies to both MATH courses</li>
                <li>• Permission is alternative to academic requirements</li>
                <li>• Corequisites are separate from prerequisites</li>
                <li>• Mark concurrent courses with &quot;Can be concurrent&quot; checkbox</li>
              </ul>
            </div>

            <details className="mt-4">
              <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                Show JSON Structure
              </summary>
              <pre className="mt-3 p-3 rounded border text-xs overflow-auto max-h-64 bg-gray-50 dark:bg-gray-900">
                {`{
  "prerequisites": {
    "type": "group",
    "logic": "ONE_OF",
    "children": [
      {
        "type": "HSCourse",
        "course": "Pre-Calculus 12",
        "orEquivalent": "true"
      },
      {
        "type": "course",
        "department": "MATH",
        "number": "100",
        "canBeTakenConcurrently": "true"
      },
      {
        "type": "course",
        "department": "MATH",
        "number": "110",
        "canBeTakenConcurrently": "true"
      },
      {
        "type": "permission",
        "note": "Permission of the department."
      }
    ]
  },
  "corequisites": {
    "type": "course",
    "department": "CHEM",
    "number": "110",
    "canBeTakenConcurrently": "true"
  }
}`}
              </pre>
            </details>
          </CardContent>
        </Card>

        {/* Example 5: Incomplete/Ambiguous Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Incomplete/Ambiguous Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-sm font-mono">
                &quot;Completion of 60 units in a science or applied science program, including first year chemistry, physics and calculus. CHEM 230 is strongly recommended.&quot;
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
              <strong>Problem:</strong> The prerequisites are not fully stated:
              <ul className="mt-2 ml-4 space-y-1">
                <li>• Which specific courses qualify as &quot;first year chemistry, physics and calculus?&quot;?</li>
              </ul>
              <strong className="block mt-2">Decision:</strong> Mark as ambiguous because parsed prerequisites should be as specific as possible.
            </div>
          </CardContent>
        </Card>

        {/* Discord Community Card */}
        <div className="flex justify-center">
          <a 
            href="https://discord.gg/BVDvgdVgDf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group max-w-md w-full"
          >
            <Card className="hover:shadow-lg transition-all duration-200 border-[#5865F2]/20 dark:border-[#5865F2]/30 hover:border-[#5865F2]/40 dark:hover:border-[#5865F2]/50">
              <CardContent className="text-center p-6 bg-[#5865F2]/5 dark:bg-[#5865F2]/10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-full bg-[#5865F2]/10 dark:bg-[#5865F2]/20 p-3">
                    <MessageCircle className="h-8 w-8 text-[#5865F2]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-[#5865F2]">Need Help with Parsing?</h3>
                    <p className="text-sm text-muted-foreground">
                      Join the discord and we will figure it out 👍
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>

        <div className="pb-24"></div>
      </div>
    </main>
  )
}