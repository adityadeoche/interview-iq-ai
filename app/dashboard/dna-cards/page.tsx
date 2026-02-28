"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BrainCircuit,
    BarChart3,
    Trophy,
    Briefcase,
    ShieldCheck,
    ChevronRight,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Plus
} from "lucide-react";
import { motion } from "framer-motion";

export default function DNACardsPage() {
    const [report, setReport] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const data = sessionStorage.getItem("final_dna_report");
        if (data) {
            try {
                setReport(JSON.parse(data));
            } catch { }
        }
    }, []);

    const getScoreColor = (s: number) =>
        s >= 75 ? "text-accent-green" : s >= 50 ? "text-yellow-400" : "text-accent-red";

    const getBarColor = (s: number) =>
        s >= 75 ? "bg-accent-green" : s >= 50 ? "bg-yellow-400" : "bg-accent-red";

    const getVerdictStyle = (v: string) => {
        switch (v) {
            case "STRONG HIRE": return "bg-accent-green/10 text-accent-green border-accent-green/30";
            case "HIRE": return "bg-accent-blue/10 text-accent-blue border-accent-blue/30";
            case "BORDERLINE": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
            default: return "bg-accent-red/10 text-accent-red border-accent-red/30";
        }
    };

    const rounds = report?.roundScores ? [
        { label: "Round 1", sub: "Aptitude", score: report.roundScores.round1 ?? 0 },
        { label: "Round 2", sub: "Technical", score: report.roundScores.round2 ?? 0 },
        { label: "Round 3", sub: "Resume", score: report.roundScores.round3 ?? 0 },
        { label: "Round 4", sub: "Coding", score: report.roundScores.round4 ?? 0 },
        { label: "Round 5", sub: "Written", score: report.roundScores.round5 ?? 0 },
    ] : [];

    // No report yet
    if (!report) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-sora mb-2">Interview Report</h1>
                    <p className="text-text-secondary">Your latest interview performance will appear here after you complete an interview.</p>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-secondary border-2 border-dashed border-border-color rounded-[2rem] p-16 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mb-6 border border-accent-blue/20">
                        <BrainCircuit className="text-accent-blue w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold font-sora mb-3">No Interview Completed Yet</h2>
                    <p className="text-text-secondary max-w-sm mb-8">
                        Complete a full mock interview (all 5 rounds) to generate your personalized Interview DNA Report.
                    </p>
                    <button onClick={() => router.push("/dashboard/student/new")}
                        className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-accent-blue/20">
                        <Plus className="w-5 h-5" /> Start Interview Now
                    </button>
                </motion.div>
            </div>
        );
    }

    const overallScore = report.overallScore ?? 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sora mb-1">Interview Report</h1>
                    <p className="text-text-secondary text-sm">Your latest mock interview performance summary</p>
                </div>
                <button onClick={() => router.push("/dashboard/report/latest")}
                    className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-accent-blue/20 text-sm">
                    View Full Report <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Hero: Name + Role + Verdict + Score */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary rounded-[2.5rem] border border-border-color p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Trophy className="w-48 h-48" />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-accent-green" /> Latest Result
                        </p>
                        <h2 className="text-3xl font-bold font-sora">{report.candidateName || "Candidate"}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <Briefcase className="w-4 h-4 text-accent-blue" />
                            <span className="text-accent-blue font-bold">{report.role || "—"}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <span className={`px-6 py-2 rounded-2xl border font-bold text-lg ${getVerdictStyle(report.verdict)}`}>
                            {report.verdict}
                        </span>
                        <div className="text-right">
                            <p className="text-[11px] text-text-secondary uppercase tracking-widest">Overall Score</p>
                            <p className={`text-5xl font-bold font-sora ${getScoreColor(overallScore)}`}>
                                {overallScore}<span className="text-base text-text-secondary">%</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Round-by-Round Scores */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-bg-secondary rounded-[2rem] border border-border-color p-8">
                <h3 className="text-xl font-bold font-sora mb-6 flex items-center gap-2">
                    <BarChart3 className="text-accent-blue w-6 h-6" /> Round-by-Round Performance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {rounds.map((r, i) => (
                        <motion.div key={r.label}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
                            className="bg-bg-card rounded-2xl border border-border-color p-5 text-center">
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-0.5">{r.label}</p>
                            <p className="text-[10px] text-text-secondary mb-3">{r.sub}</p>
                            <p className={`text-3xl font-bold font-sora ${getScoreColor(r.score)}`}>
                                {r.score}<span className="text-xs">%</span>
                            </p>
                            <div className="mt-3 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                                <motion.div className={`h-full rounded-full ${getBarColor(r.score)}`}
                                    initial={{ width: 0 }} animate={{ width: `${r.score}%` }}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }} />
                            </div>
                            <p className={`text-[10px] font-bold mt-2 ${r.score >= 50 ? 'text-accent-green' : 'text-accent-red'}`}>
                                {r.score >= 50 ? '✓ PASS' : '✗ FAIL'}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Summary + Selling Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="bg-bg-secondary rounded-[2rem] border border-border-color p-8 space-y-5">
                    <h3 className="text-xl font-bold font-sora flex items-center gap-2">
                        <TrendingUp className="text-accent-purple w-5 h-5" /> AI Summary
                    </h3>
                    <div className="p-5 bg-bg-card rounded-2xl border border-border-color italic text-text-secondary text-sm leading-relaxed">
                        &ldquo;{report.summary}&rdquo;
                    </div>
                    <div className="p-5 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl text-sm flex gap-3">
                        <AlertCircle className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
                        <p className="text-text-primary">{report.recommendation}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="bg-bg-secondary rounded-[2rem] border border-border-color p-8 space-y-5">
                    <h3 className="text-xl font-bold font-sora flex items-center gap-2">
                        <CheckCircle2 className="text-accent-green w-5 h-5" /> Selling Points
                    </h3>
                    <div className="space-y-3">
                        {(report.sellingPoints || []).map((p: string, i: number) => (
                            <div key={i} className="flex gap-3 items-start p-4 bg-bg-card rounded-2xl border border-border-color">
                                <span className="w-6 h-6 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-xs font-bold shrink-0">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-text-secondary">{p}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button onClick={() => router.push("/dashboard/report/latest")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-blue hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-accent-blue/20">
                    View Full Detailed Report <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => router.push("/dashboard/student/new")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border border-border-color hover:border-accent-purple text-text-secondary hover:text-accent-purple font-bold px-8 py-4 rounded-2xl transition-all">
                    <Plus className="w-4 h-4" /> New Interview
                </button>
            </div>
        </div>
    );
}
