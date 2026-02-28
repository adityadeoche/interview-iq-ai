import { NextResponse } from 'next/server';
import { auditProjectMatch } from '@/lib/gatekeeper';

export async function POST(req: Request) {
    try {
        const { projectData, jobDescription } = await req.json();

        if (!projectData) {
            return NextResponse.json({ success: false, error: 'Project data missing' }, { status: 400 });
        }

        const result = await auditProjectMatch(projectData, jobDescription || { role: "Candidate", skills: [] });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Project Audit API Error:', error);
        return NextResponse.json({
            success: false,
            // Default to true on error to avoid false positives blocking user
            data: { isProjectVerified: true, reason: error.message || 'Audit error bypassed' }
        });
    }
}
