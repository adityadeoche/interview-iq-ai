import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callAI } from "@/lib/ai";

export async function POST(req: Request) {
    try {
        const { interviewId } = await req.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch the interview transcript
        const { data: interview, error } = await supabase
            .from("interviews")
            .select("*")
            .eq("id", interviewId)
            .eq("user_id", user.id)
            .single();

        if (error || !interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // RESULTS MASKING GATE
        // If it's linked to a drive/job, check if the TPO/HR has published results.
        if (interview.drive_id || interview.job_id) {
            let resultsPublished = false;

            if (interview.drive_id) {
                const { data: drive } = await supabase
                    .from("placement_drives")
                    .select("results_published")
                    .eq("id", interview.drive_id)
                    .single();
                resultsPublished = drive?.results_published || false;
            } else if (interview.job_id) {
                const { data: job } = await supabase
                    .from("jobs")
                    .select("results_published")
                    .eq("id", interview.job_id)
                    .single();
                resultsPublished = job?.results_published || false;
            }

            if (!resultsPublished) {
                return NextResponse.json({
                    success: false,
                    error: "Results are currently Under Review. Please wait for the official broadcast from your TPO/HR."
                }, { status: 403 });
            }
        }

        // Determine if it's a multi-round drive interview or a practice interview
        let transcriptText = "";
        let analysis: any = null;

        if (typeof interview.transcript === 'string') {
            try {
                // Multi-round breakdown (JSON string)
                const scores = JSON.parse(interview.transcript);
                analysis = {
                    overallScore: interview.avg_score,
                    technicalScore: scores.round2 || scores.round4 || interview.avg_score,
                    communicationScore: scores.round5 || interview.avg_score,
                    confidenceScore: scores.round3 || 75,
                    strengths: [
                        `Completed all 5 rounds with an overall score of ${interview.avg_score}%`,
                        `Aptitude: ${scores.round1}%`,
                        `Technical: ${scores.round2}%`
                    ],
                    improvements: [
                        "Focus on deepening domain-specific knowledge",
                        "Improve response time in live coding rounds",
                        "Refine communication for HR rounds"
                    ],
                    resources: [
                        { title: "GeeksForGeeks Interview Prep", url: "https://www.geeksforgeeks.org/interview-preparation-for-software-development/" },
                        { title: "LeetCode Patterns", url: "https://leetcode.com/" },
                        { title: "Behavioral Interview Guide", url: "https://www.themuse.com/advice/star-interview-method" }
                    ],
                    summary: `Automated Multi-Round Assessment: Candidate successfully cleared the campus drive pipeline with a ${interview.avg_score}% match score.`
                };
            } catch (e) {
                transcriptText = interview.transcript;
            }
        } else if (Array.isArray(interview.transcript)) {
            // Practice Chat-based interview
            transcriptText = interview.transcript
                .map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
                .join('\n');
        }

        if (!analysis) {
            const prompt = `
You are an expert career coach analyzing a mock interview transcript for the role: "${interview.role}".

TRANSCRIPT:
${transcriptText}

Analyze deeply and return ONLY a valid JSON object with this exact structure:
{
  "overallScore": 0,
  "technicalScore": 0,
  "communicationScore": 0,
  "confidenceScore": 0,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "resources": [
    { "title": "Specific study topic based on gaps", "url": "https://..." },
    { "title": "Specific study topic based on gaps", "url": "https://..." },
    { "title": "Specific study topic based on gaps", "url": "https://..." }
  ],
  "summary": "1-2 sentence overall verdict"
}

Scoring rules:
- overallScore: weighted average (technical 40%, communication 30%, confidence 30%), out of 100
- technicalScore (Technical Accuracy): accuracy and depth of technical answers for "${interview.role}", out of 100
- communicationScore (Clarity of Speech): clarity, coherence, and structure of responses, out of 100
- confidenceScore (Confidence): based on language certainty, specificity, and authority, out of 100
- resources: provide REAL, useful URLs (GeeksForGeeks, MDN, Investopedia, etc.) specific to the gaps found
        `.trim();

            const responseText = await callAI(prompt);
            analysis = JSON.parse(responseText);
        }

        return NextResponse.json({ success: true, data: { ...analysis, role: interview.role, createdAt: interview.created_at } });

    } catch (error: any) {
        console.error("Results API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
