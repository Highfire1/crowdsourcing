import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { SearchAndFilter } from "./search-and-filter";
import { NavHeader } from "@/components/nav-header";

interface Course {
    dept: string;
    number: string;
    title: string;
    description: string;
    prerequisites: string;
    corequisites: string;
    notes: string;
    parse_status: 'ai_parsed' | 'ai_parsed_failed' | 'human_parsed_once_success' | 'human_parsed_unclear' | 'human_parsed_twice_success' | null;
}

interface CoursesPageProps {
    searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

const COURSES_PER_PAGE = 100;

function getStatusBadgeVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "ai_parsed":
        case "human_parsed_once_success":
        case "human_parsed_twice_success":
            return "default";
        case "ai_parsed_failed":
            return "destructive";
        case "human_parsed_unclear":
            return "secondary";
        default:
            return "outline";
    }
}

function getStatusLabel(status: string | null): string {
    switch (status) {
        case "ai_parsed":
            return "AI Parsed";
        case "ai_parsed_failed":
            return "AI Parse Failed";
        case "human_parsed_once_success":
            return "Human Parsed (Once)";
        case "human_parsed_unclear":
            return "Human Parsed (Unclear)";
        case "human_parsed_twice_success":
            return "Human Parsed (Twice)";
        case "no_parse_needed":
            return "No Parse Needed";
        case null:
            return "Not Parsed";
        default:
            return "Unknown Status";
    }
}

function truncateText(text: string | null, maxLength: number = 150): string {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function buildPageUrl(page: number, searchTerm?: string, statusFilter?: string): string {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter) params.set('status', statusFilter);
    const queryString = params.toString();
    return `/courses${queryString ? `?${queryString}` : ''}`;
}

async function getCourses(page: number = 1, search?: string, status?: string) {
    const supabase = await createClient();
    const offset = (page - 1) * COURSES_PER_PAGE;

    // Build the query
    let query = supabase
        .from('courses_sfu')
        .select('dept, number, title, description, prerequisites, corequisites, notes, parse_status');

    let countQuery = supabase
        .from('courses_sfu')
        .select('*', { count: 'exact', head: true });

    // Add search filter
    if (search) {
        const searchFilter = `dept.ilike.%${search}%,number.ilike.%${search}%,title.ilike.%${search}%`;
        query = query.or(searchFilter);
        countQuery = countQuery.or(searchFilter);
    }

    // Add status filter
    if (status) {
        if (status === 'null') {
            query = query.is('parse_status', null);
            countQuery = countQuery.is('parse_status', null);
        } else {
            query = query.eq('parse_status', status);
            countQuery = countQuery.eq('parse_status', status);
        }
    }

    // Apply ordering and pagination
    query = query
        .order('dept', { ascending: true })
        .order('number', { ascending: true })
        .range(offset, offset + COURSES_PER_PAGE - 1);

    const [coursesResult, countResult] = await Promise.all([
        query,
        countQuery
    ]);

    if (coursesResult.error) {
        console.error('Error fetching courses:', coursesResult.error);
        throw new Error('Failed to fetch courses');
    }

    const totalCount = countResult.count || 0;
    const totalPages = Math.ceil(totalCount / COURSES_PER_PAGE);

    return {
        courses: coursesResult.data as Course[],
        totalCount,
        totalPages,
        currentPage: page
    };
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
    const resolvedSearchParams = await searchParams;
    const currentPage = parseInt(resolvedSearchParams.page || '1', 10);
    const searchTerm = resolvedSearchParams.search;
    const statusFilter = resolvedSearchParams.status;

    try {
        const { courses, totalCount, totalPages } = await getCourses(currentPage, searchTerm, statusFilter);

        return (
            <main className="min-h-screen flex flex-col items-center">
                <div className="flex-1 w-full flex flex-col gap-20 items-center">
                    <NavHeader />
                    <div className="container mx-auto px-4 py-8 max-w-6xl">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <BookOpen className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold">SFU Courses</h1>
                            </div>
                            
                        </div>

                        {/* Search and Filter */}
                        <div className="">
                            <SearchAndFilter />
                        </div>

                        <p className="text-muted-foreground mb-6 ml-6">
                                {totalCount.toLocaleString()} courses found.
                            </p>

                        {/* Courses Grid */}
                        <div className="grid gap-4 mb-8">
                            {courses.map((course) => (
                                <Link
                                    key={`${course.dept}-${course.number}`}
                                    href={`/courses/${course.dept}/${course.number}`}
                                    className="block"
                                >
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl">
                                                        <Badge variant="secondary" className="mr-2 font-mono">
                                                            {course.dept} {course.number}
                                                        </Badge>
                                                        {course.title && (
                                                            <span className="ml-1">{course.title}</span>
                                                        )}
                                                    </CardTitle>
                                                    <CardDescription className="mt-2">
                                                        {truncateText(course.description, 200)}
                                                    </CardDescription>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <Badge variant={getStatusBadgeVariant(course.parse_status)} className="text-xs">
                                                        {getStatusLabel(course.parse_status)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        {(course.prerequisites || course.corequisites || course.notes) && (
                                            <CardContent className="pt-0">
                                                <div className="space-y-3">
                                                    {course.prerequisites && (
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-muted-foreground mb-1">Prerequisites</h4>
                                                            <p className="text-sm">{truncateText(course.prerequisites, 150)}</p>
                                                        </div>
                                                    )}

                                                    {course.corequisites && (
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-muted-foreground mb-1">Corequisites</h4>
                                                            <p className="text-sm">{truncateText(course.corequisites, 150)}</p>
                                                        </div>
                                                    )}

                                                    {course.notes && (
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-muted-foreground mb-1">Notes</h4>
                                                            <p className="text-sm">{truncateText(course.notes, 100)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * COURSES_PER_PAGE) + 1} to{' '}
                                    {Math.min(currentPage * COURSES_PER_PAGE, totalCount)} of{' '}
                                    {totalCount.toLocaleString()} courses
                                </div>

                                <div className="flex items-center gap-2">
                                    {currentPage > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={buildPageUrl(currentPage - 1, searchTerm, statusFilter)}>
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </Link>
                                        </Button>
                                    )}

                                    <div className="flex items-center gap-1">
                                        {/* Show page numbers around current page */}
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    asChild
                                                    variant={pageNum === currentPage ? "default" : "outline"}
                                                    size="sm"
                                                >
                                                    <Link href={buildPageUrl(pageNum, searchTerm, statusFilter)}>
                                                        {pageNum}
                                                    </Link>
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    {currentPage < totalPages && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={buildPageUrl(currentPage + 1, searchTerm, statusFilter)}>
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {courses.length === 0 && (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm || statusFilter
                                        ? "Try adjusting your search or filter criteria."
                                        : "There are no courses available at the moment."
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        );
    } catch {
        return (
            <main className="min-h-screen flex flex-col items-center">
                <div className="flex-1 w-full flex flex-col gap-20 items-center">
                    <NavHeader />
                    <div className="container mx-auto px-4 py-8 max-w-6xl">
                        <div className="text-center py-12">
                            <h1 className="text-2xl font-bold mb-4">Error Loading Courses</h1>
                            <p className="text-muted-foreground mb-4">
                                We encountered an error while loading the courses. Please try again later.
                            </p>
                            <Button asChild>
                                <Link href="/">Go Home</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }
}
