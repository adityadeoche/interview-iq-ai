import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { answers, questions, allRoundData, jobData, resumeData } = await req.json();

    const role = jobData?.role || "Professional";
    const candidateName = resumeData?.personalInfo?.name || resumeData?.name || "Candidate";

    // Safe score extraction with fallbacks
    const r1Score = allRoundData?.round1?.score ?? 0;
    const r2Score = allRoundData?.round2?.score ?? 0;
    const r3Score = allRoundData?.round3?.score ?? 0;
    const r4Score = allRoundData?.round4?.score ?? 0;

    // 1. Evaluate Round 5 written responses
    const validQuestions = Array.isArray(questions) ? questions : [];
    const taskSummary = validQuestions.map((q: any) => {
      const ans = answers?.[q.id] || "(No response)";
      return `Task: ${q.title || q.question || "Task"}\nResponse: ${ans}`;
    }).join('\n\n');

    const round5Prompt = `
      Evaluate these written assessment responses for a ${role} role candidate.
      
      Tasks and Responses:
      ${taskSummary}

      Grade on clarity, professionalism, and relevance.
      Return ONLY a JSON object: { "score": 75, "feedback": "concise feedback string" }
    `;

    let r5Score = 70;
    let r5Feedback = "Written responses evaluated.";
    try {
      const r5EvalJSON = await callAI(round5Prompt);
      const cleaned = r5EvalJSON.replace(/```json|```/g, '').trim();
      const r5Eval = JSON.parse(cleaned);
      r5Score = r5Eval.score ?? 70;
      r5Feedback = r5Eval.feedback ?? r5Feedback;
    } catch (e) {
      console.error("Round 5 eval parse failed, using default score");
    }

    const overallScore = Math.round((r1Score + r2Score + r3Score + r4Score + r5Score) / 5);

    // 2. Generate Final DNA Report
    const dnaPrompt = `
      Generate a final "Interview DNA Report" for this candidate.
      
      Candidate: ${candidateName}
      Target Role: ${role}
      
      Round Scores:
      - Round 1 (Aptitude): ${r1Score}%
      - Round 2 (Technical): ${r2Score}%
      - Round 3 (Resume Deep-Dive): ${r3Score}%
      - Round 4 (Coding/Challenge): ${r4Score}%
      - Round 5 (Written Communication): ${r5Score}%
      - Overall Score: ${overallScore}%

      Provide a hiring verdict based on the scores:
      - 85+: STRONG HIRE
      - 70-84: HIRE
      - 55-69: BORDERLINE
      - Below 55: NO HIRE

      Return ONLY a valid JSON object:
      {
        "overallScore": ${overallScore},
        "verdict": "HIRE or STRONG HIRE or BORDERLINE or NO HIRE",
        "matrix": {
          "technical": 7,
          "logic": 7,
          "communication": 7,
          "cultural": 7,
          "experience": 7
        },
        "recommendation": "string — specific career advice for this candidate",
        "sellingPoints": ["point 1", "point 2", "point 3"],
        "summary": "string — 2-sentence executive summary of the candidate"
      }
    `;

    let finalReport: any = {
      overallScore,
      verdict: overallScore >= 85 ? "STRONG HIRE" : overallScore >= 70 ? "HIRE" : overallScore >= 55 ? "BORDERLINE" : "NO HIRE",
      matrix: {
        technical: Math.round(r2Score / 10),
        logic: Math.round(r1Score / 10),
        communication: Math.round(r5Score / 10),
        cultural: 7,
        experience: Math.round(r3Score / 10)
      },
      recommendation: `Focus on strengthening areas where scores were lower. Continue practicing ${role}-specific technical challenges.`,
      sellingPoints: [
        `Scored ${r1Score}% in aptitude demonstrating strong logical foundation`,
        `Technical proficiency validated at ${r2Score}% in domain-specific questions`,
        `Communication skills demonstrated through written assessment`
      ],
      summary: `${candidateName} completed all 5 rounds targeting the ${role} role with an overall score of ${overallScore}%.`
    };

    try {
      const finalReportJSON = await callAI(dnaPrompt);
      const cleaned = finalReportJSON.replace(/```json|```/g, '').trim();
      const aiReport = JSON.parse(cleaned);
      finalReport = { ...finalReport, ...aiReport, overallScore };
    } catch (e) {
      console.error("DNA report parse failed, using calculated fallback");
    }

    return NextResponse.json({
      success: true,
      data: {
        round5: { score: r5Score, feedback: r5Feedback },
        roundScores: {
          round1: r1Score,
          round2: r2Score,
          round3: r3Score,
          round4: r4Score,
          round5: r5Score
        },
        finalReport: {
          ...finalReport,
          candidateName,
          role,
          roundScores: {
            round1: r1Score,
            round2: r2Score,
            round3: r3Score,
            round4: r4Score,
            round5: r5Score
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Final Evaluation API Error:', error);
    return NextResponse.json({ success: false, error: 'Final evaluation failed' }, { status: 500 });
  }
}
