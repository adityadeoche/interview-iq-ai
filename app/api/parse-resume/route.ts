// IMPORTANT: Must run on Node.js runtime, NOT Edge, for pdf-parse to work.
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { createClient } from '@/lib/supabase-server';

/**
 * Uses the CommonJS require() pattern for pdf-parse which is a CJS-only package.
 * This avoids the "module not found" crash that occurs with ESM imports on Next.js.
 */
async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdf = require('pdf-parse');
  const data = await pdf(buffer);
  return data.text || '';
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // ── Manual Entry fallback path ───────────────────────────────────────
    // When no file is sent, the client can send manual grade fields instead.
    const manualName = formData.get('manual_name') as string | null;
    if (!file && manualName) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const manualData = {
        personalInfo: {
          name: manualName,
          email: formData.get('manual_email') as string || '',
          phone: '', location: '', linkedin: null, github: null, portfolio: null
        },
        summary: null,
        skills: { technical: [], soft: [], tools: [], languages: [] },
        experience: [],
        education: [
          {
            degree: formData.get('manual_degree') as string || '',
            institution: '',
            year: '',
            percentage_or_cgpa: formData.get('manual_cgpa') as string || null,
            relevant_coursework: []
          }
        ],
        projects: [],
        certifications: [],
        achievements: [],
        totalYearsExperience: 0,
        primaryTechStack: [],
        detectedIndustry: (formData.get('manual_degree') as string || 'Professional') + ' Professional',
        // Academic grades from manual entry
        extracted: {
          tenth_percent: parseFloat(formData.get('manual_10th') as string || '0') || null,
          twelfth_percent: parseFloat(formData.get('manual_12th') as string || '0') || null,
          grad_cgpa: parseFloat(formData.get('manual_cgpa') as string || '0') || null,
          branch: formData.get('manual_branch') as string || null,
        }
      };

      if (user) {
        const { extracted } = manualData;
        const updates: Record<string, any> = {};
        if (extracted.tenth_percent) updates.tenth_percent = extracted.tenth_percent;
        if (extracted.twelfth_percent) updates.twelfth_percent = extracted.twelfth_percent;
        if (extracted.grad_cgpa) updates.grad_cgpa = extracted.grad_cgpa;
        if (extracted.branch) updates.branch = extracted.branch;

        if (Object.keys(updates).length > 0) {
          await supabase.from('profiles').update(updates).eq('id', user.id);
        }
      }

      return NextResponse.json({ success: true, data: manualData, source: 'manual' });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided', requiresManualEntry: true }, { status: 400 });
    }

    // ── PDF Parse path ───────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    try {
      text = await parsePDFBuffer(buffer);
    } catch (pdfErr: any) {
      console.warn('pdf-parse failed:', pdfErr?.message);
      // Signal the client to show manual entry form
      return NextResponse.json({
        success: false,
        error: 'PDF could not be read. It may be image-based or password-protected.',
        requiresManualEntry: true
      }, { status: 422 });
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({
        success: false,
        error: 'PDF appears empty or is an image-only scan. Please use a text-based PDF.',
        requiresManualEntry: true
      }, { status: 422 });
    }

    // ── GitHub README extraction ─────────────────────────────────────────
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
            if (!res.ok) res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
            if (res.ok) {
              const readmeText = await res.text();
              extractedData.push(`\n--- REPOSITORY DATA: ${repo} ---\n${readmeText.substring(0, 1000)}...\n`);
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch GitHub README for ${url}`, e);
      }
    }

    if (extractedData.length > 0) {
      text += "\n\n=== EXTRACTED PROJECT METADATA (GITHUB READMES) ===\n" + extractedData.join("\n");
    }

    // ── Groq AI Parsing ──────────────────────────────────────────────────
    const prompt = `
You are a precise resume parser AND career analyst. Extract all information from the resume below
and return ONLY a valid JSON object. No extra text, no markdown, no explanation. Just the JSON.

CRITICAL — "detectedIndustry" MUST be the EXACT job title/role the candidate is targeting, inferred
from their degree, experience, skills, and projects. Examples:
- E&TC/Electronics degree OR mentions 'ESP32'/'IoT' → "E&TC / Embedded Engineer"
- CS/IT degree + coding projects → "Software Engineer"
- MBA/Marketing courses + campaigns → "Marketing Manager"
- Finance/Accounting degree → "Finance Analyst"
- HR/Psychology degree → "HR Executive"
- Mechanical Engineering → "Mechanical Engineer"
- BBA + business projects → "Business Analyst"
- Data Science/ML projects → "Data Scientist"
Always provide a specific, relevant job title — NEVER leave it generic or empty.

CRITICAL — "extracted" object: Extract the student's academic grades DIRECTLY from the resume text.
- "tenth_percent": Their 10th standard percentage (look for "SSC", "10th", "Matriculation" sections)
- "twelfth_percent": Their 12th standard percentage (look for "HSC", "12th", "Intermediate", "Diploma" sections)
- "grad_cgpa": Their current CGPA or percentage (look for "B.E.", "B.Tech", "Engineering" sections)
- "branch": Their engineering/academic branch e.g. "Computer Science", "Electronics", "Mechanical"
Set to null if not found.

Return this exact JSON structure:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string or null",
    "github": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string or null",
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "tools": ["string"],
    "languages": ["string"]
  },
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "startDate": "string",
      "endDate": "string or 'Present'",
      "responsibilities": ["string"],
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string",
      "percentage_or_cgpa": "string or null",
      "relevant_coursework": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "role": "string",
      "outcome": "string or null",
      "link": "string or null"
    }
  ],
  "certifications": ["string"],
  "achievements": ["string"],
  "totalYearsExperience": 0,
  "primaryTechStack": ["string"],
  "detectedIndustry": "specific job title string — NEVER empty",
  "extracted": {
    "tenth_percent": null,
    "twelfth_percent": null,
    "grad_cgpa": null,
    "branch": null
  }
}

Resume text:
${text}
`;

    const parsedJSONString = await callAI(prompt);
    let parsedData: any;
    try {
      const cleaned = parsedJSONString.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      console.error('AI JSON Parse Error:', parsedJSONString);
      throw new Error('AI returned invalid format. Please try again.');
    }

    // Ensure detectedIndustry is never empty
    if (!parsedData.detectedIndustry || parsedData.detectedIndustry.trim() === '') {
      parsedData.detectedIndustry =
        parsedData.experience?.[0]?.role ||
        (parsedData.education?.[0]?.degree?.replace('B.E.', '').replace('B.Tech', '').trim() || 'Engineering') + ' Professional';
    }

    // ── Save to Supabase ─────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        // Save raw resume
        await supabase.from('resumes').upsert({
          user_id: user.id,
          raw_text: text,
          parsed_json: parsedData,
          updated_at: new Date().toISOString()
        });

        // Auto-populate academic profile from extracted grades
        const extracted = parsedData.extracted || {};
        const profileUpdates: Record<string, any> = {};
        if (extracted.tenth_percent && !isNaN(extracted.tenth_percent)) profileUpdates.tenth_percent = extracted.tenth_percent;
        if (extracted.twelfth_percent && !isNaN(extracted.twelfth_percent)) profileUpdates.twelfth_percent = extracted.twelfth_percent;
        if (extracted.grad_cgpa && !isNaN(extracted.grad_cgpa)) profileUpdates.grad_cgpa = extracted.grad_cgpa;
        if (extracted.branch && extracted.branch.trim()) profileUpdates.branch = extracted.branch;

        if (Object.keys(profileUpdates).length > 0) {
          console.log('Auto-populating academic profile from resume:', profileUpdates);
          await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
        }
      } catch (dbError) {
        console.error('Supabase Resume Save Error:', dbError);
        // Non-fatal — continue even if DB save fails
      }
    }

    return NextResponse.json({ success: true, data: parsedData, source: 'pdf' });

  } catch (error: any) {
    console.error('Global Resume Parse API Error:', error);

    // If it's a PDF issue, signal manual entry
    const isPdfError = error?.message?.toLowerCase().includes('pdf') || error?.message?.toLowerCase().includes('parse');
    return NextResponse.json({
      success: false,
      error: error.message || 'Processing failed. Please ensure the PDF contains extractable text.',
      requiresManualEntry: isPdfError
    }, { status: 500 });
  }
}
