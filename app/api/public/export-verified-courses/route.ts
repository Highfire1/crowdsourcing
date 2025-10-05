import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Types for the export data
interface ExportCourse {
  id: string
  dept: string
  number: string
  title: string
  description: string
  prerequisites: string
  corequisites: string
  notes: string
  parse_status: string
  parsed_prerequisites: object | null
  parsed_credit_conflicts: object | null
  verified_at: string | null
}

interface ExportData {
  metadata: {
    title: string
    description: string
    exportDate: string
    totalCourses: number
    apiVersion: string
    fields: Record<string, string>
    note: string
  }
  courses: ExportCourse[]
}

// Simple in-memory cache for the export data
let cachedData: ExportData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

// Simple rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per IP

function getRateLimitKey(request: NextRequest): string {
  // Use forwarded IP if available (for production with reverse proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIP || 'unknown'
  return `rate_limit:${ip}`
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  record.count++
  return true
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('api_key')
  const validApiKey = process.env.PUBLIC_API_KEY
  
  if (!validApiKey) {
    console.warn('PUBLIC_API_KEY environment variable not set')
    return false
  }
  
  return apiKey === validApiKey
}

async function fetchVerifiedCourses(): Promise<ExportCourse[]> {
  // Use service role client for elevated permissions to access all tables
  const supabase = createServiceClient(
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
    // First, get all verified courses
    const { data: verifiedCourses, error: coursesError } = await supabase
      .from('courses_sfu')
      .select('*')
      .eq('parse_status', 'human_verified')
      .order('dept', { ascending: true })
      .order('number', { ascending: true })

    if (coursesError) {
      console.error('Error fetching verified courses:', coursesError)
      throw new Error('Failed to fetch verified courses')
    }

    // For each verified course, get the verification record and associated parse attempt
    const processedCourses = await Promise.all(
      verifiedCourses.map(async (course: ExportCourse) => {
        // First try to get the verification record for this course
        const { data: verifications, error: verificationError } = await supabase
          .from('verifications_sfu')
          .select(`
            id,
            verification_status,
            created_at,
            author,
            parse_attempt_id
          `)
          .eq('dept', course.dept)
          .eq('number', course.number)
          .order('created_at', { ascending: false })
          .limit(1)

        if (verificationError) {
          console.error(`Error fetching verification for ${course.dept} ${course.number}:`, verificationError)
        }

        const verification = verifications?.[0]
        
        // If we have a verification, get the associated parse attempt
        let parseAttempt = null
        if (verification?.parse_attempt_id) {
          const { data: parseAttemptData, error: parseAttemptError } = await supabase
            .from('parse_attempts')
            .select('id, author, created_at, parsed_prerequisites, parsed_credit_conflicts, parse_notes, parse_status')
            .eq('id', verification.parse_attempt_id)
            .single()

          if (parseAttemptError) {
            console.error(`Error fetching parse attempt ${verification.parse_attempt_id} for ${course.dept} ${course.number}:`, parseAttemptError)
          } else {
            parseAttempt = parseAttemptData
          }
        }

        // If no verification record found, try to get parse attempts directly for this course
        if (!verification) {
          const { data: directParseAttempts, error: parseAttemptsError } = await supabase
            .from('parse_attempts')
            .select('id, author, created_at, parsed_prerequisites, parsed_credit_conflicts, parse_notes, parse_status')
            .eq('dept', course.dept)
            .eq('number', course.number)
            .eq('parse_status', 'success')
            .order('created_at', { ascending: false })
            .limit(1)

          if (parseAttemptsError) {
            console.error(`Error fetching parse attempts for ${course.dept} ${course.number}:`, parseAttemptsError)
          }

          const directParseAttempt = directParseAttempts?.[0]

          return {
            id: course.id,
            dept: course.dept,
            number: course.number,
            title: course.title,
            description: course.description,
            prerequisites: course.prerequisites,
            corequisites: course.corequisites,
            notes: course.notes,
            parse_status: course.parse_status,
            // Include the parsed data from the most recent successful parse attempt
            parsed_prerequisites: directParseAttempt?.parsed_prerequisites || null,
            parsed_credit_conflicts: directParseAttempt?.parsed_credit_conflicts || null,
            verified_at: null // No verification timestamp available
          }
        }

        return {
          id: course.id,
          dept: course.dept,
          number: course.number,
          title: course.title,
          description: course.description,
          prerequisites: course.prerequisites,
          corequisites: course.corequisites,
          notes: course.notes,
          parse_status: course.parse_status,
          // Include the parsed data from the verified parse attempt
          parsed_prerequisites: parseAttempt?.parsed_prerequisites || null,
          parsed_credit_conflicts: parseAttempt?.parsed_credit_conflicts || null,
          verified_at: verification?.created_at || null
        }
      })
    )

    return processedCourses
  } catch (err) {
    console.error('Error in fetchVerifiedCourses:', err)
    throw err
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { 
          error: 'Invalid or missing API key',
          message: 'Please provide a valid API key via x-api-key header or api_key query parameter'
        }, 
        { status: 401 }
      )
    }

    // Check rate limit
    const rateLimitKey = getRateLimitKey(request)
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed`
        }, 
        { status: 429 }
      )
    }

    // Check cache
    const now = Date.now()
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Serving cached data')
      
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Cache-Control', 'public, max-age=3600') // 1 hour browser cache
      headers.set('X-Cache', 'HIT')
      
      return new NextResponse(JSON.stringify(cachedData, null, 2), {
        status: 200,
        headers
      })
    }

    console.log('Fetching fresh data from database')
    
    // Fetch fresh data
    const processedCourses = await fetchVerifiedCourses()

    // Create export data structure
    const exportData = {
      metadata: {
        title: "SFU Verified Course Prerequisites Export",
        description: "This file contains all courses that have been human-verified through the crowdsourcing system. Each course includes the original prerequisite text and the parsed/structured prerequisite data.",
        exportDate: new Date().toISOString(),
        totalCourses: processedCourses.length,
        apiVersion: "1.0",
        fields: {
          id: "Unique course identifier",
          dept: "Department code (e.g., CMPT, MATH)",
          number: "Course number (e.g., 101, 215)",
          title: "Course title",
          description: "Course description",
          prerequisites: "Original prerequisite text from course catalog",
          corequisites: "Original corequisite text from course catalog", 
          notes: "Additional course notes from catalog",
          parse_status: "Current parsing status (should be 'human_verified' for all entries)",
          parsed_prerequisites: "Structured prerequisite data (JSON object) - the verified parsed requirements",
          parsed_credit_conflicts: "Credit exclusion data (JSON object) - courses that conflict with this one",
          verified_at: "Timestamp when the course was verified (from verification table)"
        },
        note: "The parsed_prerequisites field contains structured data representing course requirements. This data has been verified by human reviewers for accuracy."
      },
      courses: processedCourses
    }

    // Update cache
    cachedData = exportData
    cacheTimestamp = now

    // Return response
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Cache-Control', 'public, max-age=3600') // 1 hour browser cache
    headers.set('X-Cache', 'MISS')

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers
    })

  } catch (err) {
    console.error('Error in public export API:', err)
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}