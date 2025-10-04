import { RequirementCourse, RequirementHSCourse, RequirementCreditCount, RequirementPermission } from '@/lib/course_types'

export interface ParsedPrerequisites {
  courses: RequirementCourse[]
  hsCourses: RequirementHSCourse[]
  creditCounts: RequirementCreditCount[]
  permissions: RequirementPermission[]
}

// List of all valid SFU subjects
export const SUBJECTS = [
  "ACMA",
  "ALS",
  "APMA",
  "ARAB",
  "ARCH",
  "BISC",
  "BPK",
  "BUS",
  "CA",
  "CENV",
  "CHEM",
  "CHIN",
  "CMNS",
  "CMPT",
  "COGS",
  "CRIM",
  "DATA",
  "DIAL",
  "DMED",
  "EASC",
  "ECO",
  "ECON",
  "EDPR",
  "EDUC",
  "ENGL",
  "ENSC",
  "ENV",
  "EVSC",
  "FAL",
  "FAN",
  "FASS",
  "FEP",
  "FREN",
  "GA",
  "GEOG",
  "GERM",
  "GERO",
  "GRAD",
  "GRK",
  "GSWS",
  "HIST",
  "HSCI",
  "HUM",
  "IAT",
  "INDG",
  "INLG",
  "INS",
  "IS",
  "ITAL",
  "JAPN",
  "LANG",
  "LBRL",
  "LBST",
  "LING",
  "LS",
  "MACM",
  "MASC",
  "MATH",
  "MBB",
  "MSE",
  "NEUR",
  "NUSC",
  "ONC",
  "PERS",
  "PHIL",
  "PHYS",
  "PLAN",
  "PLCY",
  "POL",
  "PORT",
  "PSYC",
  "PUB",
  "PUNJ",
  "REM",
  "SA",
  "SCI",
  "SD",
  "SDA",
  "SEE",
  "SPAN",
  "STAT",
  "TEKX",
  "UGRAD",
  "URB",
  "WL",
];

/**
 * Parses prerequisite and corequisite text to extract course codes and high school courses
 */
export function parsePrerequisiteText(prerequisiteText: string, corequisiteText?: string): ParsedPrerequisites {
  const courses: RequirementCourse[] = []
  const hsCourses: RequirementHSCourse[] = []
  const creditCounts: RequirementCreditCount[] = []
  const permissions: RequirementPermission[] = []

  // Combine both prerequisite and corequisite text for parsing
  const combinedText = prerequisiteText + (corequisiteText ? ' ' + corequisiteText : '')

  const seenCourses = new Set<string>()
  
  // Track courses with explicit grades
  const courseGrades = new Map<string, string>()
  let groupGrade: string | null = null

  // Split by grade statements and extract courses that appear before each grade
  const gradeStatements = combinedText.split(/(?=with\s+(?:a\s+)?minimum\s+grade\s+of\s+[A-Z][+-]?)/gi)
  
  for (let i = 0; i < gradeStatements.length; i++) {
    const statement = gradeStatements[i]
    
    // Check if this statement contains a grade
    const gradeMatch = statement.match(/with\s+(?:a\s+)?minimum\s+grade\s+of\s+([A-Z][+-]?)/i)
    if (gradeMatch) {
      const grade = gradeMatch[1]
      
      // Get the text before the grade statement
      const beforeGrade = statement.substring(0, gradeMatch.index)
      
      // Also include the previous statement if it doesn't end with a sentence terminator
      let fullContext = beforeGrade
      if (i > 0) {
        const prevStatement = gradeStatements[i - 1]
        // Check if previous statement flows into this one (no sentence ending)
        if (!prevStatement.match(/[.!?;]\s*$/)) {
          fullContext = prevStatement + beforeGrade
        }
      }
      
      // Extract all courses from the context before this grade
      const courseMatches = fullContext.matchAll(/\b([A-Z]{2,4})\s+(\d{3}[A-Z]?)\b/g)
      for (const courseMatch of courseMatches) {
        const dept = courseMatch[1]
        const number = courseMatch[2]
        
        if (SUBJECTS.includes(dept)) {
          const courseKey = `${dept} ${number}`
          if (!courseGrades.has(courseKey)) { // Don't override existing grades
            courseGrades.set(courseKey, grade)
          }
        }
      }
    }
  }

  // Check for group-level grades (like "all with a minimum grade of C-")
  const groupGradeMatch = combinedText.match(/(?:all|each)\s+with\s+(?:a\s+)?minimum\s+grade\s+of\s+([A-Z][+-]?)/i)
  if (groupGradeMatch) {
    groupGrade = groupGradeMatch[1]
  }

  // First pass: Find all explicit DEPT NUMBER patterns (handles cases like "BUSM 360W")
  const explicitCoursePattern = /\b([A-Z]{2,4})\s+(\d{3}[A-Z]?)\b/g
  const explicitMatches = combinedText.matchAll(explicitCoursePattern)
  
  for (const match of explicitMatches) {
    const dept = match[1]
    const number = match[2]
    
    // Only add if it's a valid subject
    if (SUBJECTS.includes(dept)) {
      const courseKey = `${dept} ${number}`
      
      if (!seenCourses.has(courseKey)) {
        seenCourses.add(courseKey)
        
        // Determine grade: explicit course grade > group grade > none
        let minGrade: string | undefined
        if (courseGrades.has(courseKey)) {
          minGrade = courseGrades.get(courseKey)
        } else if (groupGrade) {
          // Only apply group grade if this course appears in a context where group grade makes sense
          // Check if this course appears before the group grade statement
          const courseIndex = combinedText.indexOf(courseKey)
          const groupGradeIndex = combinedText.search(/(?:all|each)\s+with\s+(?:a\s+)?minimum\s+grade\s+of\s+[A-Z][+-]?/i)
          if (groupGradeIndex > -1 && courseIndex < groupGradeIndex) {
            minGrade = groupGrade
          }
        }
        
        courses.push({
          type: 'course',
          department: dept,
          number: number,
          ...(minGrade && { minGrade })
        })
      }
    }
  }

  // Second pass: Process text sentence by sentence to track current subject for standalone numbers
  const sentences = combinedText.split(/[.!?]+/)
  
  for (const sentence of sentences) {
    if (!sentence.trim()) continue
    
    let currentSubject: string | null = null
    
    // Look for subject mentions in this sentence
    for (const subject of SUBJECTS) {
      const subjectRegex = new RegExp(`\\b${subject}\\b`, 'i')
      if (subjectRegex.test(sentence)) {
        currentSubject = subject
        break // Use the first subject found in the sentence
      }
    }
    
    // If we found a subject in this sentence, look for standalone course numbers
    if (currentSubject) {
      // Look for patterns like "100", "101,", "200W", etc.
      // This should match numbers that are NOT already captured by the explicit pattern
      const standaloneNumberPattern = /\b(\d{3}[A-Z]?)(?=[,\s;.]|$)/g
      const numberMatches = sentence.matchAll(standaloneNumberPattern)
      
      for (const match of numberMatches) {
        const number = match[1]
        const courseKey = `${currentSubject} ${number}`
        
        // Check if we already found this course in the explicit pattern pass
        if (!seenCourses.has(courseKey)) {
          // Double-check this isn't part of an explicit "DEPT NUMBER" pattern
          const beforeMatch = sentence.substring(0, match.index)
          const hasSubjectBefore = new RegExp(`\\b([A-Z]{2,4})\\s*$`).test(beforeMatch)
          
          if (!hasSubjectBefore) {
            seenCourses.add(courseKey)
            
            // Apply grade logic for standalone numbers too
            let minGrade: string | undefined
            if (courseGrades.has(courseKey)) {
              minGrade = courseGrades.get(courseKey)
            } else if (groupGrade) {
              // For standalone numbers, be more conservative about applying group grades
              // Only apply if the group grade appears in the same sentence or shortly after
              const sentenceIndex = combinedText.indexOf(sentence)
              const groupGradeIndex = combinedText.search(/(?:all|each)\s+with\s+(?:a\s+)?minimum\s+grade\s+of\s+[A-Z][+-]?/i)
              if (groupGradeIndex > -1 && groupGradeIndex >= sentenceIndex && groupGradeIndex < sentenceIndex + sentence.length + 100) {
                minGrade = groupGrade
              }
            }
            
            courses.push({
              type: 'course',
              department: currentSubject,
              number: number,
              ...(minGrade && { minGrade })
            })
          }
        }
      }
    }
  }

  // Check for hardcoded high school courses
  const hsCoursePatterns = [
    {
      pattern: /\bBC Math 12\b/gi,
      course: 'BC Math 12'
    },
    // Add more patterns here as needed
    // {
    //   pattern: /\bBC English 12\b/gi,
    //   course: 'BC English 12'
    // },
  ]

  for (const { pattern, course } of hsCoursePatterns) {
    if (pattern.test(combinedText)) {
      hsCourses.push({
        type: 'HSCourse',
        course: course,
        // Could try to extract grade requirements
      })
    }
  }

  // Check for credit count requirements (e.g., "60 units", "30 credit hours")
  const seenCredits = new Set<number>()
  const creditCountPatterns = [
    /\b(\d+)\s+credit\s*hours?\b/gi,  // Match "credit hours" first to avoid conflicts
    /\b(\d+)\s+units?\b/gi,
    /\b(\d+)\s+credits?\b/gi
  ]

  for (const pattern of creditCountPatterns) {
    const matches = combinedText.matchAll(pattern)
    for (const match of matches) {
      const credits = parseInt(match[1])
      if (credits > 0 && !seenCredits.has(credits)) {
        seenCredits.add(credits)
        creditCounts.push({
          type: 'creditCount',
          credits: credits,
        })
      }
    }
  }

  // Check for specific permission requirements
  const permissionChecks = [
    // Primary patterns - match exact phrasing and normalize to standard format
    {
      pattern: /\bpermission\s+of\s+the\s+instructor\.?/gi,
      note: 'Permission of the instructor.'
    },
    {
      pattern: /\bpermission\s+of\s+(?:the\s+)?department\.?/gi,
      note: 'Permission of the department.'
    },
    {
      pattern: /\bdepartmental\s+permission\b/gi,
      note: 'Permission of the department.'
    },
    {
      pattern: /\bpermission\s+of\s+instructor\b/gi,
      note: 'Permission of the instructor.'
    },
    {
      pattern: /\binstructor\s+permission\b/gi,
      note: 'Permission of the instructor.'
    },
  ]

  const addedPermissions = new Set<string>()
  
  for (const { pattern, note } of permissionChecks) {
    if (pattern.test(combinedText) && !addedPermissions.has(note)) {
      permissions.push({
        type: 'permission',
        note: note,
      })
      addedPermissions.add(note)
    }
  }

  return {
    courses,
    hsCourses,
    creditCounts,
    permissions
  }
}

/**
 * Generates a unique ID for React Flow nodes
 */
let nodeIdCounter = 0
export function generateNodeId(prefix = 'node'): string {
  return `${prefix}_${++nodeIdCounter}`
}

/**
 * Gets display name for a requirement node type
 */
export function getRequirementTypeDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    'group': 'Group',
    'course': 'University Course', 
    'HSCourse': 'High School Course',
    'program': 'Program Requirement',
    'CGPA': 'Cumulative GPA',
    'UDGPA': 'Upper Division GPA', 
    'creditCount': 'Credit Count',
    'courseCount': 'Course Count',
    'permission': 'Permission Required',
    'other': 'Other Requirement'
  }
  
  return displayNames[type] || type
}

/**
 * Gets color for group logic types
 */
export function getGroupLogicColor(logic: 'ALL_OF' | 'ONE_OF' | 'TWO_OF'): string {
  const colors = {
    'ALL_OF': '#10B981', // green
    'ONE_OF': '#F59E0B', // amber
    'TWO_OF': '#8B5CF6'  // purple
  }
  
  return colors[logic] || '#6B7280' // default gray
}