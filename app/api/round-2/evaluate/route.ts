import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { answers, questions, jobData } = await req.json();

        // Separate MCQs and Short Answers
        const mcqs = questions.filter((q: any) => q.type === 'mcq' || !q.type); // Default to mcq if undefined
        const shortAnswers = questions.filter((q: any) => q.type === 'short_answer');

        // 1. Evaluate MCQs locally
        let mcqCorrect = 0;
        const mcqDetails = mcqs.map((q: any) => {
            const userIdx = answers[q.id];
            const isCorrect = userIdx === parseInt(q.correctAnswer);
            if (isCorrect) mcqCorrect++;
            return {
                id: q.id,
                type: 'mcq',
                question: q.question,
                isCorrect,
                userChoice: userIdx,
                correctChoice: parseInt(q.correctAnswer)
            };
        });

        // 2. Prepare Short Answers for AI Evaluation
        const shortAnswerResponses = shortAnswers.map((q: any) => ({
            id: q.id,
            question: q.question,
            userAnswer: answers[q.id] || "No answer provided",
            expectedTopics: q.explanation || "N/A"
        }));

        // 3. AI Evaluation for Short Answers + Final Verdict
        const prompt = `
      You are an expert Technical Interviewer.
      
      ROLE: ${jobData.role}
      DOMAIN: ${jobData.domain}

      PART 1: MCQ PERFORMANCE
      - The candidate answered ${mcqCorrect}/${mcqs.length} MCQs correctly.

      PART 2: SHORT ANSWER EVALUATION
      Please evaluate the following short answer responses.
      For each response, assign a score of 1 (Pass/Good) or 0 (Fail/Weak) based on technical accuracy and relevance.
      
      ${JSON.stringify(shortAnswerResponses, null, 2)}

      CALCULATE FINAL SCORE:
      - MCQ Score: ${mcqCorrect} points
      - Short Answer Score: Sum of your grades (max ${shortAnswers.length})
      - Total Score: (MCQ Score + Short Answer Score) / ${questions.length} * 100

      Return ONLY a valid JSON object:
      {
        "shortAnswerGrades": [
          { "id": number, "score": 0 or 1, "feedback": "Brief comment" }
        ],
        "finalScore": number (0-100),
        "passed": boolean (true if finalScore >= 60),
        "summary": "1-2 sentence professional feedback on their technical depth."
      }
    `;

        const evaluationJSON = await callAI(prompt);
        const evaluation = JSON.parse(evaluationJSON);

        // Merge details
        const finalDetails = [
            ...mcqDetails,
            ...evaluation.shortAnswerGrades.map((g: any) => {
                const q = shortAnswers.find((sq: any) => sq.id === g.id);
                return {
                    id: g.id,
                    type: 'short_answer',
                    question: q?.question,
                    isCorrect: g.score === 1,
                    feedback: g.feedback,
                    userAnswer: answers[g.id]
                };
            })
        ];

        return NextResponse.json({
            success: true,
            data: {
                score: evaluation.finalScore,
                passed: evaluation.passed,
                summary: evaluation.summary,
                details: finalDetails
            }
        });

    } catch (error: any) {
        console.error('Round 2 Evaluation API Error:', error);
        return NextResponse.json({ success: false, error: 'Evaluation failed' }, { status: 500 });
    }
}
