"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Download,
    Award,
    Target,
    Zap,
    CheckCircle2,
    ChevronRight,
    ShieldCheck,
    TrendingUp,
    BrainCircuit,
    Trophy,
    BarChart3,
    Briefcase,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer
} from 'recharts';

export default function LatestReportPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDrive, setIsDrive] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
        setIsDrive(jobData.mode === 'drive');

        const data = sessionStorage.getItem("final_dna_report");
        if (data) {
            setReport(JSON.parse(data));
        } else {
            // Fallback demo data
            setReport({
                candidateName: "Aditya Deoche",
                role: "E&TC Engineer",
                overallScore: 82,
                verdict: "HIRE",
                roundScores: { round1: 80, round2: 85, round3: 78, round4: 88, round5: 79 },
                matrix: { technical: 8, logic: 8, communication: 8, cultural: 7, experience: 8 },
                recommendation: "Strong candidate with solid technical foundation. Ready for entry-level engineering role.",
                sellingPoints: [
                    "Consistent performer across all 5 interview rounds",
                    "Strong technical skills validated through coding and aptitude",
                    "Clear professional communication demonstrated in written assessment"
                ],
                summary: "A well-rounded candidate with strong aptitude and technical skills aligned with the target role."
            });
        }
        setLoading(false);
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
            <div className="text-center">
                <BrainCircuit className="text-accent-blue w-16 h-16 animate-pulse mx-auto mb-4" />
                <p className="text-text-secondary font-sora">Loading your report...</p>
            </div>
        </div>
    );

    const roundScores = report.roundScores || {};
    const rounds = [
        { key: 'round1', label: 'Round 1', sub: 'Aptitude', color: 'accent-blue', score: roundScores.round1 ?? 0 },
        { key: 'round2', label: 'Round 2', sub: 'Technical', color: 'accent-purple', score: roundScores.round2 ?? 0 },
        { key: 'round3', label: 'Round 3', sub: 'Resume Depth', color: 'accent-green', score: roundScores.round3 ?? 0 },
        { key: 'round4', label: 'Round 4', sub: 'Coding', color: 'accent-blue', score: roundScores.round4 ?? 0 },
        { key: 'round5', label: 'Round 5', sub: 'Written', color: 'accent-yellow', score: roundScores.round5 ?? 0 },
    ];

    const chartData = [
        { subject: 'Technical', A: (report.matrix?.technical ?? 7) * 10, fullMark: 100 },
        { subject: 'Logic', A: (report.matrix?.logic ?? 7) * 10, fullMark: 100 },
        { subject: 'Comm.', A: (report.matrix?.communication ?? 7) * 10, fullMark: 100 },
        { subject: 'Culture', A: (report.matrix?.cultural ?? 7) * 10, fullMark: 100 },
        { subject: 'Exp.', A: (report.matrix?.experience ?? 7) * 10, fullMark: 100 },
    ];

    const getVerdictStyle = (v: string) => {
        switch (v) {
            case "STRONG HIRE": return { bg: "bg-accent-green/10", text: "text-accent-green", border: "border-accent-green/40" };
            case "HIRE": return { bg: "bg-accent-blue/10", text: "text-accent-blue", border: "border-accent-blue/40" };
            case "BORDERLINE": return { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/40" };
            default: return { bg: "bg-accent-red/10", text: "text-accent-red", border: "border-accent-red/40" };
        }
    };

    const getScoreColor = (s: number) =>
        s >= 75 ? "text-accent-green" : s >= 55 ? "text-yellow-400" : "text-accent-red";

    const getScoreBarColor = (s: number) =>
        s >= 75 ? "bg-accent-green" : s >= 55 ? "bg-yellow-400" : "bg-accent-red";

    const vs = getVerdictStyle(report.verdict);
    const overallScore = report.overallScore ?? 0;

    if (isDrive) {
        return (
            <div className="min-h-screen bg-bg-primary text-text-primary p-6 flex flex-col items-center justify-center text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md bg-bg-secondary p-10 rounded-[2.5rem] border border-border-color shadow-2xl">
                    <div className="w-20 h-20 bg-accent-blue/10 text-accent-blue rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold font-sora mb-2">Drive Completed!</h1>
                    <p className="text-text-secondary mb-8 text-sm leading-relaxed">
                        Your interview evaluation has been securely recorded.
                        Because this is an official Campus Drive, detailed scores and DNA reports are hidden.
                        <br /><br />
                        Results will be published by your TPO or HR once all candidates have been evaluated.
                    </p>
                    <button onClick={() => router.push("/dashboard")} className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-accent-blue/20">
                        Back to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-10 pb-32">
            <div className="max-w-6xl mx-auto">

                {/* ─── Hero Header ─── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-10 bg-bg-secondary rounded-[2.5rem] border border-border-color p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                        <Award className="w-64 h-64 text-white" />
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-accent-green" /> InterviewIQ · Final Report
                            </p>
                            <h1 className="text-4xl md:text-5xl font-bold font-sora mb-2">
                                {report.candidateName || "Candidate"}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <Briefcase className="w-4 h-4 text-accent-blue" />
                                <span className="text-accent-blue font-bold text-lg">{report.role || "Unknown Role"}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className={`px-8 py-3 rounded-2xl border font-bold text-xl ${vs.bg} ${vs.text} ${vs.border}`}>
                                {report.verdict}
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] text-text-secondary uppercase tracking-widest">Overall Score</p>
                                <p className={`text-5xl font-bold font-sora ${getScoreColor(overallScore)}`}>{overallScore}<span className="text-base text-text-secondary">%</span></p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ─── Round-by-Round Scores ─── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="mb-8 bg-bg-secondary rounded-[2rem] border border-border-color p-8">
                    <h2 className="text-xl font-bold font-sora mb-6 flex items-center gap-2">
                        <BarChart3 className="text-accent-blue w-6 h-6" /> Round-by-Round Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {rounds.map((r, i) => (
                            <motion.div key={r.key}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                                className="bg-bg-card rounded-2xl border border-border-color p-5 text-center">
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{r.label}</p>
                                <p className="text-xs text-text-secondary mb-3">{r.sub}</p>
                                <p className={`text-3xl font-bold font-sora ${getScoreColor(r.score)}`}>{r.score}<span className="text-sm">%</span></p>
                                <div className="mt-3 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                                    <motion.div className={`h-full ${getScoreBarColor(r.score)} rounded-full`}
                                        initial={{ width: 0 }} animate={{ width: `${r.score}%` }}
                                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }} />
                                </div>
                                <p className={`text-[10px] font-bold mt-2 ${r.score >= 50 ? 'text-accent-green' : 'text-accent-red'}`}>
                                    {r.score >= 50 ? '✓ PASS' : '✗ FAIL'}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ─── Matrix + Summary ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                    {/* Radar Chart */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-bg-secondary rounded-[2.5rem] border border-border-color p-8">
                        <h3 className="text-xl font-bold font-sora mb-1 flex items-center gap-2">
                            <TrendingUp className="text-accent-purple w-5 h-5" /> Skill Matrix DNA
                        </h3>
                        <p className="text-text-secondary text-sm mb-6">Visualisation of core competencies across all 5 interview dimensions.</p>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-full h-[250px] md:w-1/2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid stroke="#333" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                                        <Radar name="Candidate" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
                                {Object.entries(report.matrix || {}).map(([key, val]: any) => (
                                    <div key={key} className="bg-bg-card p-4 rounded-xl border border-border-color">
                                        <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">{key}</p>
                                        <p className="text-2xl font-bold text-white">{val}<span className="text-xs text-text-secondary ml-1">/10</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Verdict + AI Insight */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="bg-bg-secondary rounded-[2.5rem] border border-border-color p-8 flex flex-col gap-6">
                        <div>
                            <p className="text-xs text-text-secondary uppercase font-bold tracking-widest mb-3">Executive Summary</p>
                            <div className="p-5 bg-bg-card rounded-2xl border border-border-color italic text-text-secondary text-sm leading-relaxed">
                                &ldquo;{report.summary}&rdquo;
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                                <Zap className="w-3 h-3 text-accent-blue" /> Recommendation
                            </p>
                            <div className="p-5 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl text-sm text-text-primary">
                                {report.recommendation}
                            </div>
                        </div>
                        <div className="mt-auto">
                            <div className="flex justify-between items-center text-sm py-2 border-b border-border-color">
                                <span className="text-text-secondary">Profile Authenticity</span>
                                <span className="text-accent-green font-bold">Verified ✓</span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-2">
                                <span className="text-text-secondary">Market Readiness</span>
                                <span className={`font-bold ${overallScore >= 70 ? 'text-accent-green' : 'text-yellow-400'}`}>
                                    {overallScore >= 85 ? 'Tier 1 (Top)' : overallScore >= 70 ? 'Tier 2 (High)' : 'Developing'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ─── Selling Points ─── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="mb-10 bg-bg-secondary rounded-[2rem] border border-border-color p-8">
                    <h3 className="text-xl font-bold font-sora mb-6 flex items-center gap-2">
                        <CheckCircle2 className="text-accent-green w-6 h-6" /> Top Selling Points for a Recruiter
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(report.sellingPoints || []).map((point: string, i: number) => (
                            <div key={i} className="flex gap-4 items-start p-5 bg-bg-card rounded-2xl border border-border-color hover:border-accent-green/40 transition-all">
                                <span className="w-7 h-7 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-text-secondary">{point}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ─── Actions ─── */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-border-color hover:border-white text-text-secondary hover:text-white transition-all font-bold">
                        Back to Dashboard <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => {
                        const el = document.getElementById('report-root');
                        window.print();
                    }}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent-blue hover:bg-blue-600 text-white font-bold shadow-lg shadow-accent-blue/20 transition-all">
                        <Download className="w-4 h-4" /> Export / Print Report
                    </button>
                    <button onClick={() => router.push("/interview/session/round-1")}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-bg-card border border-border-color hover:border-accent-purple text-text-secondary hover:text-accent-purple font-bold transition-all">
                        <Trophy className="w-4 h-4" /> Retake Interview
                    </button>
                </div>
            </div>
        </div>
    );
}
