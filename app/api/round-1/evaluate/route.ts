import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { answers, questions, jobData } = await req.json();

        // answers: { [questionId: number]: number } - maps index to chosen option index

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
        const passed = score >= 50; // 50% benchmark — at least half correct to pass

        const prompt = `
      Evaluate the candidate's performance in a ${jobData.pattern} style Aptitude Round.
      Total Questions: ${questions.length}
      Correct: ${correctCount}
      Score: ${score}%
      Verdict: ${passed ? 'PASSED' : 'FAILED'}

      Return a short summary (1-2 sentences) of their aptitude level and what they should focus on.
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
        console.error('Round 1 Evaluation API Error:', error);
        return NextResponse.json({ success: false, error: 'Evaluation failed' }, { status: 500 });
    }
}
