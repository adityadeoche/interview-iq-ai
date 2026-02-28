import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { jobData, resumeData } = await req.body ? await req.json() : { jobData: null, resumeData: null };

        if (!jobData || !resumeData) {
            return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
        }

        const prompt = `
      You are an expert HR Analyst. Perform a deep compatibility check between the candidate's resume and their target job role.
      
      Target Role: ${jobData.role} at ${jobData.company || 'a company'}
      Domain: ${jobData.domain}
      Level: ${jobData.experience}
      Pattern: ${jobData.pattern}

      Candidate Resume Data (JSON):
      ${JSON.stringify(resumeData)}

      Analyze the following:
      1. Overall compatibility score (0-100).
      2. Top 3 Strengths for this specific role.
      3. Top 3 Critical Gaps (missing skills or experience).
      4. A "Verdict" statement (e.g. "Highly Compatible", "Needs Preparation", etc.).
      5. Suggested "Focus Areas" for the upcoming interview.

      Return ONLY a valid JSON object in this structure:
      {
        "compatibilityScore": 0,
        "verdict": "string",
        "strengths": ["string"],
        "gaps": ["string"],
        "analysis": "string",
        "focusAreas": ["string"],
        "readinessStatus": "READY" | "RISKY" | "UNPREPARED"
      }
    `;

        const analysisJSON = await callAI(prompt);
        return NextResponse.json({ success: true, data: JSON.parse(analysisJSON) });
    } catch (error: any) {
        console.error('Pre-check API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate analysis' }, { status: 500 });
    }
}
