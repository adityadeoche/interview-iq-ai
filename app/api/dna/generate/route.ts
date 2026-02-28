import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callAI } from "@/lib/ai";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user's completed interviews
        const { data: interviews, error: interviewError } = await supabase
            .from("interviews")
            .select("role, transcript, avg_score")
            .eq("user_id", user.id);

        if (interviewError || !interviews || interviews.length === 0) {
            return NextResponse.json({ badges: [] }); // No data yet
        }

        // Flatten roles and some transcript snippets for AI to analyze
        const roles = interviews.map(i => i.role).join(", ");
        const avgScores = interviews.map(i => i.avg_score);
        const totalAvg = avgScores.reduce((a, b) => a + b, 0) / avgScores.length;

        // Construct a prompt for Gemini
        const prompt = `
You are an expert technical evaluator. Analyze the following interview history for a candidate to extract their confirmed "Skill DNA".

CANDIDATE DATA:
- Job Roles Interviewed For: ${roles}
- Total Interviews Taken: ${interviews.length}
- Average Interview Score: ${totalAvg}/10

Based on these roles and their performance, generate 3 to 6 distinct "Skill Badges" that this candidate has demonstrated.
If they interviewed for hardware/IoT roles (e.g., using ESP32, Embedded systems), ensure you generate an 'IoT Architect' or 'Embedded Systems Pro' badge.
If soft skills apply (like 'Problem Solving' or 'Communication'), include them.

Return ONLY a valid JSON array of objects, with no markdown formatting.
Each object must match this schema:
[
  {
    "name": "Badge Name (e.g. IoT Architect, React Specialist)",
    "category": "Technical" | "Soft Skill" | "Tools",
    "description": "A short 1-sentence reason why they earned this."
  }
]
        `.trim();

        const responseText = await callAI(prompt);
        const badges = JSON.parse(responseText);

        return NextResponse.json({ badges });

    } catch (error: any) {
        console.error("DNA Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
