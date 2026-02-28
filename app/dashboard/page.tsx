"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Clock, Trophy, CheckCircle, BarChart3, ArrowUpRight, Cpu, TrendingUp, GraduationCap, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import JoinDriveCard from "@/components/student/JoinDriveCard";
import MyDrivesCard from "@/components/student/MyDrivesCard";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Interview {
    id: string;
    role: string;
    avg_score: number;
    created_at: string;
    drive_id: string | null;
    drives: { results_published: boolean } | null;
}

export default function CandidateDashboard() {
    const { profile, user } = useAuth();
    const firstName = profile?.full_name?.split(" ")[0] || "User";
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loadingInterviews, setLoadingInterviews] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        const fetchInterviews = async () => {
            const { data } = await supabase
                .from("interviews")
                .select("id, role, avg_score, created_at, drive_id, drives(results_published)")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(10);
            setInterviews(data || []);
            setLoadingInterviews(false);
        };
        fetchInterviews();
    }, [user]);

    // Derive stats from real data
    const totalInterviews = interviews.length;
    const avgScore = interviews.length
        ? Math.round(interviews.reduce((s, i) => s + (i.avg_score || 0), 0) / interviews.length * 10)
        : 0;
    const bestScore = interviews.length
        ? Math.max(...interviews.map(i => (i.avg_score || 0) * 10))
        : 0;
    const passedCount = interviews.filter(i => (i.avg_score || 0) >= 7).length;

    // Skill DNA: extract unique keywords from all interview roles
    const skillDNA = Array.from(new Set(
        interviews.flatMap(i =>
            i.role.split(/[\s,/&]+/).filter(w => w.length > 2)
        )
    )).slice(0, 20);

    const chartData = [...interviews]
        .slice(0, 5)
        .reverse()
        .map((inv, idx) => ({
            name: `Int ${idx + 1}`,
            score: (inv.avg_score || 0) * 10,
            role: inv.role.length > 15 ? inv.role.substring(0, 15) + "..." : inv.role
        }));

    const getVerdict = (score: number) => {
        const s = score * 10;
        if (s >= 75) return { label: "READY", cls: "bg-accent-green/10 text-accent-green border-accent-green/20" };
        if (s >= 50) return { label: "ALMOST", cls: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20" };
        return { label: "NEEDS WORK", cls: "bg-accent-red/10 text-accent-red border-accent-red/20" };
    };

    return (
        <div className="space-y-8">
            {/* Welcome Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-accent-blue to-accent-purple"
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-white">
                        <h1 className="text-3xl font-bold font-sora mb-2">Welcome back, {firstName}! 👋</h1>
                        <p className="opacity-90 max-w-md">
                            {totalInterviews === 0
                                ? "Ready to start your first mock interview? Upload your resume and let's go!"
                                : `You've completed ${totalInterviews} interview${totalInterviews > 1 ? 's' : ''}. Keep going!`}
                        </p>
                    </div>
                    <Link
                        href="/dashboard/student/new"
                        className="flex items-center justify-center gap-2 bg-white text-accent-blue font-bold px-6 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Start New Mock Interview
                    </Link>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </motion.div>

            {/* Academic Profile Banner — shown when grades are not filled */}
            {profile && !(profile as any).grad_cgpa && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-accent-yellow/10 border border-accent-yellow/30 rounded-2xl"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-accent-yellow/20 rounded-xl shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5 text-accent-yellow" />
                        </div>
                        <div>
                            <p className="font-bold text-accent-yellow">Academic Profile Incomplete</p>
                            <p className="text-sm text-text-secondary mt-0.5">
                                You must enter your <strong>10th %</strong>, <strong>12th %</strong>, <strong>CGPA</strong>, and <strong>Active Backlogs</strong> before you can register for any Placement Drive.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/profile/verify"
                        className="flex items-center gap-2 bg-accent-yellow text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-400 transition-all shrink-0 whitespace-nowrap"
                    >
                        <GraduationCap className="w-4 h-4" />
                        Fill Academic Profile
                    </Link>
                </motion.div>
            )}

            {/* Approved Drives Banner */}
            <MyDrivesCard />

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Clock className="w-5 h-5 text-accent-blue" />} label="Interviews Taken" value={totalInterviews.toString()} trend={totalInterviews > 0 ? "Keep it up!" : "Start your first!"} />
                <StatCard icon={<BarChart3 className="w-5 h-5 text-accent-purple" />} label="Average Score" value={totalInterviews ? `${avgScore}%` : "—"} trend={avgScore >= 70 ? "Above target!" : avgScore > 0 ? "Needs improvement" : "No data yet"} />
                <StatCard icon={<CheckCircle className="w-5 h-5 text-accent-green" />} label="Rounds Passed" value={passedCount.toString()} trend={`${totalInterviews ? Math.round((passedCount / totalInterviews) * 100) : 0}% success rate`} />
                <StatCard icon={<Trophy className="w-5 h-5 text-accent-yellow" />} label="Best Score" value={totalInterviews ? `${bestScore}%` : "—"} trend={interviews[0]?.role || "No interviews yet"} />
            </div>

            {/* Skill DNA */}
            {skillDNA.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-secondary border border-border-color rounded-3xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Cpu className="w-5 h-5 text-accent-purple" />
                        <h2 className="text-lg font-bold font-sora">Skill DNA</h2>
                        <span className="text-xs text-text-secondary ml-2">Built from your interview history</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {skillDNA.map((skill, i) => (
                            <span
                                key={skill}
                                style={{ opacity: Math.max(0.5, 1 - i * 0.04) }}
                                className="px-3 py-1.5 rounded-full text-xs font-bold border bg-accent-purple/5 border-accent-purple/20 text-accent-purple"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skill Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-bg-secondary border border-border-color rounded-3xl p-6 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold font-sora flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent-blue" />
                                Skill Growth
                            </h2>
                            <p className="text-xs text-text-secondary mt-1">Score trend across your last 5 interviews</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[200px]">
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }}
                                        labelStyle={{ color: '#8b949e', marginBottom: '4px' }}
                                        formatter={(value: any) => [`${value}%`, 'Score']}
                                        labelFormatter={(label, payload) => payload?.[0]?.payload?.role || label}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#0d1117' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary text-sm space-y-2">
                                <BarChart3 className="w-8 h-8 opacity-50" />
                                <p>Take at least 2 interviews to see your growth curve.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Join Placement Drive */}
                <div className="lg:col-span-1">
                    <JoinDriveCard />
                </div>
            </div>

            {/* Recent Interviews Section */}
            <div className="bg-bg-secondary border border-border-color rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-sora">My Interviews</h2>
                    {interviews.length > 0 && (
                        <span className="text-text-secondary text-sm">{interviews.length} session{interviews.length > 1 ? 's' : ''}</span>
                    )}
                </div>

                {loadingInterviews ? (
                    <div className="py-8 text-center text-text-secondary text-sm animate-pulse">Loading your interviews...</div>
                ) : interviews.length === 0 ? (
                    <div className="py-12 text-center space-y-4">
                        <p className="text-text-secondary text-sm">No interviews yet. Start your first one!</p>
                        <Link href="/dashboard/student/new" className="inline-flex items-center gap-2 bg-accent-blue text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-600 transition-all">
                            <Plus className="w-4 h-4" /> Start Interview
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-text-secondary border-b border-border-color">
                                    <th className="font-medium pb-4">Job Role</th>
                                    <th className="font-medium pb-4">Score</th>
                                    <th className="font-medium pb-4">Verdict</th>
                                    <th className="font-medium pb-4">Date</th>
                                    <th className="font-medium pb-4 text-right">Report</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color/50">
                                {interviews.map(interview => {
                                    const isHidden = interview.drive_id && interview.drives && !interview.drives.results_published;
                                    const score = isHidden ? 0 : (interview.avg_score || 0) * 10;
                                    const { label, cls } = isHidden ? { label: "HIDDEN", cls: "bg-bg-card text-text-secondary border-border-color" } : getVerdict(interview.avg_score || 0);

                                    return (
                                        <tr key={interview.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-4 font-bold">
                                                {interview.role}
                                                {interview.drive_id && <span className="ml-2 text-[10px] uppercase font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded border border-accent-blue/20">Drive</span>}
                                            </td>
                                            <td className="py-4">
                                                {isHidden ? (
                                                    <span className="text-sm font-bold opacity-50">Results Pending</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-12 h-2 bg-bg-card rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${score > 70 ? 'bg-accent-green' : score > 50 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                                                                style={{ width: `${score}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold">{score}%</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
                                            </td>
                                            <td className="py-4 text-sm text-text-secondary">
                                                {new Date(interview.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 text-right">
                                                {isHidden ? (
                                                    <span className="text-xs text-text-secondary px-4 py-2 border border-border-color rounded-lg bg-bg-card font-bold flex items-center justify-center ml-auto w-max">
                                                        Locked
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/dashboard/student/results/${interview.id}`)}
                                                        className="text-accent-blue bg-accent-blue/10 hover:bg-accent-blue hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ml-auto"
                                                    >
                                                        View <ArrowUpRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, trend }: any) {
    return (
        <div className="bg-bg-secondary border border-border-color p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-bg-card border border-border-color">{icon}</div>
                <span className="text-text-secondary text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="text-xs text-accent-green mt-1 font-medium">{trend}</p>
        </div>
    );
}
