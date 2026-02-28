"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus, ClipboardList } from "lucide-react";
import Link from "next/link";

interface Interview {
    id: string;
    role: string;
    avg_score: number;
    created_at: string;
}

export default function MyInterviewsPage() {
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        const fetch = async () => {
            const { data } = await supabase
                .from("interviews")
                .select("id, role, avg_score, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            setInterviews(data || []);
            setLoading(false);
        };
        fetch();
    }, [user]);

    const getVerdict = (score: number) => {
        const s = score * 10;
        if (s >= 75) return { label: "READY", cls: "bg-accent-green/10 text-accent-green border-accent-green/20" };
        if (s >= 50) return { label: "ALMOST", cls: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20" };
        return { label: "NEEDS WORK", cls: "bg-accent-red/10 text-accent-red border-accent-red/20" };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-bg-secondary rounded-2xl border border-border-color">
                        <ClipboardList className="text-accent-blue w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-sora">My Interviews</h1>
                        <p className="text-text-secondary text-sm">All your past mock interview sessions</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/student/new"
                    className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm"
                >
                    <Plus className="w-4 h-4" /> New Interview
                </Link>
            </div>

            {loading ? (
                <div className="py-16 text-center text-text-secondary animate-pulse">Loading...</div>
            ) : interviews.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-bg-secondary rounded-3xl border border-border-color">
                    <p className="text-text-secondary">No interviews yet. Start your first mock interview!</p>
                    <Link href="/dashboard/student/new" className="inline-flex items-center gap-2 bg-accent-blue text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-600 transition-all">
                        <Plus className="w-4 h-4" /> Start Interview
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {interviews.map((interview, i) => {
                        const score = (interview.avg_score || 0) * 10;
                        const { label, cls } = getVerdict(interview.avg_score || 0);
                        return (
                            <motion.div
                                key={interview.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center justify-between p-5 bg-bg-secondary border border-border-color rounded-2xl hover:border-accent-blue/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center font-bold text-accent-blue text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold group-hover:text-accent-blue transition-colors">{interview.role}</h3>
                                        <p className="text-xs text-text-secondary">
                                            {new Date(interview.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-bg-card rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${score > 70 ? 'bg-accent-green' : score > 50 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold">{score}%</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
                                    <button
                                        onClick={() => router.push(`/dashboard/student/results/${interview.id}`)}
                                        className="flex items-center gap-1 text-accent-blue bg-accent-blue/10 hover:bg-accent-blue hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                    >
                                        View <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
