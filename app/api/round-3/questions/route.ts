import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { jobData, resumeData } = await req.json();

    const role = jobData?.role || "Software Engineer";
    const resumeSummary = resumeData
      ? JSON.stringify(resumeData).substring(0, 3000) // limit to avoid oversized prompt
      : "No resume data available — generate general behavioural/experience questions";

    const prompt = `
      You are a Senior Interviewer. Generate exactly 10 Deep-Dive MCQ questions based on the candidate's actual projects, experience, and skills.
      
      Target Role: ${role}
      
      Resume Data (JSON):
      ${resumeSummary}

      Instructions:
      1. Pick specific projects, roles, or achievements mentioned in the resume. If no resume data, ask general experience questions.
      2. Ask deep-dive questions about how they executed those projects or handled responsibilities.
      3. Focus on industry-specific technicalities relevant to the role.
      4. The questions must feel personalized and probe actual contribution.
      5. Move beyond generic theory — validate THEIR actual experience.

      Return ONLY a valid JSON object with a single key "questions" containing the array:
      {
        "questions": [
          {
            "id": 1,
            "question": "string",
            "options": ["option A", "option B", "option C", "option D"],
            "correctAnswer": 0,
            "explanation": "string",
            "context": "Project Name or Experience Area"
          }
        ]
      }
    `;

    const questionsJSON = await callAI(prompt);

    let parsed;
    try {
      const cleaned = questionsJSON.replace(/```json|```/g, '').trim();
      const rawParsed = JSON.parse(cleaned);
      parsed = rawParsed.questions || rawParsed.data || rawParsed;
      if (!Array.isArray(parsed)) throw new Error("Not an array");
    } catch (parseErr) {
      console.error('Round 3: Failed to parse AI response', questionsJSON);
      return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Round 3 Questions API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate resume-based questions' }, { status: 500 });
  }
}
