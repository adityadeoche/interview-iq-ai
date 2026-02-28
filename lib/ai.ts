import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.warn("GROQ_API_KEY is not defined in environment variables");
}

const groq = new Groq({ apiKey: apiKey || "" });

const MODEL = "llama-3.3-70b-versatile";

/**
 * Centralized AI helper using Groq llama-3.3-70b-versatile.
 * Lightning-fast inference for resume screening and interview logic.
 */
export async function callAI(prompt: string, retryCount = 0): Promise<string> {
    const maxRetries = 3;

    const strictPrompt = `${prompt}\n\nReturn ONLY a valid JSON object. Do not include markdown formatting, code blocks, or any extra text.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: strictPrompt,
                },
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 8000,
            response_format: { type: "json_object" }, // Force JSON mode
        });

        const text = chatCompletion.choices[0]?.message?.content || "";
        // Clean up any accidental markdown fencing just in case
        const cleanText = text.replace(/```json|```/g, "").trim();
        return cleanText;

    } catch (error: any) {
        // Handle Groq rate-limit (429) with exponential backoff
        if ((error?.status === 429 || error?.statusCode === 429) && retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1500;
            console.log(`Groq rate limit hit (attempt ${retryCount + 1}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callAI(prompt, retryCount + 1);
        }

        console.error("Groq API Error:", {
            status: error?.status ?? error?.statusCode,
            message: error?.message,
            retryCount,
        });

        if (error?.status === 429 || error?.statusCode === 429) {
            throw new Error("Groq API Rate Limit exceeded. Please wait a moment and try again.");
        }

        throw new Error(`AI Processing failed: ${error?.message || "Unknown error"}`);
    }
}
