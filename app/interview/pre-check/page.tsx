"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dna,
    TrendingUp,
    AlertTriangle,
    Target,
    Zap,
    ShieldCheck,
    ChevronRight,
    Loader2,
    BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

export default function PreCheckPage() {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const runAnalysis = async () => {
            const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
            const resumeData = JSON.parse(sessionStorage.getItem("parsed_resume") || "{}");

            if (!jobData.role || !resumeData.personalInfo) {
                router.push("/interview/setup");
                return;
            }

            try {
                const res = await fetch("/api/pre-check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobData, resumeData }),
                });
                const data = await res.json();
                if (data.success) {
                    setAnalysis(data.data);
                    sessionStorage.setItem("pre_check_analysis", JSON.stringify(data.data));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        runAnalysis();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mb-8 border border-accent-blue/20"
                >
                    <Dna className="text-accent-blue w-10 h-10" />
                </motion.div>
                <h1 className="text-2xl font-bold font-sora mb-4">Generating Your DNA Report...</h1>
                <p className="text-text-secondary max-w-sm">
                    Gemini AI is analyzing your resume against the job description to calibrate your interview difficulty.
                </p>
                <div className="mt-12 w-64 h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-full w-1/2 bg-accent-blue"
                    />
                </div>
            </div>
        );
    }

    const getReadinessColor = (status: string) => {
        switch (status) {
            case "READY": return "text-accent-green bg-accent-green/10 border-accent-green/30";
            case "RISKY": return "text-accent-yellow bg-accent-yellow/10 border-accent-yellow/30";
            case "UNPREPARED": return "text-accent-red bg-accent-red/10 border-accent-red/30";
            default: return "text-white bg-white/10";
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-6 pb-20">
            <div className="max-w-4xl mx-auto pt-12">
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color">
                        <ShieldCheck className="text-accent-blue w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-sora">Pre-Interview Health Report</h1>
                        <p className="text-text-secondary mt-1">Based on Gemini AI Analysis of your Profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Score Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1 bg-bg-secondary p-8 rounded-[2rem] border border-border-color flex flex-col items-center justify-center text-center"
                    >
                        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-bg-card" />
                                <motion.circle
                                    cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="440"
                                    initial={{ strokeDashoffset: 440 }}
                                    animate={{ strokeDashoffset: 440 - (440 * analysis.compatibilityScore) / 100 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className="text-accent-blue"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold font-sora">{analysis.compatibilityScore}%</span>
                                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Match</span>
                            </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getReadinessColor(analysis.readinessStatus)}`}>
                            {analysis.verdict}
                        </span>
                    </motion.div>

                    {/* Analysis Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 bg-bg-secondary p-8 rounded-[2rem] border border-border-color"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <BarChart3 className="text-accent-purple w-6 h-6" />
                            <h2 className="text-xl font-bold font-sora">AI Insights</h2>
                        </div>
                        <p className="text-text-secondary leading-relaxed italic mb-6">
                            "{analysis.analysis}"
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-bg-card rounded-xl border border-border-color">
                                <Target className="text-accent-blue w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase font-bold">Targeted Difficulty</p>
                                    <p className="text-sm font-bold">Role-Specific Calibration</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-bg-card rounded-xl border border-border-color">
                                <Zap className="text-accent-yellow w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase font-bold">Interview Rounds</p>
                                    <p className="text-sm font-bold">5 Progressive Rounds</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Strengths */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-bg-secondary p-8 rounded-[2rem] border border-border-color"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="text-accent-green w-6 h-6" />
                            <h2 className="text-xl font-bold font-sora">Key Strengths</h2>
                        </div>
                        <ul className="space-y-4">
                            {analysis.strengths.map((s: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm">
                                    <span className="w-5 h-5 shrink-0 bg-accent-green/20 text-accent-green rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">✓</span>
                                    <span className="text-text-secondary"><strong className="text-text-primary">{s.split(":")[0]}:</strong> {s.split(":")[1] || ""}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Gaps */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-bg-secondary p-8 rounded-[2rem] border border-border-color"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="text-accent-red w-6 h-6" />
                            <h2 className="text-xl font-bold font-sora">Potential Gaps</h2>
                        </div>
                        <ul className="space-y-4">
                            {analysis.gaps.map((g: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm">
                                    <span className="w-5 h-5 shrink-0 bg-accent-red/20 text-accent-red rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">!</span>
                                    <span className="text-text-secondary"><strong className="text-text-primary">{g.split(":")[0]}:</strong> {g.split(":")[1] || ""}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                <div className="flex flex-col items-center">
                    <button
                        onClick={() => router.push("/interview/session/round-1")}
                        className="w-full md:w-auto bg-accent-blue hover:bg-blue-600 text-white font-bold px-12 py-5 rounded-2xl transition-all shadow-xl shadow-accent-blue/40 flex items-center justify-center gap-2 group"
                    >
                        Enter Interview Hall <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-6 text-xs text-text-secondary flex items-center gap-2">
                        <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
                        Interview Engine Calibrated Successfully
                    </p>
                </div>
            </div>
        </div>
    );
}
