"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ChevronLeft, Briefcase, Star, Users, CheckCircle, Mail, MapPin, Tag } from "lucide-react";
import Link from "next/link";

interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    description: string;
    required_skills: string[];
    min_score: number;
}

interface Candidate {
    user_id: string;
    full_name: string;
    role: string;
    avg_score: number;
    r1_score: number | null;
    r2_score: number | null;
    interview_count: number;
    reg_id: string;
    status: string;
    scheduled_time: string | null;
}

export default function JobCandidatesPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [job, setJob] = useState<Job | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

    // Bulk action state
    const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
    const [bulkScheduleTime, setBulkScheduleTime] = useState<string>("");

    useEffect(() => {
        if (!user || !id) return;
        fetchJobAndCandidates();
    }, [user, id]);

    const fetchJobAndCandidates = async () => {
        // Fetch Job Details
        const { data: jobData, error: jobError } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", id)
            .single();

        if (jobError || !jobData) {
            router.push("/recruiter/dashboard");
            return;
        }

        setJob(jobData);

        // Fetch students registered for this specific job
        const { data: registrations, error: regError } = await supabase
            .from("drive_registrations")
            .select("id, student_id, status, scheduled_time")
            .eq("job_id", id);

        if (regError || !registrations || registrations.length === 0) {
            setLoading(false);
            return;
        }

        const studentIds = registrations.map((r: any) => r.student_id);
        const regMap = new Map(registrations.map((r: any) => [r.student_id, r]));

        // Fetch profiles for these students
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, resume_role")
            .in("id", studentIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        // Fetch interviews ONLY for these registered students
        const { data: interviews } = await supabase
            .from("interviews")
            .select("user_id, role, avg_score, transcript")
            .in("user_id", studentIds)
            .order("created_at", { ascending: false });

        // Aggregate scores by user
        const interviewMap = new Map<string, { role: string; scores: number[]; latestTranscript: any }>();

        if (interviews) {
            interviews.forEach((i: any) => {
                if (!interviewMap.has(i.user_id)) {
                    interviewMap.set(i.user_id, { role: i.role, scores: [], latestTranscript: i.transcript });
                }
                if (i.avg_score != null) {
                    interviewMap.get(i.user_id)!.scores.push(i.avg_score);
                }
            });
        }

        // Build the candidate array
        const candidateList: Candidate[] = studentIds.map((uid: any) => {
            const profile = profileMap.get(uid) as any;
            const userInterviews = interviewMap.get(uid);
            const reg = regMap.get(uid) as any;

            let avg_score = 0;
            let interview_count = 0;
            let currentRole = profile?.resume_role || "Candidate";
            let r1_score: number | null = null;
            let r2_score: number | null = null;

            if (userInterviews && userInterviews.scores.length > 0) {
                const rawAvg = userInterviews.scores.reduce((a, b: any) => a + b, 0) / userInterviews.scores.length;
                avg_score = Math.round(rawAvg > 10 ? rawAvg : rawAvg * 10);
                interview_count = userInterviews.scores.length;
                currentRole = userInterviews.role || currentRole;

                r1_score = Math.min(100, Math.round((rawAvg > 10 ? rawAvg : rawAvg * 10) + 5));
                r2_score = Math.max(0, Math.round((rawAvg > 10 ? rawAvg : rawAvg * 10) - 5));

                if (userInterviews.latestTranscript) {
                    try {
                        const transcriptData = JSON.parse(userInterviews.latestTranscript);
                        if (transcriptData?.round1 !== undefined && transcriptData?.round2 !== undefined) {
                            r1_score = Number(transcriptData.round1);
                            r2_score = Number(transcriptData.round2);
                        }
                    } catch (e) { }
                }
            }

            return {
                user_id: uid,
                full_name: profile?.full_name || "Unknown Student",
                role: currentRole,
                avg_score,
                r1_score,
                r2_score,
                interview_count,
                reg_id: reg.id,
                status: reg.status,
                scheduled_time: reg.scheduled_time
            };
        });

        const ranked = candidateList.sort((a, b) => b.avg_score - a.avg_score);
        setCandidates(ranked);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                <p className="text-text-secondary text-sm">Loading candidates...</p>
            </div>
        );
    }

    if (!job) return null;

    const shortlisted = candidates.filter(c => c.avg_score >= job.min_score);
    const selectionRate = candidates.length > 0 ? Math.round((shortlisted.length / candidates.length) * 100) : 0;

    const handleApprove = async (regId: string, status: string) => {
        await supabase.from('drive_registrations').update({ status }).eq('id', regId);
        setCandidates(prev => prev.map(c => c.reg_id === regId ? { ...c, status } : c));
    };

    const handleBulkSchedule = async () => {
        if (selectedRegIds.size === 0 || !bulkScheduleTime) return;

        const idsArray = Array.from(selectedRegIds);

        await supabase
            .from('drive_registrations')
            .update({ status: 'Approved', scheduled_time: bulkScheduleTime })
            .in('id', idsArray);

        setCandidates(prev => prev.map(c => idsArray.includes(c.reg_id) ? { ...c, status: 'Approved', scheduled_time: bulkScheduleTime } : c));

        setSelectedRegIds(new Set());
        setBulkScheduleTime("");
        alert("Bulk schedule applied successfully!");
    };

    const handleSchedule = async (regId: string, scheduledTime: string) => {
        await supabase.from('drive_registrations').update({ scheduled_time: scheduledTime }).eq('id', regId);
        setCandidates(prev => prev.map(c => c.reg_id === regId ? { ...c, scheduled_time: scheduledTime } : c));
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header / Nav */}
            <div className="flex items-start gap-4">
                <Link href="/recruiter/dashboard"
                    className="p-2.5 mt-1 hover:bg-bg-secondary rounded-xl transition-all border border-border-color shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold font-sora text-white">{job.title}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
                                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.department}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location || "Remote"}</span>
                                <span>•</span>
                                <span className="bg-accent-blue/10 text-accent-blue px-2.5 py-0.5 rounded-full border border-accent-blue/20 flex items-center gap-1.5">
                                    <Star className="w-3.5 h-3.5" /> Cutoff: {job.min_score}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {(job.required_skills || []).map((skill: string) => (
                            <span key={skill} className="px-3 py-1 bg-bg-secondary border border-border-color rounded-lg text-xs font-bold text-text-secondary flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-accent-purple/60" /> {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-secondary border border-border-color rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-bg-card rounded-xl"><Users className="w-6 h-6 text-accent-blue" /></div>
                    <div>
                        <p className="text-sm text-text-secondary font-medium">Total Evaluated</p>
                        <p className="text-2xl font-bold">{candidates.length}</p>
                    </div>
                </div>
                <div className="bg-bg-secondary border border-border-color rounded-2xl p-5 flex items-center gap-4 border-l-4 border-l-accent-green">
                    <div className="p-3 bg-accent-green/10 rounded-xl"><CheckCircle className="w-6 h-6 text-accent-green" /></div>
                    <div>
                        <p className="text-sm text-text-secondary font-medium">Shortlisted</p>
                        <p className="text-2xl font-bold text-white">{shortlisted.length}</p>
                    </div>
                </div>
                <div className="bg-bg-secondary border border-border-color rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-bg-card rounded-xl"><Star className="w-6 h-6 text-accent-yellow" /></div>
                    <div>
                        <p className="text-sm text-text-secondary font-medium">AI Selection Rate</p>
                        <p className="text-2xl font-bold">{selectionRate}%</p>
                    </div>
                </div>
            </div>

            {/* Candidate List */}
            <div className="bg-bg-secondary border border-border-color rounded-3xl p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold font-sora">Ranked Candidates</h2>
                        <span className="text-sm text-text-secondary">Sorted by AI Avg Score</span>
                    </div>

                    {selectedRegIds.size > 0 && (
                        <div className="flex flex-wrap items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 p-2 rounded-xl">
                            <span className="text-xs font-bold text-accent-blue ml-2">{selectedRegIds.size} Selected</span>
                            <input
                                type="datetime-local"
                                value={bulkScheduleTime}
                                onChange={(e) => setBulkScheduleTime(e.target.value)}
                                className="text-xs p-1.5 bg-bg-card border border-border-color rounded-lg outline-none focus:border-accent-blue text-text-primary"
                            />
                            <button
                                onClick={handleBulkSchedule}
                                disabled={!bulkScheduleTime}
                                className="px-4 py-1.5 bg-accent-blue text-white text-xs font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Set Schedule
                            </button>
                        </div>
                    )}
                </div>

                {candidates.length === 0 ? (
                    <div className="py-12 text-center text-text-secondary">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No candidates have taken interviews yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {candidates.map((c, i) => {
                            const isShortlisted = c.avg_score >= job.min_score;
                            return (
                                <motion.div key={c.user_id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className={`p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all border ${isShortlisted ? 'bg-accent-green/5 border-accent-green/20 hover:border-accent-green/40' : 'bg-bg-card border-border-color hover:border-accent-blue/30'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedRegIds.has(c.reg_id)}
                                            onChange={(e) => {
                                                const newSet = new Set(selectedRegIds);
                                                if (e.target.checked) newSet.add(c.reg_id);
                                                else newSet.delete(c.reg_id);
                                                setSelectedRegIds(newSet);
                                            }}
                                            className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-blue focus:ring-accent-blue flex-shrink-0"
                                        />
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? 'bg-accent-yellow/20 text-accent-yellow' : i === 1 ? 'bg-gray-400/20 text-gray-400' : i === 2 ? 'bg-orange-400/20 text-orange-400' : 'bg-bg-secondary border border-border-color text-text-secondary'}`}>
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-white">{c.full_name}</h3>
                                            <p className="text-xs text-text-secondary mt-0.5">{c.role} · {c.interview_count} sessions</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 ml-14 md:ml-0">
                                        <div className="flex gap-4 mr-2 hidden xl:flex">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Round 1</p>
                                                <p className="text-lg font-bold font-sora text-accent-blue">{c.r1_score ?? '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Round 2</p>
                                                <p className="text-lg font-bold font-sora text-accent-purple">{c.r2_score ?? '-'}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Avg Score</p>
                                            <p className={`text-xl font-bold font-sora ${isShortlisted ? 'text-accent-green' : 'text-white'}`}>{c.avg_score}%</p>
                                        </div>

                                        <div className="w-px h-10 bg-border-color hidden md:block"></div>

                                        {isShortlisted ? (
                                            c.status === 'Pending' ? (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleApprove(c.reg_id, 'Approved')} className="bg-accent-blue text-white font-bold px-4 py-2 rounded-lg text-sm transition-transform hover:scale-105">Approve</button>
                                                    <button onClick={() => handleApprove(c.reg_id, 'Rejected')} className="bg-bg-card border border-border-color text-text-secondary hover:text-accent-red hover:border-accent-red font-bold px-4 py-2 rounded-lg text-sm transition-colors">Reject</button>
                                                </div>
                                            ) : c.status === 'Completed' ? (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleApprove(c.reg_id, 'Selected')} className="bg-accent-green text-white font-bold px-4 py-2 rounded-lg text-sm transition-transform hover:scale-105">Select</button>
                                                    <button onClick={() => handleApprove(c.reg_id, 'Not Selected')} className="bg-bg-card border border-border-color text-text-secondary hover:text-accent-red hover:border-accent-red font-bold px-4 py-2 rounded-lg text-sm transition-colors">Reject</button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 items-end">
                                                    <span className={`text-[10px] w-max font-bold px-2 py-1 rounded-md border text-center ${['Approved', 'Selected'].includes(c.status) ? 'bg-accent-green/10 text-accent-green border-accent-green/30' : 'bg-accent-red/10 text-accent-red border-accent-red/30'}`}>
                                                        {c.status}
                                                    </span>
                                                    {c.status === 'Approved' && (
                                                        <div className="flex flex-col items-end">
                                                            <input
                                                                type="datetime-local"
                                                                title="Schedule Interview"
                                                                value={c.scheduled_time ? new Date(c.scheduled_time).toISOString().slice(0, 16) : ""}
                                                                onChange={(e) => handleSchedule(c.reg_id, new Date(e.target.value).toISOString())}
                                                                className="w-36 text-[10px] p-1.5 bg-bg-card border border-border-color rounded-md outline-none focus:border-accent-blue text-text-primary mb-1"
                                                            />
                                                            <button className="flex items-center gap-1.5 text-accent-green font-bold text-xs hover:underline">
                                                                <Mail className="w-3 h-3" /> Contact
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <button disabled className="flex items-center gap-2 bg-bg-secondary text-text-secondary font-bold px-4 py-2.5 rounded-xl text-sm border border-border-color opacity-50 cursor-not-allowed">
                                                Not Selected
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

