import { NavHeader } from '@/components/nav-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CourseNotFound() {
  return (
    <div className="min-h-screen ">
      <NavHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Course Not Found</CardTitle>
            <CardDescription>
              The course you are looking for could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This course may not exist in our database or the URL might be incorrect.
              </p>
              <Link href="/courses">
                <Button className="w-full">
                  Back to Courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}