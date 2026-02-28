import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { jobData, resumeData } = await req.json();

    const role = jobData?.role || "Professional";

    const prompt = `
      You are a Soft Skills and Communication Expert. Generate exactly 5 Written Assessment tasks for a candidate applying for:
      
      Role: ${role}
      
      The tasks should include:
      1. Writing a professional email (e.g. to a client, manager, or stakeholder).
      2. Handling a workplace conflict / situational challenge (written response).
      3. Explaining a complex industry concept to a non-expert stakeholder.
      4. A project summary, campaign report, or status update relevant to the ${role} role.
      5. A professional self-introduction (elevator pitch) tailored to the "${role}" role.

      Return ONLY a valid JSON object with a single key "questions" containing the array:
      {
        "questions": [
          {
            "id": 1,
            "title": "string",
            "scenario": "string",
            "instruction": "string",
            "category": "Communication"
          }
        ]
      }
    `;

    const questionsJSON = await callAI(prompt);

    let parsed;
    try {
      const cleaned = questionsJSON.replace(/```json|```/g, '').trim();
      const rawParsed = JSON.parse(cleaned);
      // Extract array from wrapper object (Groq JSON mode returns objects, not arrays)
      parsed = rawParsed.questions || rawParsed.data || rawParsed;
      if (!Array.isArray(parsed)) throw new Error("Not an array");
    } catch (parseErr) {
      console.error('Round 5: Failed to parse AI response', questionsJSON);
      return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Round 5 Questions API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate written tasks' }, { status: 500 });
  }
}
