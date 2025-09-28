'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ParsingStats {
  total: number
  noPrerequisites: number
  verified: number
  parsedOnce: number
  notYetParsed: number
  ambiguous: number
}

export function ParsingDashboard() {
  const [stats, setStats] = useState<ParsingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use public stats endpoint that doesn't require authentication
        // This allows everyone to see the dashboard progress
        const response = await fetch('/api/public-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch parsing stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Course Parsing Dashboard</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Course Parsing Dashboard</CardTitle>
          <CardDescription>Failed to load statistics</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const completionPercentage = Math.round((((stats.noPrerequisites || 0) + stats.verified) / stats.total) * 100)
  const noPrerequisitesPercentage = Math.round(((stats.noPrerequisites || 0) / stats.total) * 100)
  const verifiedPercentage = Math.round((stats.verified / stats.total) * 100)
  const parsedOncePercentage = Math.round((stats.parsedOnce / stats.total) * 100)
  const notYetParsedPercentage = Math.round((stats.notYetParsed / stats.total) * 100)
  const ambiguousPercentage = Math.round((stats.ambiguous / stats.total) * 100)

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card>
        {/* <CardHeader>
          <CardTitle className="text-2xl">Course Parsing Dashboard</CardTitle>
          <CardDescription>
            Track the progress of parsing course prerequisites across all SFU courses. 
            Our goal is to convert unstructured prerequisite text into structured data 
            that can be used for degree planning and course recommendations.
          </CardDescription>
        </CardHeader> */}
        <CardContent className="space-y-6 pt-6">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {completionPercentage}% Complete
              </Badge>
            </div>
            
            {/* Stacked Progress Bar */}
            <div className="relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-500"
                style={{ width: `${noPrerequisitesPercentage}%` }}
                title={`${stats.noPrerequisites || 0} courses have no prerequisites`}
              />
              <div
                className="absolute top-0 h-full bg-green-500 transition-all duration-500"
                style={{ 
                  left: `${noPrerequisitesPercentage}%`,
                  width: `${verifiedPercentage}%` 
                }}
                title={`${stats.verified} courses verified by humans`}
              />
              <div
                className="absolute top-0 h-full bg-blue-500 transition-all duration-500"
                style={{ 
                  left: `${noPrerequisitesPercentage + verifiedPercentage}%`,
                  width: `${parsedOncePercentage}%` 
                }}
                title={`${stats.parsedOnce} courses parsed once`}
              />
              <div
                className="absolute top-0 h-full transition-all duration-500"
                style={{ 
                  left: `${noPrerequisitesPercentage + verifiedPercentage + parsedOncePercentage}%`,
                  width: `${notYetParsedPercentage}%` 
                }}
                title={`${stats.notYetParsed} courses not yet parsed`}
              />
              <div
                className="absolute top-0 h-full bg-red-500 transition-all duration-500"
                style={{ 
                  left: `${noPrerequisitesPercentage + verifiedPercentage + parsedOncePercentage + notYetParsedPercentage}%`,
                  width: `${ambiguousPercentage}%` 
                }}
                title={`${stats.ambiguous} courses are ambiguous`}
              />
            </div>
            
            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              {(stats.noPrerequisites || 0) + stats.verified} of {stats.total} courses completed
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.noPrerequisites || 0}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                No Prerequisites
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                {noPrerequisitesPercentage}%
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.verified}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Verified
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {verifiedPercentage}%
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.parsedOnce}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Parsed Once
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {parsedOncePercentage}%
              </div>
            </div>

            <div className="text-center p-4  dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {stats.notYetParsed}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Not Yet Parsed
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {notYetParsedPercentage}%
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.ambiguous}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Ambiguous
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                {ambiguousPercentage}%
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Project Goals</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Convert unstructured prerequisite text into structured JSON data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Enable automated degree planning and course recommendation systems</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Improve accessibility of course requirement information for students</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Create a comprehensive database of course relationships and dependencies</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}