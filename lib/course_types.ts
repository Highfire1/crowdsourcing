

export interface RequirementGroup {
    type: 'group';
    logic: 'ALL_OF' | 'ONE_OF' | 'TWO_OF';
    children: RequirementNode[];
}

export type RequirementNode = RequirementGroup | RequirementProgram | RequirementCGPA | RequirementUDGPA | RequirementCourse | RequirementHSCourse | RequirementCreditCount | RequirementCourseCount | RequirementPermission | RequirementOther;

export interface RequirementProgram {
    type: 'program';
    program: string;
}

export interface RequirementCGPA {
    type: 'CGPA';
    minCGPA: number;
}

export interface RequirementUDGPA {
    type: 'UDGPA';
    minUDGPA: number;
}

export interface RequirementHSCourse {
    type: 'HSCourse';
    course: string;
    minGrade?: string;
    orEquivalent?: 'true';
}

export interface RequirementCourse {
    type: 'course';
    department: string;
    number: string;
    minGrade?: string;
    canBeTakenConcurrently?: 'true';
    orEquivalent?: 'true';
}

export interface RequirementCreditCount {
    type: 'creditCount';
    credits: number;
    department?: string | string[];
    level?: '1XX' | '2XX' | '3XX' | '4XX' | 'LD' | 'UD';
    minGrade?: string;
    canBeTakenConcurrently?: 'true';
}

export interface RequirementCourseCount {
    type: 'courseCount';
    count: number;
    department?: string | string[];
    level?: '1XX' | '2XX' | '3XX' | '4XX' | 'LD' | 'UD';
    minGrade?: string;
    canBeTakenConcurrently?: 'true';
}

export interface RequirementPermission {
    type: 'permission';
    note: string;
}

export interface RequirementOther {
    type: 'other';
    note: string;
}

// Credit Conflict Types
export interface ConflictEquivalentCourse {
    type: 'conflict_course';
    department: string;
    number: string;
    title?: string;
}

export interface ConflictOther {
    type: 'conflict_other';
    note: string;
}

export type CreditConflict = ConflictEquivalentCourse | ConflictOther;

// Verification Types
export type VerificationStatus = 'success';

export interface Verification {
    id: number;
    created_at: string;
    author: string;
    dept: string;
    number: string;
    verification_status: VerificationStatus;
    parse_attempt_id: number;
    parse_attempts?: {
        id: number;
        parsed_prereqs: RequirementNode[];
        parse_notes?: string;
        created_at: string;
        author: string;
    };
}

export interface VerificationRequest {
    dept: string;
    number: string;
    verification_status: VerificationStatus;
    parse_attempt_id: number;
}
