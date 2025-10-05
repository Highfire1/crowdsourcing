import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavHeader } from '@/components/nav-header'
import Link from 'next/link'
import { ArrowRight,  BookOpen, Target, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react'

export default function GuidePage() {
  return (
    <main className="min-h-screen">
      <NavHeader />
      
      <div className="max-w-4xl mx-auto p-6 space-y-12">
        {/* 1. Project Introduction */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">How you can help:</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {/* Help us transform text into data that we can use to help you plan your courses! */}
            </p>
          </div>
          
          {/* <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-3">
                  <Bot className="h-12 w-12 mx-auto text-blue-500" />
                  <div>
                    <h3 className="font-semibold">AI Foundation</h3>
                    <p className="text-sm text-muted-foreground">Starting point from automated parsing</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Users className="h-12 w-12 mx-auto text-green-500" />
                  <div>
                    <h3 className="font-semibold">Human Intelligence</h3>
                    <p className="text-sm text-muted-foreground">Community refinement and accuracy</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Eye className="h-12 w-12 mx-auto text-purple-500" />
                  <div>
                    <h3 className="font-semibold">Quality Assurance</h3>
                    <p className="text-sm text-muted-foreground">Peer review and verification</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </section>

        {/* 2. Parse Section */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              Step 1: Course Parsing
            </h2>
            {/* <p className="text-lg text-muted-foreground">
              Convert raw prerequisite text into structured, logical requirements
            </p> */}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Parse a course.</CardTitle>
                <CardDescription>
                  The first step is to parse the course into data.
                  <br/>
                  This can be confusing, so read carefully and evaluate all of the options.
                  <br/>
                  Skip any course prerequisites you aren&apos;t sure about.
                </CardDescription>
              </CardHeader>
              {/* <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-semibold text-sm">Submit</p>
                      <p className="text-xs text-muted-foreground">Approve the parsing work</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm">Skip</p>
                      <p className="text-xs text-muted-foreground">Move to next if unsure</p>
                    </div>
                  </div>
                </div>
              </CardContent> */}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Examples</CardTitle>
                {/* <CardDescription>
                  See how different prerequisite texts become structured requirements
                </CardDescription> */}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Example 1 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Example 1: Simple OR Logic</h4>
                  <div className="p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-mono">&quot;Six lower division units in political science or permission of the department.&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">ONE OF</Badge>
                      <span className="text-sm">Any one of:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Credits</Badge>
                        <span className="text-sm">6 credits in POL at LD level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Permission</Badge>
                        <span className="text-sm">Department permission</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example 2: Ambiguous Permission Scope */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Example 2: Ambiguous Permission Scope</h4>
                  <div className="p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-mono">&quot;POL 141 and three lower division units in political science or permission of the department.&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">Mark as Ambiguous</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      It&apos;s unclear what &quot;or permission of the department&quot; applies to:
                      <br />• Just the 3 lower division units? 
                      <br />• Both POL 141 AND the 3 units?
                      <br />• The entire requirement?
                    </p>
                  </div>
                </div>

                {/* Example 3 */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Example 3: Multiple Course Requirements</h4>
                  <div className="p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-mono">&quot;MATH 140 and MATH 141, and PHYS 121.&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">ALL OF</Badge>
                      <span className="text-sm">All of these:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Course</Badge>
                        <span className="text-sm">MATH 140</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Course</Badge>
                        <span className="text-sm">MATH 141</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Course</Badge>
                        <span className="text-sm">PHYS 121</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example 3 */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Example 3: GPA and Course Requirements</h4>
                  <div className="p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-mono">&quot;Completion of CS 101 with a grade of C or better and cumulative GPA of 2.5 or higher.&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">ALL OF</Badge>
                      <span className="text-sm">All of these:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Course</Badge>
                        <span className="text-sm">CS 101 (grade ≥ C)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-xs">CGPA</Badge>
                        <span className="text-sm">Cumulative GPA ≥ 2.5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example 4 */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Example 4: Credit Hours with Subject Restriction</h4>
                  <div className="p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-mono">&quot;Completion of 30 semester hours including 12 hours in biological sciences.&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">ALL OF</Badge>
                      <span className="text-sm">All of these:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-800 text-xs">Credits</Badge>
                        <span className="text-sm">30 total credit hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-800 text-xs">Credits</Badge>
                        <span className="text-sm">12 credits in BIOL</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example 5 */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Example 5: Complex Nested Logic</h4>
                  <div className="p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-mono">&quot;MATH 240 or (MATH 140 and STAT 200), plus admission to the Computer Science program.&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">ALL OF</Badge>
                      <span className="text-sm">All of these:</span>
                    </div>
                    <div className="ml-6 space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-xs">ONE OF</Badge>
                          <span className="text-sm">One of these:</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">Course</Badge>
                            <span className="text-sm">MATH 240</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 text-xs">ALL OF</Badge>
                              <span className="text-sm">Both MATH 140 and STAT 200</span>
                            </div>
                            <div className="ml-6 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">Course</Badge>
                                <span className="text-sm">MATH 140</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">Course</Badge>
                                <span className="text-sm">STAT 200</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-800 text-xs">Program</Badge>
                        <span className="text-sm">CS Program admission</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>How to Parse</CardTitle>
                <CardDescription>
                  Step-by-step parsing process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">1</span>
                    <span className="text-sm">Read the original prerequisite text carefully</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">2</span>
                    <span className="text-sm">Use the visual editor to build the logical structure</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">3</span>
                    <span className="text-sm">Add requirement types: courses, GPAs, credits, permissions</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">4</span>
                    <span className="text-sm">Submit your work to help the community</span>
                  </li>
                </ol>
              </CardContent>
            </Card> */}
          </div>

          {/* <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-center">Requirement Types You&apos;ll Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Badge variant="secondary">Course</Badge>
                  <p className="text-xs text-muted-foreground">MATH 240, PHYS 121</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-800">CGPA</Badge>
                  <p className="text-xs text-muted-foreground">Minimum 2.0 GPA</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-800">Credits</Badge>
                  <p className="text-xs text-muted-foreground">30 credit hours</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-800">Course Count</Badge>
                  <p className="text-xs text-muted-foreground">2 BIOL courses</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-800">Program</Badge>
                  <p className="text-xs text-muted-foreground">CS Major</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-800">Permission</Badge>
                  <p className="text-xs text-muted-foreground">Instructor approval</p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </section>

        {/* 3. Verification Section */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Target className="h-8 w-8 text-green-500" />
              Step 2: Course Verification
            </h2>
            {/* <p className="text-lg text-muted-foreground">
              Ensure quality through peer review of parsed courses
            </p> */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* <Card>
              <CardHeader>
                <CardTitle>Your Role as Verifier</CardTitle>
                <CardDescription>
                  Quality assurance through community review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Review courses parsed by other community members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Compare the structured data against original text</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Verify logical structure and completeness</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Approve accurate work or flag issues</span>
                  </li>
                </ul>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle>Verification Options</CardTitle>
                <CardDescription>
                  Please read the course description carefully and verify the parsing attempts. 
                  <br/>
                  You will not be given courses you have parsed yourself.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-semibold text-sm">Verify Correct</p>
                      <p className="text-xs text-muted-foreground">Approve the parsing work</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm">Skip</p>
                      <p className="text-xs text-muted-foreground">Move to next if unsure</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-semibold text-sm">Something&apos;s Wrong</p>
                      <p className="text-xs text-muted-foreground">Re-parse it yourself</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* <Card className="border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Verification Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• You cannot verify courses you have attempted to parse</li>
                <li>• Each course can only be verified once by the community</li>
                <li>• Only successfully parsed courses are available for verification</li>
                <li>• All parse attempts are shown for your review</li>
              </ul>
            </CardContent>
          </Card> */}
        </section>

        {/* 4. Call to Action */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to Contribute?</h2>
            <p className="text-lg text-muted-foreground">
              Join our community effort to create better course prerequisite data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link 
              href="/parse" 
              className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
                  <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Start Parsing</h3>
                  <p className="text-sm text-muted-foreground">
                    Help structure prerequisite text into clean, logical requirements.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link 
              href="/verify" 
              className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Start Verifying</h3>
                  <p className="text-sm text-muted-foreground">
                    Review and approve the work of others to ensure quality.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-green-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Discord Community Card */}
          <div className="flex justify-center pt-8">
            <a 
              href="https://discord.gg/BVDvgdVgDf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all duration-200 max-w-md"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-[#5865F2]/10 dark:bg-[#5865F2]/20 p-3">
                  <MessageCircle className="h-8 w-8 text-[#5865F2]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Join the Discord!</h3>
                  {/* <p className="text-sm text-muted-foreground">
                    Connect with contributors and get support from the community.
                  </p> */}
                </div>
                <ArrowRight className="h-5 w-5 text-[#5865F2] group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>

          <div className='pb-24'></div>

          {/* <Card className="max-w-2xl mx-auto text-center bg-gradient-to-r from-blue-50 dark:from-blue-950 to-green-50 dark:to-green-950 border-none">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Join the Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Every contribution helps build better tools for students and educators
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </section>
      </div>
    </main>
  )
}
