/**
 * pdfParser.ts — Node.js-only PDF text extraction using pdf-parse.
 *
 * IMPORTANT: This file must ONLY be used in Node.js API routes (export const runtime = "nodejs").
 * pdf-parse is a CJS module and will crash on Edge runtime.
 */

export async function parsePDF(buffer: Buffer): Promise<string> {
    // Use require() for CJS compatibility — avoids ESM/CJS interop crash
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    const text = data.text || '';

    if (!text || text.trim().length < 50) {
        throw new Error('PDF appears to be empty or image-only. Please use a text-based PDF.');
    }

    // Extract GitHub README content for project analysis
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    const extractedData: string[] = [];

    for (const url of urls) {
        try {
            if (url.includes('github.com')) {
                const cleanUrl = url.replace(/\/$/, '');
                const parts = cleanUrl.split('github.com/')[1]?.split('/');
                if (parts && parts.length >= 2) {
                    const owner = parts[0];
                    const repo = parts[1]?.replace('.git', '');
                    let res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
                    if (!res.ok) {
                        res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
                    }
                    if (res.ok) {
                        const readmeText = await res.text();
                        extractedData.push(`\n--- REPOSITORY DATA: ${repo} ---\n${readmeText.substring(0, 1000)}...\n`);
                    }
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch metadata for ${url}`, e);
        }
    }

    if (extractedData.length > 0) {
        return text + "\n\n=== EXTRACTED PROJECT METADATA (GITHUB READMES) ===\n" + extractedData.join("\n");
    }

    return text;
}
