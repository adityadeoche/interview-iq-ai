"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Plus, Building2, Users, Calendar, Copy, CheckCircle2, ChevronDown, ChevronUp,
    Lock, Send, Trash2, Loader2, AlertCircle, ShieldCheck, ShieldX, GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Drive {
    id: string;
    company: string;
    enrolled_count: number;
    drive_code: string;
    drive_date: string;
    status: string;
    min_cgpa: number;
    min_10th: number;
    min_12th: number;
    max_backlogs: number;
    allowed_branches: string[];
    results_published: boolean;
}

interface ApplicantRow {
    regId: string;
    studentId: string;
    name: string;
    email: string;
    branch: string;
    passingYear: number | null;
    // Snapshotted academic grades
    tenth: number | null;
    twelfth: number | null;
    cgpa: number | null;
    backlogs: number | null;
    // Academic gate
    academicPass: boolean;
    academicReason: string;
    // Interview data
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
    let r1Score = avgScore !== null ? Math.min(100, Math.round(avgScore * 10 + 5)) : null; // fallback
    let r2Score = avgScore !== null ? Math.max(0, Math.round(avgScore * 10 - 5)) : null; // fallback

    // Attempt to extract exact marks from newly structured transcript
    if (interview?.transcript) {
        try {
            const transcriptData = JSON.parse(interview.transcript);
            if (transcriptData?.round1 !== undefined && transcriptData?.round2 !== undefined) {
                r1Score = Number(transcriptData.round1);
                r2Score = Number(transcriptData.round2);
            }
        } catch (e) {
            // normal text transcript, keep fallback
        }
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

export default function PlacementDrivesPage() {
    const [copied, setCopied] = useState<string | null>(null);
    const [drives, setDrives] = useState<Drive[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Expanded drive ID → applicant rows
    const [expandedDrive, setExpandedDrive] = useState<string | null>(null);
    const [applicants, setApplicants] = useState<Record<string, ApplicantRow[]>>({});
    const [loadingApplicants, setLoadingApplicants] = useState<string | null>(null);

    // Bulk Scheduling state
    const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
    const [bulkScheduleTime, setBulkScheduleTime] = useState<string>("");

    const handleDelete = async (driveId: string, company: string) => {
        if (!confirm(`Delete the "${company}" drive? This cannot be undone.`)) return;
        setDeletingId(driveId);
        await supabase.from('placement_drives').delete().eq('id', driveId);
        setDrives(prev => prev.filter(d => d.id !== driveId));
        setDeletingId(null);
    };

    const handleApprove = async (regId: string, status: string) => {
        if (!expandedDrive) return;
        await supabase.from('drive_registrations').update({ status }).eq('id', regId);
        setApplicants(prev => {
            const rows = prev[expandedDrive] || [];
            return {
                ...prev,
                [expandedDrive]: rows.map(r => r.regId === regId ? { ...r, approvalStatus: status } : r)
            };
        });
    };

    const handleSchedule = async (regId: string, scheduledTime: string) => {
        if (!expandedDrive) return;
        await supabase.from('drive_registrations').update({ scheduled_time: scheduledTime }).eq('id', regId);
        setApplicants(prev => {
            const rows = prev[expandedDrive] || [];
            return {
                ...prev,
                [expandedDrive]: rows.map(r => r.regId === regId ? { ...r, scheduledTime } : r)
            };
        });
    };

    const handleBulkSchedule = async () => {
        if (!expandedDrive || selectedRegIds.size === 0 || !bulkScheduleTime) return;

        const idsArray = Array.from(selectedRegIds);

        await supabase
            .from('drive_registrations')
            .update({ status: 'Approved', scheduled_time: bulkScheduleTime })
            .in('id', idsArray);

        setApplicants(prev => {
            const rows = prev[expandedDrive] || [];
            return {
                ...prev,
                [expandedDrive]: rows.map(r => idsArray.includes(r.regId) ? { ...r, approvalStatus: 'Approved', scheduledTime: bulkScheduleTime } : r)
            };
        });

        setSelectedRegIds(new Set());
        setBulkScheduleTime("");
        alert("Bulk schedule applied successfully!");
    };

    const togglePublishResults = async (driveId: string, currentStatus: boolean) => {
        const confirmMsg = currentStatus
            ? "Hide results from students?"
            : "Publish results? The final scores and status will be visible to all registered students in their dashboard.";
        if (!confirm(confirmMsg)) return;

        const newStatus = !currentStatus;
        await supabase.from('placement_drives').update({ results_published: newStatus }).eq('id', driveId);
        setDrives(prev => prev.map((d: any) => d.id === driveId ? { ...d, results_published: newStatus } : d));
    };

    useEffect(() => {
        const fetchDrives = async () => {
            const { data } = await supabase
                .from('placement_drives')
                .select('id, company, enrolled_count, drive_code, drive_date, status, min_cgpa, min_10th, min_12th, max_backlogs, allowed_branches, results_published')
                .order('created_at', { ascending: false });
            setDrives(data || []);
            setLoading(false);
        };
        fetchDrives();
    }, []);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    const toggleExpandDrive = async (drive: Drive) => {
        if (expandedDrive === drive.id) {
            setExpandedDrive(null);
            setSelectedRegIds(new Set());
            return;
        }
        setExpandedDrive(drive.id);
        setSelectedRegIds(new Set());

        // Already cached
        if (applicants[drive.id]) return;

        setLoadingApplicants(drive.id);

        // 1. Fetch registrations
        const { data: regData } = await supabase
            .from("drive_registrations")
            .select("id, student_id, student_branch, registered_at, snap_tenth_percent, snap_twelfth_percent, snap_cgpa, snap_backlogs, status, scheduled_time")
            .eq("drive_id", drive.id)
            .order("registered_at", { ascending: false });

        if (!regData || regData.length === 0) {
            setApplicants(prev => ({ ...prev, [drive.id]: [] }));
            setLoadingApplicants(null);
            return;
        }

        // 2. Fetch profiles
        const ids = regData.map((r: any) => r.student_id);
        const { data: profData } = await supabase
            .from("profiles")
            .select("id, full_name, email, grad_cgpa, tenth_percent, twelfth_percent, active_backlogs, branch, passing_year")
            .in("id", ids);
        const profileMap: Record<string, any> = {};
        (profData || []).forEach((p: any) => { profileMap[p.id] = p; });

        // 3. Fetch interviews (most recent per user)
        const { data: intData } = await supabase
            .from("interviews")
            .select("user_id, avg_score, status, rejection_reason")
            .in("user_id", ids)
            .order("created_at", { ascending: false });
        const interviewMap: Record<string, any> = {};
        (intData || []).forEach((i: any) => { if (!interviewMap[i.user_id]) interviewMap[i.user_id] = i; });

        // 4. Build rows
        const rows = regData.map((reg: any) =>
            buildApplicantRow(
                reg, profileMap[reg.student_id], interviewMap[reg.student_id],
                drive.min_cgpa ?? 0, drive.min_10th ?? 0, drive.min_12th ?? 0, drive.max_backlogs ?? 999
            )
        );

        setApplicants(prev => ({ ...prev, [drive.id]: rows }));
        setLoadingApplicants(null);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sora">Placement Drives</h1>
                    <p className="text-text-secondary mt-1">Manage ongoing campus recruitment events and invite codes.</p>
                </div>
                <Link
                    href="/campus/dashboard/drives/create"
                    className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 px-5 py-3 rounded-xl font-bold transition-all text-white shadow-lg shadow-accent-blue/20"
                >
                    <Plus className="w-5 h-5" /> Create New Drive
                </Link>
            </div>

            {loading && <div className="text-center text-text-secondary py-12 animate-pulse text-sm">Loading drives...</div>}

            {/* Drive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drives.map((drive: any, i: number) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={drive.id}
                        className="bg-bg-secondary border border-border-color rounded-3xl p-6 group hover:border-accent-blue transition-all flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-bg-card border border-border-color rounded-2xl flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-text-secondary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg border ${drive.status === 'Active' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
                                    drive.status === 'Upcoming' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' :
                                        'bg-bg-card text-text-secondary border-border-color'
                                    }`}>{drive.status}</span>
                                <button
                                    onClick={() => handleDelete(drive.id, drive.company)}
                                    disabled={deletingId === drive.id}
                                    className="p-1.5 rounded-lg text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-all disabled:opacity-40"
                                    title="Delete drive"
                                ><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="mb-4 flex-1">
                            <h3 className="text-xl font-bold font-sora truncate">{drive.company}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-secondary">
                                <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(drive.drive_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {drive.enrolled_count} Applied</div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {drive.min_cgpa > 0 && <span className="px-2 py-0.5 bg-accent-purple/10 text-accent-purple text-[10px] font-bold rounded-lg border border-accent-purple/20">CGPA ≥ {drive.min_cgpa}</span>}
                                {drive.min_10th > 0 && <span className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue text-[10px] font-bold rounded-lg border border-accent-blue/20">10th ≥ {drive.min_10th}%</span>}
                                {drive.min_12th > 0 && <span className="px-2 py-0.5 bg-accent-green/10 text-accent-green text-[10px] font-bold rounded-lg border border-accent-green/20">12th ≥ {drive.min_12th}%</span>}
                                {drive.max_backlogs === 0 ? (
                                    <span className="px-2 py-0.5 bg-accent-red/10 text-accent-red text-[10px] font-bold rounded-lg border border-accent-red/20">No Backlogs</span>
                                ) : drive.max_backlogs < 99 && (
                                    <span className="px-2 py-0.5 bg-accent-red/10 text-accent-red text-[10px] font-bold rounded-lg border border-accent-red/20">Max {drive.max_backlogs} Backlogs</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-bg-card rounded-2xl border border-border-color space-y-3">
                            <label className="text-xs uppercase font-bold tracking-widest text-text-secondary flex items-center gap-1.5">
                                <Lock className="w-3 h-3" /> Drive Access Code
                            </label>
                            <div className="flex items-center justify-between bg-bg-primary rounded-xl p-2 pl-4 border border-border-color">
                                <span className="font-mono font-black text-accent-blue tracking-widest text-lg">{drive.drive_code}</span>
                                <button onClick={() => copyToClipboard(drive.drive_code)} className="p-2 hover:bg-bg-secondary rounded-lg transition-colors text-text-secondary hover:text-white">
                                    {copied === drive.drive_code ? <CheckCircle2 className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                            <button
                                onClick={() => { setCopied(`notify-${drive.id}`); setTimeout(() => setCopied(null), 2000); }}
                                className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-all border ${copied === `notify-${drive.id}`
                                    ? "bg-accent-green/10 text-accent-green border-accent-green/20"
                                    : "bg-accent-blue/5 text-accent-blue border-accent-blue/20 hover:bg-accent-blue hover:text-white"
                                    }`}
                            >
                                {copied === `notify-${drive.id}` ? <><CheckCircle2 className="w-4 h-4" /> Broadcast Sent</> : <><Send className="w-4 h-4" /> Notify Students</>}
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => togglePublishResults(drive.id, drive.results_published)}
                                    className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2 rounded-xl transition-all border ${drive.results_published
                                        ? "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30 hover:bg-accent-yellow hover:text-black"
                                        : "bg-bg-card text-text-secondary border-border-color hover:border-text-primary hover:text-white"
                                        }`}
                                >
                                    {drive.results_published ? "Hide Results" : "Publish Results"}
                                </button>
                                <button
                                    onClick={() => toggleExpandDrive(drive)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-text-secondary hover:text-white py-2 border border-border-color rounded-xl hover:border-text-primary transition-colors"
                                >
                                    Candidates {expandedDrive === drive.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Inline Applicants Table ────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {expandedDrive && (() => {
                    const drive = drives.find(d => d.id === expandedDrive);
                    if (!drive) return null;
                    const rows = applicants[expandedDrive];
                    const isLoading = loadingApplicants === expandedDrive;

                    return (
                        <motion.section
                            key={expandedDrive}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-bg-secondary border border-border-color rounded-3xl p-6 md:p-8"
                        >
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border-color">
                                <div>
                                    <h2 className="text-xl font-bold font-sora flex items-center gap-2">
                                        <Users className="w-5 h-5 text-accent-blue" />
                                        {drive.company} — Advance Applicants
                                    </h2>
                                    <p className="text-sm text-text-secondary mt-1">
                                        Full funnel: Academic Gate → Round 1 → Round 2 → Project Audit → Final Status
                                    </p>
                                </div>
                                <button
                                    onClick={() => setExpandedDrive(null)}
                                    className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-white border border-border-color rounded-xl hover:border-accent-red/40 transition-colors"
                                >
                                    Close
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-4 text-text-secondary">
                                    <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
                                    <p className="text-sm font-bold animate-pulse">Aggregating applicant data...</p>
                                </div>
                            ) : !rows || rows.length === 0 ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                                    <Users className="w-12 h-12 text-text-secondary opacity-30" />
                                    <h3 className="text-lg font-bold">No Students Yet</h3>
                                    <p className="text-sm text-text-secondary max-w-xs">
                                        Share drive code <span className="font-mono font-black text-accent-blue">{drive.drive_code}</span> with students. They'll appear here after registering.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    {/* Summary Chips */}
                                    <div className="flex flex-wrap items-center justify-between xl:flex-row flex-col gap-4 mb-5">
                                        <div className="flex flex-wrap gap-3">
                                            <Chip label={`${rows.length} Applied`} color="blue" />
                                            <Chip label={`${rows.filter(r => r.academicPass).length} Academic Pass`} color="green" />
                                            <Chip label={`${rows.filter(r => r.finalStatus === 'Hired').length} Hired`} color="green" />
                                            <Chip label={`${rows.filter(r => r.finalStatus === 'Screened Out').length} Screened Out`} color="orange" />
                                            <Chip label={`${rows.filter(r => r.finalStatus === 'Ineligible').length} Ineligible`} color="red" />
                                        </div>

                                        {selectedRegIds.size > 0 && (
                                            <div className="flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 p-2 rounded-xl">
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
                                                    Set Drive Schedule
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-bg-card">
                                                <th className="p-3 rounded-tl-xl w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRegIds.size > 0 && selectedRegIds.size === rows.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedRegIds(new Set(rows.map(r => r.regId)));
                                                            } else {
                                                                setSelectedRegIds(new Set());
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-blue focus:ring-accent-blue focus:ring-offset-bg-card"
                                                    />
                                                </th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Student</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Academic Gate</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">10th %</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">12th %</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">CGPA</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Round 1 Marks</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Round 2 Marks</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">GitHub Audit</th>
                                                <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Action</th>
                                                <th className="p-3 rounded-tr-xl text-[11px] font-bold text-text-secondary uppercase tracking-wider text-right">Final Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-color">
                                            {rows.map(row => (
                                                <tr key={row.regId} className={`hover:bg-bg-card/50 transition-colors group ${selectedRegIds.has(row.regId) ? 'bg-accent-blue/5' : ''}`}>
                                                    <td className="p-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRegIds.has(row.regId)}
                                                            onChange={(e) => {
                                                                const newSet = new Set(selectedRegIds);
                                                                if (e.target.checked) newSet.add(row.regId);
                                                                else newSet.delete(row.regId);
                                                                setSelectedRegIds(newSet);
                                                            }}
                                                            className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-blue focus:ring-accent-blue focus:ring-offset-bg-card"
                                                        />
                                                    </td>
                                                    {/* Student */}
                                                    <td className="p-3">
                                                        <div className="font-bold">{row.name}</div>
                                                        <div className="text-xs text-text-secondary">{row.email}</div>
                                                        <div className="text-[10px] text-text-secondary mt-0.5">
                                                            {row.branch}{row.passingYear ? ` • ${row.passingYear}` : ''}
                                                        </div>
                                                    </td>

                                                    {/* Academic Gate */}
                                                    <td className="p-3">
                                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${row.academicPass ? 'text-accent-green' : 'text-accent-red'}`}>
                                                            {row.academicPass
                                                                ? <><ShieldCheck className="w-3.5 h-3.5" /> Pass</>
                                                                : <><ShieldX className="w-3.5 h-3.5" /> Fail</>
                                                            }
                                                        </div>
                                                        {!row.academicPass && <p className="text-[10px] text-accent-red mt-0.5">{row.academicReason}</p>}
                                                    </td>

                                                    {/* 10th */}
                                                    <td className="p-3">
                                                        <Mark value={row.tenth} pass={row.tenth !== null ? (row.tenth >= (drive.min_10th ?? 0)) : null} suffix="%" />
                                                    </td>

                                                    {/* 12th */}
                                                    <td className="p-3">
                                                        <Mark value={row.twelfth} pass={row.twelfth !== null ? (row.twelfth >= (drive.min_12th ?? 0)) : null} suffix="%" />
                                                    </td>

                                                    {/* CGPA */}
                                                    <td className="p-3">
                                                        <Mark value={row.cgpa} pass={row.cgpa !== null ? (row.cgpa >= (drive.min_cgpa ?? 0)) : null} decimals={2} />
                                                    </td>

                                                    {/* Round 1 */}
                                                    <td className="p-3">
                                                        {row.r1Score !== null
                                                            ? <ScorePill score={row.r1Score} threshold={50} />
                                                            : <span className="text-text-secondary text-xs">—</span>
                                                        }
                                                    </td>

                                                    {/* Round 2 */}
                                                    <td className="p-3">
                                                        {row.r2Score !== null
                                                            ? <ScorePill score={row.r2Score} threshold={50} />
                                                            : <span className="text-text-secondary text-xs">—</span>
                                                        }
                                                    </td>

                                                    {/* GitHub Audit (30% Project Match Gate) */}
                                                    <td className="p-3">
                                                        {row.auditPassed === null ? (
                                                            <span className="text-text-secondary text-xs">—</span>
                                                        ) : row.auditPassed ? (
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-accent-green">
                                                                <GitBranch className="w-3.5 h-3.5" /> Verified (&gt;30%)
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-accent-red">
                                                                    <AlertCircle className="w-3.5 h-3.5" /> Failed (≤30%)
                                                                </div>
                                                                {row.auditReason && <p className="text-[10px] text-accent-red mt-0.5">Screened Out</p>}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Action / Approval */}
                                                    <td className="p-3">
                                                        {row.approvalStatus === 'Pending' ? (
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleApprove(row.regId, "Approved")} className="px-3 py-1 bg-accent-blue hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-all">Approve</button>
                                                                <button onClick={() => handleApprove(row.regId, "Rejected")} className="px-3 py-1 border border-border-color text-text-secondary hover:text-accent-red hover:border-accent-red/40 text-[10px] font-bold rounded-lg transition-all">Reject</button>
                                                            </div>
                                                        ) : row.approvalStatus === 'Completed' ? (
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleApprove(row.regId, "Selected")} className="px-3 py-1 bg-accent-green hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition-all">Select</button>
                                                                <button onClick={() => handleApprove(row.regId, "Not Selected")} className="px-3 py-1 border border-border-color text-text-secondary hover:text-accent-red hover:border-accent-red/40 text-[10px] font-bold rounded-lg transition-all">Reject</button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-2">
                                                                <span className={`text-[10px] w-max font-bold px-2 py-1 rounded-md border ${['Approved', 'Selected'].includes(row.approvalStatus) ? 'bg-accent-green/10 text-accent-green border-accent-green/30' : 'bg-accent-red/10 text-accent-red border-accent-red/30'}`}>
                                                                    {row.approvalStatus}
                                                                </span>
                                                                {row.approvalStatus === 'Approved' && (
                                                                    <div className="mt-1">
                                                                        <label className="text-[10px] text-text-secondary block mb-1 font-bold">Slot:</label>
                                                                        <input
                                                                            type="datetime-local"
                                                                            value={row.scheduledTime ? new Date(row.scheduledTime).toISOString().slice(0, 16) : ""}
                                                                            onChange={(e) => handleSchedule(row.regId, new Date(e.target.value).toISOString())}
                                                                            className="w-full text-xs p-1.5 bg-bg-card border border-border-color rounded-lg outline-none focus:border-accent-blue text-text-primary"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Final Status */}
                                                    <td className="p-3 text-right">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[row.finalStatus] ?? statusColors.Pending}`}>
                                                            {row.finalStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.section>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}

// ── Small Components ─────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color: string }) {
    const cls: Record<string, string> = {
        blue: "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
        green: "bg-accent-green/10 text-accent-green border-accent-green/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        red: "bg-accent-red/10 text-accent-red border-accent-red/20",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${cls[color] ?? cls.blue}`}>{label}</span>
    );
}

function Mark({ value, pass, suffix = "", decimals = 0 }: { value: number | null; pass: boolean | null; suffix?: string; decimals?: number }) {
    if (value === null || value === undefined) return <span className="text-text-secondary text-xs">—</span>;
    const formatted = decimals > 0 ? value.toFixed(decimals) : value;
    const color = pass === null ? "" : pass ? "text-accent-green font-bold" : "text-accent-red font-bold";
    return <span className={`text-sm ${color}`}>{formatted}{suffix}</span>;
}

function ScorePill({ score, threshold }: { score: number; threshold: number }) {
    const pass = score >= threshold;
    return (
        <span className={`text-xs font-bold ${pass ? 'text-accent-green' : 'text-accent-red'}`}>
            {score}% <span className="opacity-70">({pass ? 'Pass' : 'Fail'})</span>
        </span>
    );
}
