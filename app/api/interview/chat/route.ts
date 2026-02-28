import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { auditProjectMatch } from "@/lib/gatekeeper";

export async function POST(req: Request) {
    try {
        const { role, projects, history, answer, questionCount = 0, avgScore = 5 } = await req.json();

        if (!answer) {
            return NextResponse.json({ error: "No answer provided" }, { status: 400 });
        }

        // Master Nuclear Gatekeeper Check at Round 2 transition
        let deepProbeInstruction = "";
        if (questionCount === 2) {
            const audit = await auditProjectMatch([{ detail: projects }], { role: role, skills: [] });
            if (!audit.isProjectVerified) {
                return NextResponse.json({
                    success: true,
                    data: {
                        feedback: `Gatekeeper halted interview: ${audit.reason}`,
                        nextQuestion: null,
                        isFinished: true,
                        isScreenedOut: true,
                        score: 0,
                        confidence: 0,
                        isProbe: false,
                        auditReason: audit.reason,
                        projectMatchScore: audit.projectMatchScore
                    }
                });
            } else {
                // Gatekeeper Passed - Trigger Deep Probe for Round 3
                deepProbeInstruction = `
CRITICAL DEEP-PROBE REQUIREMENT: The candidate passed the technical screening. For this specific 'nextQuestion', you MUST extract at least 3 specific variables, libraries, or functions explicitly mentioned in the candidate's GitHub/Project data. Force the candidate to explain exactly how they implemented or utilized those 3 specific items in their code architecture.
                `.trim();
            }
        }

        const wordCount = answer.trim().split(/\s+/).length;
        const isWeakAnswer = wordCount < 25 || avgScore < 5;
        const isExpert = avgScore >= 8 && questionCount >= 3;
        const isStruggling = avgScore < 4 && questionCount >= 2;

        const difficultyInstruction = isExpert
            ? "DIFFICULTY: This candidate is performing excellently. Ask ADVANCED/SENIOR-LEVEL questions — edge cases, system design, optimization, and nuanced trade-offs."
            : isStruggling
                ? "DIFFICULTY: This candidate is struggling. Pivot to FOUNDATIONAL concepts — basic definitions, simple examples, entry-level understanding."
                : "DIFFICULTY: Maintain standard mid-level interview difficulty.";

        const probeInstruction = isWeakAnswer
            ? `PROBE REQUIREMENT: The candidate's last answer was too brief or lacked technical depth (word count: ${wordCount}, score: ${avgScore}/10). Your \"nextQuestion\" MUST be a follow-up probe on the SAME topic. Examples: "Can you elaborate on that?", "What specific tools/methods did you use for that?", "Can you walk me through the exact steps?" Set \"isProbe\": true.`
            : `You may ask a new topic question. Set \"isProbe\": false.`;

        const prompt = `
You are an expert senior interviewer conducting a professional mock interview for: "${role}".

CONTEXT:
- Role: ${role}
- Candidate's Projects/Background: ${projects}
- Questions asked so far: ${questionCount}
- Candidate's running average score: ${avgScore}/10

${difficultyInstruction}

${probeInstruction}

${deepProbeInstruction}


INDUSTRY ALIGNMENT: All questions and feedback MUST be specific to "${role}".
- Tech roles: focus on architecture, algorithms, tools, debugging, system design.
- Marketing/Business: focus on metrics, campaigns, strategy, customer psychology.
- Finance: focus on models, regulations, risk, financial logic.
- Mechanical/Civil: focus on design principles, materials, simulations, processes.

CONVERSATION HISTORY:
${history.map((h: any) => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n')}

Candidate's Latest Answer: "${answer}"

TASKS:
1. Evaluate the answer honestly (1-2 sentences). Praise what is correct, identify gaps.
2. Assess the CONFIDENCE level from the candidate's language (hedging words, certainty, specificity). Score 1-10.
3. Based on probe instruction above, generate the next question.
4. If ${questionCount} >= 6 and the interview has good coverage, set isFinished: true.

Return ONLY a valid JSON object:
{
  "feedback": "1-2 sentence evaluation",
  "nextQuestion": "The next interview question",
  "isFinished": false,
  "score": 0,
  "confidence": 0,
  "isProbe": false
}
        `.trim();

        const responseText = await callAI(prompt);
        const data = JSON.parse(responseText);

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("Interview Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
