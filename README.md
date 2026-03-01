<div align="center">
  <img src="https://github.com/adityadeoche/interview-iq-ai/releases/download/v1.0.0/Screenshot.2026-03-01.at.12.26.11.PM.png" alt="InterviewIQ AI Landing Page" width="100%" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</div>

# 🤖 InterviewIQ AI — The Future of Placements

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq-AI_Engine-F3D03E?style=for-the-badge&logo=openai)](https://groq.com/)
[![Deployment: Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render)](https://interview-iq-ai.onrender.com/)

> **Elevating the campus recruitment experience with AI-driven mock interviews, deep talent analytics, and automated screening workflows.**

---

## 🚀 Live Demo
Experience the platform live: **[interview-iq-ai.onrender.com](https://interview-iq-ai.onrender.com/)**

---

## 🛠️ The Core Engine
InterviewIQ AI is not just a form; it's a sophisticated **5-Round recursive interview simulator** powered by **Groq's Llama-3.3-70b**. It handles everything from initial aptitude screening to deep-dive resume analysis.

### 🌟 Key Features
*   **🎯 Intelligent Mock Interviews**: Tailored questions generated from your specific resume and target job role using advanced LLM processing.
*   **📊 Talent DNA Reporting**: Interactive skill matrices (Recharts) and performance analytics for students to identify their gaps.
*   **🏢 Recruiter Command Center**: HRs can create jobs, manage candidates, and view AI-shortlisted talent with a single click.
*   **🏫 Campus TPO Dashboard**: Holistic batch analytics, placement drive management, and results broadcast controls for college administrators.
*   **🔒 Secure & Masked Results**: Strict gatekeeping ensures student results are only visible after the TPO officially "broadcasts" the outcomes.

---

## 💻 Tech Architecture
Built with a modular, scalable stack for production-grade reliability:

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Next.js 15 (App Router) |
| **Styling** | Tailwind CSS + Framer Motion (for premium micro-animations) |
| **Backend** | Next.js Server Actions + API Routes |
| **Database** | Supabase (PostgreSQL) with Row-Level Security (RLS) |
| **Authentication**| Supabase Auth (Email + Google OAuth) |
| **AI Engine** | Groq SDK (Llama 3.3 70B Versatile) |
| **Analytics** | Recharts (Responsive Talent Matrix) |

---

## 📁 Project Structure
```text
├── app/                  # Next.js App Router (Portals: Student, HR, Campus)
├── components/           # Reusable UI Architecture
├── supabase/             # Database migrations and RLS policies
├── lib/                  # Centralized AI & Supabase logic
├── public/               # Static Assets
└── hooks/                # Custom React Hooks (Auth, Session)
```

---

## ⚡ Deployment & Setup

### Environment Variables
To run this locally, create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### Local Development
```bash
# Install dependencies
npm install

# Start the engine
npm run dev
```

---

## 📄 License
Custom built for high-scale placement automation. Built with ❤️ for the student community.
