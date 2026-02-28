"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Plus, Users, Briefcase, BarChart3, Star, TrendingUp, Trophy, Tag, Link as LinkIcon, Check, Copy, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    required_skills: string[];
    min_score: number;
    created_at: string;
}

interface Candidate {
    user_id: string;
    full_name: string;
    role: string;
    avg_score: number;
    interview_count: number;
}

export default function RecruiterDashboard() {
    const { profile, user } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [totalCandidates, setTotalCandidates] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/join/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        // Fetch this recruiter's jobs
        const { data: jobsData } = await supabase
            .from("jobs")
            .select("*")
            .eq("recruiter_id", user?.id)
            .order("created_at", { ascending: false });

        if (jobsData) {
            // Fetch registration counts for these jobs
            const jobIds = jobsData.map(j => j.id);
            if (jobIds.length > 0) {
                const { data: counts } = await supabase
                    .from('drive_registrations')
                    .select('job_id')
                    .in('job_id', jobIds);

                const countMap: Record<string, number> = {};
                counts?.forEach((c: any) => {
                    countMap[c.job_id] = (countMap[c.job_id] || 0) + 1;
                });

                const updatedJobs = jobsData.map((j: any) => ({
                    ...j,
                    candidates_count: countMap[j.id] || 0
                }));
                setJobs(updatedJobs);
            } else {
                setJobs([]);
            }
        }

        // Fetch global talent leaderboard
        const { data: interviewData } = await supabase
            .from("interviews")
            .select("user_id, role, avg_score")
            .order("avg_score", { ascending: false });

        if (interviewData) {
            setTotalCandidates(new Set(interviewData.map((i: any) => i.user_id)).size);

            // Aggregate by user_id — best avg score per user
            const map = new Map<string, { role: string; scores: number[] }>();
            interviewData.forEach((i: any) => {
                if (!map.has(i.user_id)) map.set(i.user_id, { role: i.role, scores: [] });
                map.get(i.user_id)!.scores.push(i.avg_score || 0);
            });

            // Fetch profile names for top users
            const userIds = Array.from(map.keys()).slice(0, 10);
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds);

            const nameMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || []);
            const ranked: Candidate[] = Array.from(map.entries()).map(([uid, v]) => ({
                user_id: uid,
                full_name: (nameMap.get(uid) as string) || "Anonymous",
                role: v.role,
                avg_score: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length * 10),
                interview_count: v.scores.length,
            })).sort((a, b) => b.avg_score - a.avg_score).slice(0, 8);

            setCandidates(ranked);
        }
        setLoading(false);
    };

    const shortlisted = candidates.filter(c => c.avg_score >= 75).length;
    const avgSelectionRate = candidates.length
        ? Math.round((shortlisted / candidates.length) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-sora">Smart Hiring Dashboard</h1>
                    <p className="text-text-secondary mt-1">
                        {profile?.company_name || "Your Company"} · Find verified talent
                    </p>
                </div>
                <Link href="/recruiter/create-job"
                    className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-accent-blue/20">
                    <Plus className="w-5 h-5" /> Create New Job Opening
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Briefcase className="w-5 h-5 text-accent-blue" />} label="Active Jobs" value={jobs.length.toString()} />
                <StatCard icon={<Users className="w-5 h-5 text-accent-purple" />} label="Candidates in Pool" value={totalCandidates.toString()} />
                <StatCard icon={<Trophy className="w-5 h-5 text-accent-green" />} label="Shortlisted (≥75%)" value={shortlisted.toString()} />
                <StatCard icon={<BarChart3 className="w-5 h-5 text-accent-yellow" />} label="Avg. Selection Rate" value={`${avgSelectionRate}%`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Talent Leaderboard */}
                <div className="bg-bg-secondary border border-border-color rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Trophy className="w-5 h-5 text-accent-yellow" />
                        <h2 className="text-lg font-bold font-sora">Global Talent Rank</h2>
                        <span className="ml-auto text-xs text-text-secondary">All students · sorted by score</span>
                    </div>
                    {loading ? (
                        <div className="py-8 text-center text-text-secondary text-sm animate-pulse">Loading leaderboard...</div>
                    ) : candidates.length === 0 ? (
                        <div className="py-8 text-center text-text-secondary text-sm">No interview data yet</div>
                    ) : (
                        <div className="space-y-3">
                            {candidates.map((c, i) => (
                                <motion.div key={c.user_id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-card transition-all group cursor-pointer border border-transparent hover:border-border-color">
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-accent-yellow/20 text-accent-yellow' : i === 1 ? 'bg-gray-400/20 text-gray-400' : i === 2 ? 'bg-orange-400/20 text-orange-400' : 'bg-bg-card text-text-secondary'}`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate group-hover:text-accent-blue transition-colors">{c.full_name}</p>
                                        <p className="text-xs text-text-secondary truncate">{c.role} · {c.interview_count} session{c.interview_count > 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`text-sm font-bold ${c.avg_score >= 75 ? 'text-accent-green' : c.avg_score >= 50 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                                            {c.avg_score}%
                                        </span>
                                    </div>
                                    {c.avg_score >= 75 && (
                                        <span className="px-2 py-0.5 bg-accent-green/10 border border-accent-green/20 text-accent-green text-[9px] font-bold rounded-full uppercase">
                                            Shortlist
                                        </span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Active Job Openings */}
                <div className="bg-bg-secondary border border-border-color rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Briefcase className="w-5 h-5 text-accent-blue" />
                        <h2 className="text-lg font-bold font-sora">Your Job Openings</h2>
                    </div>
                    {loading ? (
                        <div className="py-8 text-center text-text-secondary text-sm animate-pulse">Loading jobs...</div>
                    ) : jobs.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <p className="text-text-secondary text-sm">No jobs posted yet.</p>
                            <Link href="/recruiter/create-job"
                                className="inline-flex items-center gap-2 bg-accent-blue text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-600 transition-all">
                                <Plus className="w-4 h-4" /> Post First Job
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map((job, i) => (
                                <motion.div key={job.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="p-5 bg-bg-card border border-border-color rounded-2xl hover:border-accent-blue/30 transition-all group flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-base group-hover:text-accent-blue transition-colors">{job.title}</h3>
                                            <p className="text-xs text-text-secondary mt-0.5">{job.department} · {job.location || "Remote"}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[10px] font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full border border-accent-blue/20 flex items-center gap-1">
                                                <Star className="w-3 h-3" /> Min Score ≥{job.min_score}%
                                            </span>
                                            <button
                                                onClick={() => copyLink(job.id)}
                                                className="text-[10px] font-bold text-text-secondary hover:text-white flex items-center gap-1 bg-bg-secondary px-2 py-1 rounded-lg border border-border-color transition-colors"
                                                title="Copy invite link for students"
                                            >
                                                {copiedId === job.id ? <Check className="w-3 h-3 text-accent-green" /> : <LinkIcon className="w-3 h-3" />}
                                                {copiedId === job.id ? "Copied" : "Copy Link"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(job.required_skills || []).slice(0, 5).map((s: string) => (
                                            <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-bg-secondary border border-border-color rounded-lg text-[10px] font-bold text-text-secondary">
                                                <Tag className="w-3 h-3 text-accent-blue/50" /> {s}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="pt-4 mt-auto border-t border-border-color">
                                        <Link href={`/recruiter/jobs/${job.id}`}
                                            className="flex items-center justify-between text-sm font-bold text-accent-blue hover:text-blue-400 transition-colors w-full group/btn"
                                        >
                                            View Candidates
                                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: any) {
    return (
        <div className="bg-bg-secondary border border-border-color p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-bg-card">{icon}</div>
                <span className="text-text-secondary text-sm font-medium">{label}</span>
            </div>
            <span className="text-3xl font-bold">{value}</span>
        </div>
    );
}
