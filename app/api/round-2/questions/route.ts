import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { jobData } = await req.json();

    const role = jobData?.role || "Software Engineer";
    const domain = jobData?.domain || "Information Technology";
    const experience = jobData?.experience || "Fresher";

    const prompt = `
      You are an expert ${role} Interviewer. Generate exactly 10 professional technical questions for a candidate applying for the following role:
      
      Role: ${role}
      Domain: ${domain}
      Level: ${experience}

      ADAPTATION INSTRUCTIONS:
      - If the role is in Tech/Engineering: Focus on core technologies (React, Python, SQL), architecture, and performance.
      - If the role is in Marketing: Focus on SEO, SEM, content strategy, conversion funnel, and market analytics.
      - If the role is in Finance: Focus on valuation models, risk management, regulatory compliance, and financial reporting.
      - For any other role: Focus on the specific core competencies and industry standards for that domain.

      Goal: High technical/professional depth for the "${role}" role.

      STRUCTURE:
      - Questions 1-8: Multiple Choice Questions (MCQ) - strictly technical/fact-based.
      - Questions 9-10: Short Answer Questions - asking for a brief explanation or approach.

      Return ONLY a valid JSON object with a single key "questions" containing the array:
      {
        "questions": [
          {
            "id": 1,
            "type": "mcq",
            "question": "string",
            "options": ["option A", "option B", "option C", "option D"],
            "correctAnswer": 0,
            "explanation": "string",
            "topic": "string"
          },
          {
            "id": 9,
            "type": "short_answer",
            "question": "string",
            "topic": "string",
            "explanation": "Key points expected in the answer"
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
      console.error('Round 2: Failed to parse AI response', questionsJSON);
      return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Round 2 Questions API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate technical questions' }, { status: 500 });
  }
}
