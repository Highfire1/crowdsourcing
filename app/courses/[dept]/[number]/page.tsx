import { createClient } from '@/lib/supabase/server'
import { NavHeader } from '@/components/nav-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
// Removed RequirementFlowEditor from course page (moved to /parse)

interface Course {
  dept: string
  number: string
  title: string | null
  description: string | null
  prerequisites: string | null
  corequisites: string | null
  notes: string | null
  parse_status: string | null
}

interface ParseAttempt {
  id: number
  created_at: string
  author: string | null
  dept: string
  number: string
  original_prerequisites: string | null
  original_corequisites: string | null
  original_notes: string | null
  parsed_prerequisites: Record<string, unknown> | null
  parsed_corequisites: Record<string, unknown> | null
  parsed_credit_conflicts: Record<string, unknown> | null
}

async function getCourse(dept: string, number: string): Promise<Course | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('courses_sfu')
    .select('*')
    .eq('dept', dept.toUpperCase())
    .eq('number', number)
    .single()
  
  if (error) {
    console.error('Error fetching course:', error)
    return null
  }
  
  return data
}

async function getParseAttempts(dept: string, number: string): Promise<ParseAttempt[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('parse_attempts')
    .select('*')
    .eq('dept', dept.toUpperCase())
    .eq('number', number)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching parse attempts:', JSON.stringify(error, null, 2))
    return []
  }
  
  return data || []
}

// RequirementFlowEditor removed from this page; parsing is handled in /parse

function getStatusBadgeVariant(status: string | null) {
  switch (status) {
    case 'ai_parsed':
    case 'human_parsed_once_success':
    case 'human_parsed_twice_success':
      return 'default'
    case 'ai_parsed_failed':
    case 'human_parsed_unclear':
      return 'destructive'
    case 'pending':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default async function CoursePage({ params }: { params: Promise<{ dept: string; number: string }> }) {
  const { dept, number } = await params
  
  const [course, parseAttempts] = await Promise.all([
    getCourse(dept, number),
    getParseAttempts(dept, number),
  ])
  
  if (!course) {
    notFound()
  }

  
  return (
    <div className="min-h-screen ">
      <NavHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/courses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-blue-600">{course.dept} {course.number}</span>
            {course.title && (
              <span className="block text-2xl font-normal mt-2">
                {course.title}
              </span>
            )}
          </h1>
          
          {course.parse_status && (
            <Badge variant={getStatusBadgeVariant(course.parse_status)} className="text-sm px-3 py-1">
              {course.parse_status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          )}
        </div>
        
        {/* Course Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="">{course.description}</p>
              </div>
            )}
            
            {course.prerequisites && (
              <div>
                <h3 className="font-semibold mb-2">Prerequisites</h3>
                <p className="">{course.prerequisites}</p>
              </div>
            )}
            
            {course.corequisites && (
              <div>
                <h3 className="font-semibold mb-2">Corequisites</h3>
                <p className="">{course.corequisites}</p>
              </div>
            )}
            
            {course.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="">{course.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Visual Requirement Editor removed from individual course page; use /parse for manual parsing */}
        
        {/* Parse Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>Parse Attempts</CardTitle>
            <CardDescription>
              {parseAttempts.length} parse attempt{parseAttempts.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parseAttempts.length === 0 ? (
              <p className="italic">No parse attempts found for this course.</p>
            ) : (
              <div className="space-y-6">
                {parseAttempts.map((attempt) => (
                  <div key={attempt.id} className="border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold">Parse Attempt #{parseAttempts.length - parseAttempts.indexOf(attempt)}</h3>
                        <p className="text-sm mt-1">
                          {new Date(attempt.created_at).toLocaleString()}
                          {attempt.author && ` • by ${attempt.author === "b8ac96f0-90ba-52ef-9682-2df39ace553e" ? "gemini-pro" : attempt.author}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Original Data */}
                      
                      {/* Parsed Data */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold border-b-2 border-blue-300 pb-2">
                          Parsed Data
                        </h4>
                        
                        {attempt.parsed_prerequisites && (
                          <div>
                            <h5 className="font-medium mb-2">Parsed Prerequisites</h5>
                            <pre className="text-xs  p-3 rounded-lg border border-blue-200 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                              {JSON.stringify(attempt.parsed_prerequisites, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {attempt.parsed_corequisites && (
                          <div>
                            <h5 className="font-medium mb-2">Parsed Corequisites</h5>
                            <pre className="text-xs p-3 rounded-lg border border-blue-200 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                              {JSON.stringify(attempt.parsed_corequisites, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {attempt.parsed_credit_conflicts && (
                          <div>
                            <h5 className="font-medium mb-2">Parsed Credit Conflicts</h5>
                            <pre className="text-xs p-3 rounded-lg border border-blue-200 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                              {JSON.stringify(attempt.parsed_credit_conflicts, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {!attempt.parsed_prerequisites && !attempt.parsed_corequisites && !attempt.parsed_credit_conflicts && (
                          <p className="italic">No parsed data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}