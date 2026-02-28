"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, AlertCircle, Clock, Play, BarChart3, XCircle } from "lucide-react";
import Link from "next/link";

interface RegisteredDrive {
    regId: string;
    company: string;
    role: string;
    status: string;
    scheduled_time: string | null;
    driveId: string;
    jobId: string;
    source: string;
    resultsPublished: boolean;
    interviewId?: string | null;
}

export default function MyDrivesCard() {
    const [drives, setDrives] = useState<RegisteredDrive[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDrives = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch registrations
            const { data: regs } = await supabase
                .from('drive_registrations')
                .select('id, status, scheduled_time, drive_id, job_id')
                .eq('student_id', user.id);

            if (!regs || regs.length === 0) {
                setLoading(false);
                return;
            }

            // Resolve the placement_drives / jobs
            const regIds = regs.map((r: any) => r.id);
            const driveIds = regs.filter((r: any) => r.drive_id).map((r: any) => r.drive_id);
            const jobIds = regs.filter((r: any) => r.job_id).map((r: any) => r.job_id);

            // Fetch Interviews for this user
            // We need to fetch interviews that match either drive_id or job_id
            const { data: interviewData } = await supabase
                .from('interviews')
                .select('id, drive_id, job_id')
                .eq('user_id', user.id);

            let interviewMap: Record<string, string> = {};
            interviewData?.forEach((inv: any) => {
                if (inv.drive_id) {
                    interviewMap[`drive_${inv.drive_id}`] = inv.id;
                } else if (inv.job_id) {
                    interviewMap[`job_${inv.job_id}`] = inv.id;
                }
            });

            let placementMap: any = {};
            if (driveIds.length > 0) {
                const { data: pdData } = await supabase.from('placement_drives').select('id, company, results_published').in('id', driveIds);
                pdData?.forEach((p: any) => placementMap[p.id] = {
                    company: p.company,
                    role: 'Campus Drive',
                    resultsPublished: p.results_published
                });
            }

            let jobMap: any = {};
            if (jobIds.length > 0) {
                const { data: jData } = await supabase.from('jobs').select('id, company_name, title, results_published').in('id', jobIds);
                jData?.forEach((j: any) => jobMap[j.id] = {
                    company: j.company_name,
                    role: j.title,
                    resultsPublished: j.results_published
                });
            }

            const mapped: RegisteredDrive[] = regs.map((r: any) => {
                let info;
                let source = '';
                let interviewId = null;

                if (r.drive_id) {
                    info = placementMap[r.drive_id];
                    source = 'tpo';
                    interviewId = interviewMap[`drive_${r.drive_id}`];
                } else if (r.job_id) {
                    info = jobMap[r.job_id];
                    source = 'hr';
                    interviewId = interviewMap[`job_${r.job_id}`];
                }

                return {
                    regId: r.id,
                    company: info?.company || 'Unknown Company',
                    role: info?.role || 'Unknown Role',
                    status: r.status || 'Pending',
                    scheduled_time: r.scheduled_time || null,
                    driveId: r.drive_id,
                    jobId: r.job_id,
                    source,
                    resultsPublished: info?.resultsPublished || false,
                    interviewId: interviewId || null
                };
            });

            setDrives(mapped);
            setLoading(false);
        };
        fetchDrives();
    }, []);

    if (loading || drives.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-secondary border border-border-color rounded-3xl p-6 mb-8"
        >
            <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-accent-blue" />
                <h2 className="text-lg font-bold font-sora">My Job Drives</h2>
                <span className="ml-auto text-xs text-text-secondary">{drives.length} total</span>
            </div>

            <div className="space-y-3">
                {drives.map(d => (
                    <div key={d.regId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-bg-card rounded-2xl border border-border-color">
                        <div>
                            <h3 className="font-bold flex items-center gap-2">
                                {d.company}
                                {d.status === 'Approved' && <CheckCircle2 className="w-4 h-4 text-accent-green" />}
                            </h3>
                            <p className="text-xs text-text-secondary mt-0.5">{d.role}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                            {d.status === 'Approved' ? (
                                (() => {
                                    const now = new Date();
                                    const schTime = d.scheduled_time ? new Date(d.scheduled_time) : null;
                                    const isTimeArrived = !schTime || now >= schTime;

                                    return (
                                        <>
                                            {schTime && (
                                                <span className="text-[10px] text-text-secondary font-bold font-mono">
                                                    Scheduled: {schTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {isTimeArrived ? (
                                                <Link href={`/dashboard/student/new?driveRegId=${d.regId}&driveId=${d.driveId}&mode=drive&role=${encodeURIComponent(d.role)}`}
                                                    className="px-5 py-2.5 bg-accent-blue hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-accent-blue/20 flex items-center justify-center gap-2">
                                                    <Play className="w-4 h-4" /> Proceed to Drive
                                                </Link>
                                            ) : (
                                                <button disabled className="px-5 py-2.5 bg-bg-secondary text-text-secondary border border-border-color text-sm font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                                                    <Clock className="w-4 h-4" /> Wait for Schedule
                                                </button>
                                            )}
                                        </>
                                    );
                                })()
                            ) : d.status === 'Rejected' || d.status === 'Not Selected' ? (
                                <span className="px-4 py-2 border border-accent-red/20 text-accent-red text-xs font-bold rounded-xl bg-accent-red/5 flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Not Selected
                                </span>
                            ) : d.status === 'Selected' ? (
                                <span className="px-4 py-2 border border-accent-green/20 text-accent-green text-xs font-bold rounded-xl bg-accent-green/5 flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Selected!
                                </span>
                            ) : d.status === 'Completed' || d.status === 'Screened Out' ? (
                                d.resultsPublished ? (
                                    d.interviewId ? (
                                        <Link href={`/dashboard/student/results/${d.interviewId}`}
                                            className="px-4 py-2 border border-accent-blue/40 text-accent-blue hover:bg-accent-blue hover:text-white transition-all text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                                            <BarChart3 className="w-4 h-4" /> View Report
                                        </Link>
                                    ) : (
                                        <span className={`px-4 py-2 border ${d.status === 'Screened Out' ? 'bg-accent-red/10 text-accent-red border-accent-red/20' : 'bg-bg-card text-text-secondary border-border-color'} text-xs font-bold rounded-xl flex items-center justify-center gap-2`}>
                                            {d.status === 'Screened Out' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {d.status === 'Screened Out' ? 'Screened Out' : 'No report available'}
                                        </span>
                                    )
                                ) : (
                                    <span className="px-4 py-2 border border-border-color text-text-secondary text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4" /> Under Review
                                    </span>
                                )
                            ) : (
                                <span className="px-4 py-2 border border-accent-yellow/20 text-accent-yellow text-xs font-bold rounded-xl bg-accent-yellow/5 flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4" /> Waiting for Approval
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

