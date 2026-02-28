import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { jobData, resumeData } = await req.json();

    if (!jobData) {
      return NextResponse.json({ success: false, error: 'Missing target job data' }, { status: 400 });
    }

    const prompt = `
            You are an expert ${jobData.role} Interviewer. Generate exactly ONE professional problem or challenge for a candidate applying for this role.

            INDUSTRY ADAPTATION:
            - If the role is in Tech/Engineering: Generate a "Coding Problem" with a problem statement, constraints, and boilerplate function.
            - If the role is in Marketing: Generate a "Go-to-Market Strategy" or "Campaign Analysis" case study.
            - If the role is in Finance: Generate a "Financial Audit" or "Investment Thesis" scenario.
            - If the role is in HR: Generate a "Conflict Resolution" or "Talent Acquisition Strategy" case study.
            - For any other industry: Provide a relevant professional challenge.

            The problem should:
            1. Be highly practical and relevant to the "${jobData.role}" industry.
            2. For Tech: Include a boilerplate function.
            3. For Non-Tech: Provide a structured case study and ask for a strategic response.

            Return ONLY a valid JSON object in this structure:
            {
                "title": "string",
                "problemStatement": "string",
                "constraints": ["string (e.g. Budget, Time, Tech Stack, or Regulatory limits)"],
                "examples": [
                    { "input": "Scenario context/data...", "output": "Expected approach/target outcome...", "explanation": "Rationale..." }
                ],
                "boilerplate": "string (For tech: code. For others: a structured template or 'Provide your analysis below...')",
                "language": "string (e.g. JavaScript, Python, Strategic Analysis, English/Business)",
                "difficulty": "Easy" | "Medium" | "Hard"
            }
        `;

    const questionJSON = await callAI(prompt);
    return NextResponse.json({ success: true, data: JSON.parse(questionJSON) });
  } catch (error: any) {
    console.error('Round 4 Question API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate coding problem' }, { status: 500 });
  }
}
