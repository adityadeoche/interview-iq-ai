import { callAI } from "./ai";

export async function auditProjectMatch(
    projectData: any[],
    jobDescription: { role: string; skills: string[]; minScore?: number }
): Promise<{ isProjectVerified: boolean; reason: string; projectMatchScore: number }> {
    if (!projectData || projectData.length === 0) {
        return { isProjectVerified: false, reason: "No projects found", projectMatchScore: 0 };
    }

    const prompt = `
        You are a strict technical hiring manager. A candidate has applied for the following role:
        Role: ${jobDescription.role}
        Required Skills: ${jobDescription.skills.join(", ")}

        Here are the candidate's projects (which may include fetched GitHub READMEs):
        ${JSON.stringify(projectData, null, 2)}

        Analyze these projects against the job description. Does the technical complexity, relevance, and skill usage satisfy at least 30% of what would be expected for a ${jobDescription.role}?
        
        Return exactly ONE JSON object in this format:
        {
            "isProjectVerified": boolean,
            "projectMatchScore": integer (0 to 100 representing the match percentage of their projects to the role),
            "reason": "A 1-2 sentence explanation of why they passed or failed the 30% threshold."
        }
    `;

    try {
        const responseText = await callAI(prompt);
        // Clean up markdown fences
        const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const result = JSON.parse(cleanJson);

        return {
            isProjectVerified: Boolean(result.isProjectVerified),
            projectMatchScore: Number(result.projectMatchScore) || 0,
            reason: result.reason || "Evaluated by AI",
        };
    } catch (error) {
        console.error("Gatekeeper Audit Error:", error);
        // Default to true on error so we don't accidentally block good candidates due to an AI failure
        return { isProjectVerified: true, projectMatchScore: 100, reason: "Audit failed to run, bypassing to prevent false rejection." };
    }
}
