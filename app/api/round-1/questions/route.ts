import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { jobData } = await req.json();

    // Use safe fallbacks so the prompt is always valid even if setup was skipped
    const role = jobData?.role || "Software Engineer";
    const domain = jobData?.domain || "Information Technology";
    const pattern = jobData?.pattern || "Generic IT Aptitude";
    const experience = jobData?.experience || "Fresher";

    const prompt = `
      You are an expert recruitment examiner. Generate exactly 10 Aptitude MCQ questions for a candidate applying for the following role:
      
      Role: ${role}
      Domain: ${domain}
      Pattern: ${pattern} (e.g. TCS NQT, generic IT, etc.)
      Difficulty: ${experience}

      The questions should cover a professional aptitude test:
      - Logical Reasoning
      - Numerical/Quantitative Ability
      - Verbal Ability (English Proficiency)
      - Data Interpretation relative to the ${role} domain

      Return ONLY a valid JSON object with a single key "questions" containing an array of 10 objects:
      {
        "questions": [
          {
            "id": 1,
            "question": "string",
            "options": ["option A", "option B", "option C", "option D"],
            "correctAnswer": 0,
            "explanation": "string",
            "category": "Logical Reasoning"
          }
        ]
      }
    `;

    const questionsJSON = await callAI(prompt);

    // Safely parse AI response
    let parsed;
    try {
      const cleaned = questionsJSON.replace(/```json|```/g, '').trim();
      const rawParsed = JSON.parse(cleaned);
      // Extract the array from the wrapper object (Groq JSON mode returns objects, not arrays)
      parsed = rawParsed.questions || rawParsed.data || rawParsed;
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed result is not an array");
      }
    } catch (parseErr) {
      console.error('Round 1: Failed to parse AI response as JSON', questionsJSON);
      return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Round 1 Questions API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate questions' }, { status: 500 });
  }
}
