import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { answers, questions, resumeData } = await req.json();

        let correctCount = 0;
        const details = questions.map((q: any) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === parseInt(q.correctAnswer);
            if (isCorrect) correctCount++;
            return {
                id: q.id,
                isCorrect,
                userChoice: userAnswer,
                correctChoice: parseInt(q.correctAnswer)
            };
        });

        const score = (correctCount / questions.length) * 100;
        const passed = score >= 70; // Harder benchmark for resume round

        const prompt = `
      Evaluate the candidate's honesty and depth regarding their own resume.
      Correct: ${correctCount} / ${questions.length}
      Score: ${score}%

      Summary Feedback:
      Did they demonstrate deep knowledge of the projects they listed? 
      Return ONLY a JSON object: { "summary": "string" }
    `;

        const evaluationJSON = await callAI(prompt);
        const evaluation = JSON.parse(evaluationJSON);

        return NextResponse.json({
            success: true,
            data: {
                score,
                passed,
                summary: evaluation.summary,
                details
            }
        });
    } catch (error: any) {
        console.error('Round 3 Evaluation API Error:', error);
        return NextResponse.json({ success: false, error: 'Resume evaluation failed' }, { status: 500 });
    }
}
