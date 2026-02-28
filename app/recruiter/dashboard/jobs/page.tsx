"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Building2, MapPin, Briefcase as BriefcaseIcon, Users, Loader2, Trash2, Lock, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Job {
    id: string;
    title: string;
    company_name: string;
    department: string;
    location: string;
    job_code: string;
    min_score: number; // For jobs, min_score is the CGPA cutoff (already used in join route as /10)
    min_10th: number;
    min_12th: number;
    max_backlogs: number;
    allowed_branches: string[];
    results_published: boolean;
    status: string;
    created_at: string;
}

interface ApplicantRow {
    regId: string;
    studentId: string;
    name: string;
    email: string;
    branch: string;
    passingYear: number | null;
    tenth: number | null;
    twelfth: number | null;
    cgpa: number | null;
    backlogs: number | null;
    academicPass: boolean;
    academicReason: string;
    r1Score: number | null;
    r2Score: number | null;
    auditPassed: boolean | null;
    auditReason: string | null;
    finalStatus: string;
    approvalStatus: string;
    scheduledTime: string | null;
}

function buildApplicantRow(
    reg: any,
    profile: any,
    interview: any,
    minCgpa: number,
    min10: number,
    min12: number,
    maxBacklogs: number
): ApplicantRow {
    const tenth = reg.snap_tenth_percent ?? profile?.tenth_percent ?? null;
    const twelfth = reg.snap_twelfth_percent ?? profile?.twelfth_percent ?? null;
    const cgpa = reg.snap_cgpa ?? profile?.grad_cgpa ?? null;
    const backlogs = reg.snap_backlogs ?? profile?.active_backlogs ?? null;

    // For HR jobs, min_cgpa is actually stored as 7.0 (out of 10) in min_score
    const passedCgpa = (cgpa ?? 0) >= minCgpa;
    const passed10 = (tenth ?? 0) >= min10;
    const passed12 = (twelfth ?? 0) >= min12;
    const passedBacklogs = (backlogs ?? 0) <= maxBacklogs;
    const academicPass = passedCgpa && passed10 && passed12 && passedBacklogs;

    let academicReason = academicPass ? "All criteria met" : "";
    if (!passedCgpa) academicReason = `Low CGPA (${cgpa ?? "—"})`;
    else if (!passed10) academicReason = `Low 10th (${tenth ?? "—"}%)`;
    else if (!passed12) academicReason = `Low 12th (${twelfth ?? "—"}%)`;
    else if (!passedBacklogs) academicReason = `${backlogs} Active Backlog(s)`;

    const avgScore = interview?.avg_score ?? null;
    let r1Score = avgScore !== null ? Math.min(100, Math.round(avgScore > 10 ? avgScore : avgScore * 10 + 5)) : null;
    let r2Score = avgScore !== null ? Math.max(0, Math.round(avgScore > 10 ? avgScore : avgScore * 10 - 5)) : null;

    if (interview?.transcript) {
        try {
            const transcriptData = JSON.parse(interview.transcript);
            if (transcriptData?.round1 !== undefined && transcriptData?.round2 !== undefined) {
                r1Score = Number(transcriptData.round1);
                r2Score = Number(transcriptData.round2);
            }
        } catch (e) { }
    }

    const auditFailed = interview?.rejection_reason === "Weak Project Audit";
    const auditPassed = interview !== null ? !auditFailed : null;
    const auditReason = interview?.rejection_reason ?? null;

    let finalStatus = "Pending";
    if (!academicPass) finalStatus = "Ineligible";
    else if (interview?.status === "Screened Out") finalStatus = "Screened Out";
    else if (interview?.status === "Completed") finalStatus = "Hired";

    return {
        regId: reg.id,
        studentId: reg.student_id,
        name: profile?.full_name ?? "—",
        email: profile?.email ?? "—",
        branch: profile?.branch ?? reg.student_branch ?? "—",
        passingYear: profile?.passing_year ?? null,
        tenth, twelfth, cgpa, backlogs,
        academicPass, academicReason,
        r1Score, r2Score, auditPassed, auditReason, finalStatus,
        approvalStatus: reg.status || "Pending",
        scheduledTime: reg.scheduled_time || null,
    };
}

const statusColors: Record<string, string> = {
    Hired: "bg-accent-green/15 text-accent-green border-accent-green/30",
    "Screened Out": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    Ineligible: "bg-accent-red/15 text-accent-red border-accent-red/30",
    Pending: "bg-bg-card text-text-secondary border-border-color",
};

export default function RecruiterJobsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");

    // Expandable logic
    const [expandedJob, setExpandedJob] = useState<string | null>(null);
    const [applicants, setApplicants] = useState<Record<string, ApplicantRow[]>>({});
    const [loadingApplicants, setLoadingApplicants] = useState<string | null>(null);
    const [jobApplicantCounts, setJobApplicantCounts] = useState<Record<string, number>>({});

    // Bulk action state
    const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
    const [bulkScheduleTime, setBulkScheduleTime] = useState<string>("");

    const copyToClipboard = (code: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    useEffect(() => {
        if (!user) return;
        fetchJobs();
    }, [user]);

    async function fetchJobs() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("jobs")
                .select("*")
                .eq("recruiter_id", user?.id)
                .order("created_at", { ascending: false });

            if (data) {
                setJobs(data);

                // Fetch applicant counts for all jobs
                const jobIds = data.map(j => j.id);
                if (jobIds.length > 0) {
                    const { data: counts } = await supabase
                        .from('drive_registrations')
                        .select('job_id')
                        .in('job_id', jobIds);

                    const countMap: Record<string, number> = {};
                    counts?.forEach(c => {
                        countMap[c.job_id] = (countMap[c.job_id] || 0) + 1;
                    });
                    setJobApplicantCounts(countMap);
                }
            }
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (jobId: string, title: string) => {
        if (!confirm(`Delete the "${title}" job drive? This cannot be undone.`)) return;
        setDeletingId(jobId);
        await supabase.from('jobs').delete().eq('id', jobId);
        setJobs(prev => prev.filter(j => j.id !== jobId));
        setDeletingId(null);
    };

    const togglePublishResults = async (jobId: string, currentStatus: boolean) => {
        const confirmMsg = currentStatus
            ? "Hide results from students?"
            : "Publish results? Final status and scores will be visible to all registered students.";
        if (!confirm(confirmMsg)) return;

        const newStatus = !currentStatus;
        const { error } = await supabase.from('jobs').update({ results_published: newStatus }).eq('id', jobId);
        if (error) {
            alert("Failed to update status. Please ensure the migration is applied.");
            console.error(error);
            return;
        }
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, results_published: newStatus } : j));
    };

    const toggleExpandJob = async (job: Job) => {
        if (expandedJob === job.id) {
            setExpandedJob(null);
            setSelectedRegIds(new Set());
            return;
        }
        setExpandedJob(job.id);
        setSelectedRegIds(new Set());

        if (applicants[job.id]) return;

        setLoadingApplicants(job.id);

        // 1. Fetch registrations
        const { data: regData } = await supabase
            .from("drive_registrations")
            .select("*")
            .eq("job_id", job.id)
            .order("registered_at", { ascending: false });

        if (!regData || regData.length === 0) {
            setApplicants(prev => ({ ...prev, [job.id]: [] }));
            setLoadingApplicants(null);
            return;
        }

        const ids = regData.map((r: any) => r.student_id);

        // 2. Fetch profiles
        const { data: profData } = await supabase
            .from("profiles")
            .select("id, full_name, email, grad_cgpa, tenth_percent, twelfth_percent, active_backlogs, branch, passing_year")
            .in("id", ids);
        const profileMap: Record<string, any> = {};
        (profData || []).forEach((p: any) => { profileMap[p.id] = p; });

        // 3. Fetch interviews
        const { data: intData } = await supabase
            .from("interviews")
            .select("user_id, avg_score, status, rejection_reason, transcript")
            .in("user_id", ids)
            .order("created_at", { ascending: false });
        const interviewMap: Record<string, any> = {};
        (intData || []).forEach((i: any) => { if (!interviewMap[i.user_id]) interviewMap[i.user_id] = i; });

        // 4. Build rows
        const rows = regData.map((reg: any) =>
            buildApplicantRow(
                reg, profileMap[reg.student_id], interviewMap[reg.student_id],
                job.min_score ?? 0, job.min_10th ?? 0, job.min_12th ?? 0, job.max_backlogs ?? 999
            )
        );

        setApplicants(prev => ({ ...prev, [job.id]: rows }));
        setLoadingApplicants(null);
    }

    const handleApprove = async (regId: string, status: string) => {
        if (!expandedJob) return;
        await supabase.from('drive_registrations').update({ status }).eq('id', regId);
        setApplicants(prev => {
            const rows = prev[expandedJob] || [];
            return {
                ...prev,
                [expandedJob]: rows.map(r => r.regId === regId ? { ...r, approvalStatus: status } : r)
            };
        });
    };

    const handleSchedule = async (regId: string, scheduledTime: string) => {
        if (!expandedJob) return;
        await supabase.from('drive_registrations').update({ scheduled_time: scheduledTime }).eq('id', regId);
        setApplicants(prev => {
            const rows = prev[expandedJob] || [];
            return {
                ...prev,
                [expandedJob]: rows.map(r => r.regId === regId ? { ...r, scheduledTime } : r)
            };
        });
    };

    const handleBulkSchedule = async () => {
        if (!expandedJob || selectedRegIds.size === 0 || !bulkScheduleTime) return;
        const idsArray = Array.from(selectedRegIds);
        await supabase.from('drive_registrations').update({ status: 'Approved', scheduled_time: bulkScheduleTime }).in('id', idsArray);

        setApplicants(prev => {
            const rows = prev[expandedJob] || [];
            return {
                ...prev,
                [expandedJob]: rows.map(r => idsArray.includes(r.regId) ? { ...r, approvalStatus: 'Approved', scheduledTime: bulkScheduleTime } : r)
            };
        });
        setSelectedRegIds(new Set());
        setBulkScheduleTime("");
        alert("Bulk schedule applied!");
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && job.status === "Active") ||
            (statusFilter === "closed" && job.status === "Closed");
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sora">Job Drive Manager</h1>
                    <p className="text-text-secondary mt-1">Full-funnel applicant tracking for your active listings.</p>
                </div>

                <Link href="/recruiter/create-job"
                    className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent-blue/20">
                    <Plus className="w-5 h-5" /> Post New Job
                </Link>
            </div>

            <div className="bg-bg-secondary border border-border-color rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-card border border-border-color rounded-xl py-3 pl-12 pr-4 outline-none focus:border-accent-blue transition-colors text-sm"
                    />
                </div>
                <select
                    className="bg-bg-card border border-border-color rounded-xl px-4 py-3 outline-none focus:border-accent-blue text-sm min-w-[140px] appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {loading && (
                <div className="py-20 text-center text-text-secondary animate-pulse">Loading jobs...</div>
            )}

            {!loading && filteredJobs.length > 0 && (
                <div className="grid gap-6">
                    {filteredJobs.map((job, index) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-bg-secondary border border-border-color rounded-3xl overflow-hidden"
                        >
                            <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <BriefcaseIcon className="w-6 h-6 text-accent-blue" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg truncate">{job.title}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${job.status !== 'Closed' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-bg-card text-text-secondary border-border-color'}`}>{job.status || 'Active'}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-text-secondary mt-1.5">
                                        <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {job.company_name}</div>
                                        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}</div>
                                        <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {jobApplicantCounts[job.id] || 0} Registered</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="bg-bg-card border border-border-color rounded-xl p-1.5 flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-accent-blue ml-2">{job.job_code}</span>
                                        <button onClick={() => copyToClipboard(job.job_code)} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors text-text-secondary">{copied === job.job_code ? <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" /> : <Copy className="w-3.5 h-3.5" />}</button>
                                    </div>
                                    <button
                                        onClick={() => togglePublishResults(job.id, job.results_published)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${job.results_published ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30' : 'bg-bg-card text-text-secondary border-border-color hover:text-white'}`}
                                    >
                                        {job.results_published ? "Results Public" : "Publish"}
                                    </button>
                                    <button
                                        onClick={() => toggleExpandJob(job)}
                                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${expandedJob === job.id ? 'bg-accent-blue text-white border-accent-blue' : 'bg-bg-card border-border-color hover:border-accent-blue'}`}
                                    >
                                        {expandedJob === job.id ? "Close" : "Candidates"}
                                    </button>
                                    <button onClick={() => handleDelete(job.id, job.title)} className="p-2.5 text-text-secondary hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* Expanded Table Section */}
                            <AnimatePresence>
                                {expandedJob === job.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-border-color bg-bg-card/30"
                                    >
                                        <div className="p-6 overflow-x-auto">
                                            {loadingApplicants === job.id ? (
                                                <div className="py-12 text-center text-text-secondary animate-pulse text-sm">Loading applicants...</div>
                                            ) : !applicants[job.id]?.length ? (
                                                <div className="py-12 text-center text-text-secondary text-sm">No students have registered yet.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex gap-2">
                                                            <Chip label={`${applicants[job.id].length} Applied`} color="blue" />
                                                            <Chip label={`${applicants[job.id].filter(r => r.academicPass).length} Qualified`} color="green" />
                                                        </div>
                                                        {selectedRegIds.size > 0 && (
                                                            <div className="flex items-center gap-2 bg-accent-blue/10 p-1.5 rounded-lg border border-accent-blue/20">
                                                                <input type="datetime-local" value={bulkScheduleTime} onChange={e => setBulkScheduleTime(e.target.value)} className="text-[10px] p-1.5 bg-bg-card border border-border-color rounded-md" />
                                                                <button onClick={handleBulkSchedule} className="px-3 py-1.5 bg-accent-blue text-white text-[10px] font-bold rounded-lg">Batch Schedule</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                                        <thead>
                                                            <tr className="bg-bg-secondary/50 text-text-secondary font-bold uppercase tracking-wider">
                                                                <th className="p-3 rounded-l-lg w-8 invisible md:visible">ID</th>
                                                                <th className="p-3">Candidate</th>
                                                                <th className="p-3">Gate</th>
                                                                <th className="p-3">Scores</th>
                                                                <th className="p-3">Audit</th>
                                                                <th className="p-3">Action</th>
                                                                <th className="p-3 text-right rounded-r-lg">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border-color/10">
                                                            {applicants[job.id].map((row, i) => (
                                                                <tr key={row.regId} className="group hover:bg-bg-primary/20 transition-colors">
                                                                    <td className="p-3">
                                                                        <input type="checkbox" checked={selectedRegIds.has(row.regId)} onChange={e => {
                                                                            const newSet = new Set(selectedRegIds);
                                                                            if (e.target.checked) newSet.add(row.regId); else newSet.delete(row.regId);
                                                                            setSelectedRegIds(newSet);
                                                                        }} />
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <div className="font-bold">{row.name}</div>
                                                                        <div className="text-[10px] opacity-60">{row.email}</div>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span className={`font-bold ${row.academicPass ? 'text-accent-green' : 'text-accent-red'}`}>{row.academicPass ? 'PASS' : 'FAIL'}</span>
                                                                        {!row.academicPass && <div className="text-[9px] opacity-60">{row.academicReason}</div>}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <div className="flex gap-3">
                                                                            <div><span className="opacity-50">R1:</span> {row.r1Score ?? '—'}%</div>
                                                                            <div><span className="opacity-50">R2:</span> {row.r2Score ?? '—'}%</div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        {row.auditPassed ? <span className="text-accent-green font-bold">PASS</span> : row.auditPassed === false ? <span className="text-accent-red font-bold">FAIL</span> : '—'}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        {row.approvalStatus === 'Pending' ? (
                                                                            <div className="flex gap-2">
                                                                                <button onClick={() => handleApprove(row.regId, "Approved")} className="px-2 py-1 bg-accent-blue text-white rounded font-bold">Accept</button>
                                                                                <button onClick={() => handleApprove(row.regId, "Rejected")} className="px-2 py-1 bg-bg-card border border-border-color rounded font-bold">Reject</button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold w-fit ${['Approved', 'Selected'].includes(row.approvalStatus) ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>{row.approvalStatus}</span>
                                                                                {row.approvalStatus === 'Approved' && (
                                                                                    <input type="datetime-local" value={row.scheduledTime ? new Date(row.scheduledTime).toISOString().slice(0, 16) : ""} onChange={e => handleSchedule(row.regId, new Date(e.target.value).toISOString())} className="text-[9px] bg-bg-card border border-border-color rounded p-1" />
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-3 text-right font-bold"><span className={`px-2 py-1 rounded-md text-[9px] border ${statusColors[row.finalStatus] || statusColors.Pending}`}>{row.finalStatus}</span></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Chip({ label, color }: any) {
    const cls: any = {
        blue: "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
        green: "bg-accent-green/10 text-accent-green border-accent-green/20"
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls[color]}`}>{label}</span>;
}
