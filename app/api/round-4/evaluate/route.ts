import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { code, question, jobData } = await req.json();

        const prompt = `
      Analyze the following candidate's code submission for the coding problem: "${question.title}".
      
      Problem Statement: ${question.problemStatement}
      
      Candidate's Code:
      ${code}

      You are an automated code reviewer. Grade the code based on:
      1. Logic Correctness (Does it solve the problem?).
      2. Time & Space Complexity (Is it optimal?).
      3. Edge Cases (Does it handle nulls, empty inputs, etc.?).
      4. Code Quality (Readability, Naming).

      Return a score (0-100) and a verdict (PASSED if score >= 60, otherwise FAILED).
      Also provide 3 specific points of feedback.

      Return ONLY a JSON object:
      {
        "score": 0,
        "passed": boolean,
        "feedback": ["string"],
        "analysis": "string",
        "complexity": { "time": "string", "space": "string" }
      }
    `;

        const evaluationJSON = await callAI(prompt);
        const evaluation = JSON.parse(evaluationJSON);

        return NextResponse.json({
            success: true,
            data: evaluation
        });
    } catch (error: any) {
        console.error('Round 4 Evaluation API Error:', error);
        return NextResponse.json({ success: false, error: 'Coding evaluation failed' }, { status: 500 });
    }
}
