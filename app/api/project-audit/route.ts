import { NextResponse } from 'next/server';
export const revalidate = 0;
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { role, projects, userId, driveRegId } = await req.json();

        if (!projects || projects.length === 0) {
            return NextResponse.json({ success: true, auditPassed: false, reason: "No projects found" });
        }

        const prompt = `
      You are an strict Technical Recruiter.
      The candidate is applying for the role of: "${role}".
      Their listed projects are:
      ${JSON.stringify(projects, null, 2)}

      Evaluate if these projects demonstrate at least a 30% match (baseline technical capability) for the target role.
      If the projects are completely irrelevant, too simplistic, or empty, return passed: false.
      Otherwise, return passed: true.

      Return ONLY a JSON object with this exact structure:
      {
         "passed": boolean,
         "reason": "Short 1-sentence explanation"
      }
      `;

        const aiResponse = await callAI(prompt);
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

        let auditData = { passed: true, reason: "" };
        if (jsonMatch) {
            try {
                auditData = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Failed to parse audit AI response", jsonMatch[0]);
            }
        }

        if (!auditData.passed && userId) {
            // Also need to get drive_id from driveRegId to record it cleanly in interviews
            // Let's assume the frontend passes driveId directly or we fetch it here.
            // But doing a Supabase insert requires server client. Next.js App router API routes use @supabase/auth-helpers-nextjs or supabase-js.
            // I'll return the result and let the frontend do the DB update or I can do it if I import the client.
        }

        return NextResponse.json({ success: true, auditPassed: auditData.passed, reason: auditData.reason });
    } catch (error: any) {
        console.error('Project Audit API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to evaluate projects.' }, { status: 500 });
    }
}
