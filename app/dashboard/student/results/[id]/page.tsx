"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip
} from "recharts";
import { motion } from "framer-motion";
import {
    TrendingUp, AlertCircle, Star, ExternalLink,
    ChevronLeft, BrainCircuit, Award, BookOpen
} from "lucide-react";

interface ResultData {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    strengths: string[];
    improvements: string[];
    resources: { title: string; url: string }[];
    summary: string;
    role: string;
    createdAt: string;
}

export default function ResultsPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<ResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await fetch("/api/interview/results", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ interviewId: params.id }),
                });
                const result = await res.json();
                if (!result.success) throw new Error(result.error || "Failed to load results");
                setData(result.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [params.id]);

    if (loading) return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6">
            <BrainCircuit className="w-14 h-14 text-accent-blue animate-pulse" />
            <div className="text-center">
                <h2 className="text-2xl font-bold font-sora">Generating Your Performance Matrix...</h2>
                <p className="text-text-secondary mt-2 text-sm">AI is analyzing your entire interview.</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-bg-card border border-accent-red/20 p-8 rounded-[2.5rem] text-center space-y-6">
                <AlertCircle className="text-accent-red w-14 h-14 mx-auto" />
                <h2 className="text-xl font-bold text-accent-red">Failed to Load Results</h2>
                <p className="text-text-secondary text-sm">{error}</p>
                <button onClick={() => router.push("/dashboard")} className="w-full bg-accent-blue text-white font-bold py-4 rounded-2xl">
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    const radarData = [
        { subject: 'Technical Accuracy', value: data.technicalScore, fullMark: 100 },
        { subject: 'Clarity of Speech', value: data.communicationScore, fullMark: 100 },
        { subject: 'Confidence', value: data.confidenceScore, fullMark: 100 },
        { subject: 'Overall Score', value: data.overallScore, fullMark: 100 },
    ];

    const scoreColor = (s: number) => s >= 75 ? 'text-accent-green' : s >= 50 ? 'text-accent-yellow' : 'text-accent-red';
    const scoreBg = (s: number) => s >= 75 ? 'bg-accent-green/10 border-accent-green/20' : s >= 50 ? 'bg-accent-yellow/10 border-accent-yellow/20' : 'bg-accent-red/10 border-accent-red/20';

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary pb-16">
            {/* Header */}
            <div className="bg-bg-secondary/60 backdrop-blur-xl border-b border-border-color p-4 md:px-8 flex items-center gap-4">
                <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-bg-card rounded-xl transition-all">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="font-bold font-sora text-lg">Performance Matrix</h1>
                    <p className="text-text-secondary text-xs">{data.role} · {new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="ml-auto">
                    <span className={`text-3xl font-bold font-sora ${scoreColor(data.overallScore)}`}>
                        {data.overallScore}
                        <span className="text-base text-text-secondary font-normal">/100</span>
                    </span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8 space-y-8">
                {/* Summary Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-3xl border ${scoreBg(data.overallScore)}`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Award className={`w-5 h-5 ${scoreColor(data.overallScore)}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${scoreColor(data.overallScore)}`}>AI Verdict</span>
                    </div>
                    <p className="text-base leading-relaxed">{data.summary}</p>
                </motion.div>

                {/* Radar + Score Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Radar Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-bg-secondary border border-border-color rounded-3xl p-6"
                    >
                        <h2 className="text-lg font-bold font-sora mb-4">Skill Radar</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 12, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#555', fontSize: 10 }} />
                                <Radar
                                    name="Score"
                                    dataKey="value"
                                    stroke="#2563eb"
                                    fill="#2563eb"
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', color: '#e6edf3' }}
                                    formatter={(v) => [`${v}/100`, 'Score']}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* 4 Score Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {[
                            { label: 'Overall Score', value: data.overallScore, icon: <Star className="w-4 h-4" /> },
                            { label: 'Technical Accuracy', value: data.technicalScore, icon: <BrainCircuit className="w-4 h-4" /> },
                            { label: 'Clarity of Speech', value: data.communicationScore, icon: <TrendingUp className="w-4 h-4" /> },
                            { label: 'Confidence', value: data.confidenceScore, icon: <Award className="w-4 h-4" /> },
                        ].map(({ label, value, icon }) => (
                            <div key={label} className={`p-5 rounded-2xl border ${scoreBg(value)} flex flex-col justify-between`}>
                                <div className={`flex items-center gap-2 mb-3 ${scoreColor(value)}`}>
                                    {icon}
                                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                                </div>
                                <div>
                                    <span className={`text-4xl font-bold font-sora ${scoreColor(value)}`}>{value}</span>
                                    <span className="text-text-secondary text-sm ml-1">/100</span>
                                </div>
                                <div className="mt-3 h-1.5 bg-bg-card rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value}%` }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                        className={`h-full rounded-full ${value >= 75 ? 'bg-accent-green' : value >= 50 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-bg-secondary border border-border-color rounded-3xl p-6"
                    >
                        <h2 className="text-base font-bold font-sora mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-accent-green" />
                            <span className="text-accent-green">3 Key Strengths</span>
                        </h2>
                        <ul className="space-y-3">
                            {data.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-1 w-5 h-5 rounded-full bg-accent-green/10 border border-accent-green/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-accent-green">{i + 1}</span>
                                    <span className="text-sm text-text-secondary leading-relaxed">{s}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-bg-secondary border border-border-color rounded-3xl p-6"
                    >
                        <h2 className="text-base font-bold font-sora mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-accent-red" />
                            <span className="text-accent-red">3 Areas to Improve</span>
                        </h2>
                        <ul className="space-y-3">
                            {data.improvements.map((s, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-1 w-5 h-5 rounded-full bg-accent-red/10 border border-accent-red/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-accent-red">{i + 1}</span>
                                    <span className="text-sm text-text-secondary leading-relaxed">{s}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Actionable Resources */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-bg-secondary border border-border-color rounded-3xl p-6"
                >
                    <h2 className="text-base font-bold font-sora mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-accent-blue" />
                        Actionable Study Resources
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.resources.map((r, i) => (
                            <a
                                key={i}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-4 bg-bg-card rounded-2xl border border-border-color hover:border-accent-blue transition-all group"
                            >
                                <span className="w-6 h-6 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-accent-blue">{i + 1}</span>
                                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed">{r.title}</span>
                                <ExternalLink className="w-3 h-3 text-text-secondary ml-auto flex-shrink-0 mt-0.5 group-hover:text-accent-blue transition-colors" />
                            </a>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4 pb-8">
                    <button
                        onClick={() => router.push("/dashboard/student/new")}
                        className="flex-1 bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all"
                    >
                        Start Another Interview
                    </button>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex-1 bg-bg-secondary border border-border-color font-bold py-4 rounded-2xl hover:bg-bg-card transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
