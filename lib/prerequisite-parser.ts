import { RequirementCourse, RequirementHSCourse } from '@/lib/course_types'

export interface ParsedPrerequisites {
  courses: RequirementCourse[]
  hsCourses: RequirementHSCourse[]
}

/**
 * Parses prerequisite text to extract course codes and high school courses
 */
export function parsePrerequisiteText(text: string): ParsedPrerequisites {
  const courses: RequirementCourse[] = []
  const hsCourses: RequirementHSCourse[] = []

  // Pattern to match university courses: 4 uppercase letters + space + 3 digits
  const coursePattern = /\b([A-Z]{4})\s+(\d{3})\b/g
  const courseMatches = text.matchAll(coursePattern)
  
  const seenCourses = new Set<string>()
  
  for (const match of courseMatches) {
    const dept = match[1]
    const number = match[2]
    const courseKey = `${dept} ${number}`
    
    // Avoid duplicates
    if (!seenCourses.has(courseKey)) {
      seenCourses.add(courseKey)
      courses.push({
        type: 'course',
        department: dept,
        number: number,
        // We could try to extract grade requirements from surrounding text
        // but for now we'll leave them configurable in the UI
      })
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
    if (pattern.test(text)) {
      hsCourses.push({
        type: 'HSCourse',
        course: course,
        // Could try to extract grade requirements
      })
    }
  }

  return {
    courses,
    hsCourses
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