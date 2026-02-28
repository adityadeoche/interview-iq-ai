import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export async function POST(req: Request) {
    try {
        const { role, projects } = await req.json();

        if (!role || !projects) {
            return NextResponse.json({ error: "Missing role or projects" }, { status: 400 });
        }

        const prompt = `
            You are an expert recruiter and technical interviewer for the role: ${role}.
            
            PRIMARY INSTRUCTION: 
            Generate the FIRST interview question specifically tailored for the role of "${role}". 
            
            INDUSTRY ADAPTATION:
            - If the role is in Tech (e.g., Software, E&TC, Data Science), ask a deep-dive technical question about their projects (${projects}) or core engineering concepts.
            - If the role is in Marketing, ask about campaign strategy, market analysis, or brand positioning.
            - If the role is in Finance, ask about financial modeling, risk assessment, or accounting principles.
            - For any other role, ask a high-level professional question relevant to that specific industry.

            The question should be academic yet practical, deep-diving into a technical or industry-specific aspect.

            Return ONLY a JSON object with this structure:
            {
                "question": "The industry-specific question text...",
                "context": "Brief context of why you are asking this relative to the ${role} role"
            }
        `;

        const responseText = await callAI(prompt);
        const data = JSON.parse(responseText);

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error: any) {
        console.error("Interview Start API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
