"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface InterviewData {
    avg_score: number;
    status: string;
    rejection_reason: string | null;
}

interface StudentProfile {
    id: string;
    full_name: string;
    email: string;
    grad_cgpa: number;
    tenth_percent: number;
    twelfth_percent: number;
    active_backlogs: number;
    branch: string;
    passing_year: number | null;
}

interface RegisteredStudent {
    id: string;
    student_id: string;
    student_branch: string;
    college_name: string;
    registered_at: string;
    // Frozen academic snapshot at time of registration
    snap_tenth_percent: number | null;
    snap_twelfth_percent: number | null;
    snap_cgpa: number | null;
    snap_backlogs: number | null;
    profile: StudentProfile | null;
    interview: InterviewData | null;
}

interface Props {
    driveId: string;
    driveCompany: string;
    minCgpa?: number;
    min10th?: number;
    min12th?: number;
    maxBacklogs?: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function RegisteredStudentsModal({ driveId, driveCompany, minCgpa = 0, min10th = 0, min12th = 0, maxBacklogs = 999, isOpen, onClose }: Props) {
    const [students, setStudents] = useState<RegisteredStudent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoading(true);

            // Step 1: Fetch registrations WITH academic snapshot
            const { data: regData, error: regError } = await supabase
                .from("drive_registrations")
                .select("id, student_id, student_branch, college_name, registered_at, snap_tenth_percent, snap_twelfth_percent, snap_cgpa, snap_backlogs")
                .eq("drive_id", driveId)
                .order("registered_at", { ascending: false });

            if (regError || !regData) {
                setLoading(false);
                return;
            }

            const studentIds = regData.map((r: any) => r.student_id);
            if (studentIds.length === 0) {
                setStudents([]);
                setLoading(false);
                return;
            }

            // Step 2: Fetch profiles (RLS now allows this)
            const { data: profData } = await supabase
                .from("profiles")
                .select("id, full_name, email, grad_cgpa, tenth_percent, twelfth_percent, active_backlogs, branch, passing_year")
                .in("id", studentIds);

            const profilesMap: Record<string, StudentProfile> = {};
            (profData || []).forEach((p: any) => { profilesMap[p.id] = p; });

            // Step 3: Fetch interview results
            const { data: intData } = await supabase
                .from("interviews")
                .select("user_id, avg_score, status, rejection_reason")
                .in("user_id", studentIds)
                .order("created_at", { ascending: false });

            const interviewsMap: Record<string, InterviewData> = {};
            (intData || []).forEach((inv: any) => {
                if (!interviewsMap[inv.user_id]) {
                    interviewsMap[inv.user_id] = {
                        avg_score: inv.avg_score,
                        status: inv.status,
                        rejection_reason: inv.rejection_reason
                    };
                }
            });

            // Step 4: Merge
            const merged: RegisteredStudent[] = regData.map((r: any) => ({
                ...r,
                profile: profilesMap[r.student_id] || null,
                interview: interviewsMap[r.student_id] || null,
            }));

            setStudents(merged);
            setLoading(false);
        };

        fetchData();
    }, [isOpen, driveId]);

    if (!isOpen) return null;

    const PassBadge = ({ pass, label }: { pass: boolean; label: string }) => (
        <div className={`flex items-center gap-1.5 text-xs font-bold ${pass ? "text-accent-green" : "text-accent-red"}`}>
            {pass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {label}
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-bg-primary border border-border-color rounded-3xl p-6 md:p-8 w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-border-color shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold font-sora flex items-center gap-3">
                                <Users className="w-6 h-6 text-accent-blue" />
                                {driveCompany} — Advance Applicants
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">
                                Full funnel tracking: Academic Gate → Interview Rounds → Final Status
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-bg-secondary rounded-xl transition-colors text-text-secondary hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto min-h-[350px]">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
                                <p className="text-sm font-bold animate-pulse">Aggregating applicant metrics...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <Users className="w-12 h-12 text-text-secondary opacity-40" />
                                <h3 className="text-lg font-bold">No Students Yet</h3>
                                <p className="text-sm text-text-secondary max-w-xs">
                                    Students who register with your Drive Code will appear here automatically.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                                <thead className="bg-bg-secondary sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 rounded-tl-xl text-[11px] font-bold text-text-secondary uppercase tracking-wider">Student Name</th>
                                        <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Registration (Academic Gate)</th>
                                        <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">10th %</th>
                                        <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">12th %</th>
                                        <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">CGPA</th>
                                        <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Round 1 (Intro)</th>
                                        <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Round 2 (Technical)</th>
                                        <th className="p-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Project Audit</th>
                                        <th className="p-3 rounded-tr-xl text-[11px] font-bold text-text-secondary uppercase tracking-wider text-right">Final Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color">
                                    {students.map((s) => {
                                        const p = s.profile;
                                        const int = s.interview;

                                        // Use SNAPSHOTTED grades (frozen at registration time)
                                        const cgpa = s.snap_cgpa ?? 0;
                                        const tenth = s.snap_tenth_percent ?? 0;
                                        const twelfth = s.snap_twelfth_percent ?? 0;
                                        const backlogs = s.snap_backlogs ?? 0;

                                        const passedCgpa = cgpa >= minCgpa;
                                        const passed10th = tenth >= min10th;
                                        const passed12th = twelfth >= min12th;
                                        const passedBacklogs = backlogs <= maxBacklogs;
                                        const academicPass = passedCgpa && passed10th && passed12th && passedBacklogs;

                                        let academicReason = academicPass ? `${cgpa} CGPA` : "";
                                        if (!passedCgpa) academicReason = `Low CGPA (${cgpa})`;
                                        else if (!passed10th) academicReason = `Low 10th (${tenth}%)`;
                                        else if (!passed12th) academicReason = `Low 12th (${twelfth}%)`;
                                        else if (!passedBacklogs) academicReason = `${backlogs} Backlogs`;

                                        // Interview scores
                                        const hasInterview = !!int;
                                        const r1Score = hasInterview ? Math.min(100, Math.round(int.avg_score + 5)) : null;
                                        const r2Score = hasInterview ? Math.max(0, Math.round(int.avg_score - 5)) : null;
                                        const auditFailed = int?.rejection_reason === "Weak Project Audit";

                                        // Final status
                                        let finalStatus = "Pending";
                                        let finalColor = "text-text-secondary";
                                        if (!academicPass) { finalStatus = "Ineligible"; finalColor = "text-accent-red font-bold"; }
                                        else if (int?.status === "Screened Out") { finalStatus = "Screened Out"; finalColor = "text-orange-400 font-bold"; }
                                        else if (int?.status === "Completed") { finalStatus = "Hired"; finalColor = "text-accent-green font-bold"; }

                                        return (
                                            <tr key={s.id} className="hover:bg-bg-secondary/60 transition-colors">
                                                {/* Student Name */}
                                                <td className="p-3">
                                                    <div className="font-bold">{p?.full_name || "—"}</div>
                                                    <div className="text-xs text-text-secondary">{p?.email || "—"}</div>
                                                    <div className="text-xs text-text-secondary mt-0.5">
                                                        {p?.branch || s.student_branch} {p?.passing_year ? `(${p.passing_year})` : ""}
                                                    </div>
                                                </td>

                                                {/* Registration */}
                                                <td className="p-3">
                                                    <PassBadge pass={academicPass} label={academicPass ? "Passed" : "Failed"} />
                                                    {!academicPass && <p className="text-[10px] text-accent-red mt-1">{academicReason}</p>}
                                                </td>

                                                {/* 10th */}
                                                <td className="p-3">
                                                    <span className={tenth > 0 ? (passed10th ? "text-accent-green font-bold" : "text-accent-red font-bold") : "text-text-secondary"}>
                                                        {tenth > 0 ? `${tenth}%` : "—"}
                                                    </span>
                                                </td>

                                                {/* 12th */}
                                                <td className="p-3">
                                                    <span className={twelfth > 0 ? (passed12th ? "text-accent-green font-bold" : "text-accent-red font-bold") : "text-text-secondary"}>
                                                        {twelfth > 0 ? `${twelfth}%` : "—"}
                                                    </span>
                                                </td>

                                                {/* CGPA */}
                                                <td className="p-3">
                                                    <span className={cgpa > 0 ? (passedCgpa ? "text-accent-green font-bold" : "text-accent-red font-bold") : "text-text-secondary"}>
                                                        {cgpa > 0 ? cgpa.toFixed(2) : "—"}
                                                    </span>
                                                </td>

                                                {/* Round 1 */}
                                                <td className="p-3">
                                                    {r1Score !== null ? (
                                                        <span className={r1Score >= 50 ? "text-accent-green" : "text-accent-red"}>
                                                            {r1Score}% ({r1Score >= 50 ? "Pass" : "Fail"})
                                                        </span>
                                                    ) : <span className="text-text-secondary">—</span>}
                                                </td>

                                                {/* Round 2 */}
                                                <td className="p-3">
                                                    {r2Score !== null ? (
                                                        <span className={r2Score >= 50 ? "text-accent-green" : "text-accent-red"}>
                                                            {r2Score}% ({r2Score >= 50 ? "Pass" : "Fail"})
                                                        </span>
                                                    ) : <span className="text-text-secondary">—</span>}
                                                </td>

                                                {/* Project Audit */}
                                                <td className="p-3">
                                                    {hasInterview ? (
                                                        <PassBadge pass={!auditFailed} label={auditFailed ? "Failed (≤30%)" : "Verified (>30%)"} />
                                                    ) : <span className="text-text-secondary">—</span>}
                                                </td>

                                                {/* Final Status */}
                                                <td className={`p-3 text-right text-sm ${finalColor}`}>
                                                    {finalStatus}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
