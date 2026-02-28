"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
    Users, Landmark, TrendingUp, BarChart3, Building2,
    AlertCircle, Plus, GraduationCap, CheckCircle, XCircle, Wand2, Copy, Check
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AVAILABLE_BRANCHES } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface StudentStat {
    user_id: string;
    avg_score: number;
    interview_count: number;
}

interface Drive {
    id: string;
    company: string;
    drive_date: string;
    enrolled_count: number;
    status: string;
    branch: string;
}

export default function CampusDashboard() {
    const { profile } = useAuth();
    const collegeName = profile?.college_name || profile?.full_name || "Your Institution";

    const [stats, setStats] = useState({
        totalStudents: 0,
        interviewsDone: 0,
        placementReady: 0,
        avgScore: 0,
        tcsReady: 0,
        codingWarning: 0,
        topPerformers: 0,
        technicalGaps: 0,
    });
    const [drives, setDrives] = useState<Drive[]>([]);
    const [branchData, setBranchData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDriveModal, setShowDriveModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Fetch all interview data for analytics
        const { data: interviews } = await supabase
            .from("interviews")
            .select("user_id, avg_score, role, created_at, status");

        // Fetch candidate profiles
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, role")
            .eq("role", "candidate");

        // Fetch drives
        const { data: drivesData } = await supabase
            .from("placement_drives")
            .select("*")
            .order("drive_date", { ascending: false })
            .limit(6);

        if (interviews && interviews.length > 0) {
            const uniqueStudents = new Set(interviews.map((i: any) => i.user_id));
            const scores = interviews.map((i: any) => (i.avg_score || 0) * 10);
            const avgScore = Math.round(scores.reduce((a: any, b: any) => a + b, 0) / scores.length);
            const placementReady = interviews.filter((i: any) => (i.avg_score || 0) >= 7).length;
            const tcsReady = interviews.filter((i: any) => (i.avg_score || 0) >= 7).length;
            const codingWarning = interviews.filter((i: any) => (i.avg_score || 0) < 4).length;
            const topPerformers = interviews.filter((i: any) => (i.avg_score || 0) >= 9).length;
            const technicalGaps = interviews.filter((i: any) => i.status === 'Screened Out').length;

            // Branch-wise average performance: extract branch from role keywords
            const branchMap: Record<string, number[]> = {
                "CS/IT": [],
                "E&TC": [],
                "Marketing": [],
                "Finance": [],
                "Other": [],
            };
            interviews.forEach((i: any) => {
                const r = (i.role || "").toLowerCase();
                const s = (i.avg_score || 0) * 10;
                if (r.includes("cs") || r.includes("software") || r.includes("frontend") || r.includes("backend") || r.includes("react") || r.includes("java") || r.includes("python")) branchMap["CS/IT"].push(s);
                else if (r.includes("e&tc") || r.includes("etco") || r.includes("electronics") || r.includes("esp32") || r.includes("iot") || r.includes("embedded")) branchMap["E&TC"].push(s);
                else if (r.includes("market") || r.includes("digital") || r.includes("seo") || r.includes("social")) branchMap["Marketing"].push(s);
                else if (r.includes("finance") || r.includes("account") || r.includes("ca") || r.includes("bank")) branchMap["Finance"].push(s);
                else branchMap["Other"].push(s);
            });

            const bdata = Object.entries(branchMap)
                .filter(([, arr]) => arr.length > 0)
                .map(([branch, arr]) => ({
                    branch,
                    avgScore: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
                    count: arr.length,
                }));

            setStats({
                totalStudents: profiles?.length || uniqueStudents.size,
                interviewsDone: interviews.length,
                placementReady,
                avgScore,
                tcsReady,
                codingWarning,
                topPerformers,
                technicalGaps,
            });
            setBranchData(bdata);
        } else {
            setStats({
                totalStudents: profiles?.length || 0,
                interviewsDone: 0,
                placementReady: 0,
                avgScore: 0,
                tcsReady: 0,
                codingWarning: 0,
                topPerformers: 0,
                technicalGaps: 0,
            });
        }

        setDrives(drivesData || []);
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-accent-purple/10 rounded-2xl flex items-center justify-center border border-accent-purple/20">
                        <Landmark className="text-accent-purple w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-sora">{collegeName}</h1>
                        <p className="text-text-secondary mt-0.5 font-medium">Placement Management Control</p>
                    </div>
                </div>
                <button onClick={() => setShowDriveModal(true)}
                    className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg">
                    <Building2 className="w-5 h-5" /> Create New Placement Drive
                </button>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users className="w-5 h-5 text-accent-blue" />} label="Total Students" value={loading ? "..." : stats.totalStudents.toString()} sub="Registered candidates" />
                <StatCard icon={<Landmark className="w-5 h-5 text-accent-purple" />} label="Interviews Done" value={loading ? "..." : stats.interviewsDone.toString()} sub="Total sessions" />
                <StatCard icon={<TrendingUp className="w-5 h-5 text-accent-green" />} label="Placement Ready" value={loading ? "..." : stats.placementReady.toString()} sub="Scored 70%+" />
                <StatCard icon={<BarChart3 className="w-5 h-5 text-accent-yellow" />} label="Avg. Batch Score" value={loading ? "..." : `${stats.avgScore}%`} sub={stats.avgScore >= 70 ? "✅ Above 70% target" : "⚠️ Target: 70%"} />
            </div>

            {/* Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InsightCard icon={<CheckCircle className="w-5 h-5" />} title="TCS NQT Ready" value={loading ? "—" : stats.tcsReady.toString()} description="students scored ≥70% in technical" color="accent-blue" />
                <InsightCard icon={<AlertCircle className="w-5 h-5" />} title="Technical Gaps" value={loading ? "—" : stats.technicalGaps.toString()} description="students failed project criteria" color="accent-purple" />
                <InsightCard icon={<XCircle className="w-5 h-5" />} title="Coding Warning" value={loading ? "—" : stats.codingWarning.toString()} description="students scored <40% overall" color="accent-red" />
                <InsightCard icon={<GraduationCap className="w-5 h-5" />} title="Top Performers" value={loading ? "—" : stats.topPerformers.toString()} description="students scored ≥90% tier" color="accent-green" />
            </div>

            {/* Branch-wise Chart */}
            {branchData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-secondary border border-border-color rounded-3xl p-6">
                    <h2 className="text-lg font-bold font-sora mb-5 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-purple" /> Branch-wise Avg Performance
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={branchData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                            <XAxis dataKey="branch" tick={{ fill: '#8b949e', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#555', fontSize: 11 }} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', color: '#e6edf3' }}
                                formatter={(v) => [`${v}%`, 'Avg Score']}
                            />
                            <Bar dataKey="avgScore" fill="#2563eb" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Recent Placement Drives */}
            <div className="bg-bg-secondary border border-border-color rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold font-sora">Placement Drives</h2>
                    {drives.length > 0 && (
                        <Link href="/campus/dashboard/drives" className="text-accent-blue text-sm hover:underline">Manage All</Link>
                    )}
                </div>
                {drives.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                        <p className="text-text-secondary text-sm">No drives created yet.</p>
                        <button onClick={() => setShowDriveModal(true)}
                            className="inline-flex items-center gap-2 bg-accent-blue text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-600 transition-all">
                            <Plus className="w-4 h-4" /> Create First Drive
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {drives.map(d => (
                            <DriveItem key={d.id} company={d.company} date={new Date(d.drive_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} students={d.enrolled_count || 0} status={d.status} />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Drive Modal */}
            {showDriveModal && (
                <CreateDriveModal onClose={() => { setShowDriveModal(false); fetchData(); }} />
            )}
        </div>
    );
}

function CreateDriveModal({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const [form, setForm] = useState({
        company: "",
        drive_date: "",
        status: "Upcoming",
        drive_code: "",
        deadline: "",
        min_cgpa: "",
        min_10th: "",
        min_12th: "",
        max_backlogs: "0",
        allowed_branches: [] as string[]
    });
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [copied, setCopied] = useState(false);

    // Use imported AVAILABLE_BRANCHES list from @/lib/constants

    const toggleBranch = (branch: string) => {
        setForm(prev => {
            const isSelected = prev.allowed_branches.includes(branch);
            if (isSelected) {
                return { ...prev, allowed_branches: prev.allowed_branches.filter(b => b !== branch) };
            } else {
                return { ...prev, allowed_branches: [...prev.allowed_branches, branch] };
            }
        });
    };

    const generateCode = () => {
        const prefix = form.company
            ? form.company.toUpperCase().replace(/\s+/g, '-').slice(0, 6)
            : 'DRIVE';
        const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        setForm(prev => ({ ...prev, drive_code: `${prefix}-${suffix}` }));
    };

    const copyCode = () => {
        navigator.clipboard.writeText(form.drive_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!form.company || !form.drive_date || !form.drive_code) return;
        setSaving(true);
        await supabase.from("placement_drives").insert({
            company: form.company,
            drive_date: form.drive_date,
            status: form.status,
            drive_code: form.drive_code.toUpperCase(),
            deadline: form.deadline || null,
            created_by: user?.id,
            min_cgpa: parseFloat(form.min_cgpa) || 0,
            min_10th: parseFloat(form.min_10th) || 0,
            min_12th: parseFloat(form.min_12th) || 0,
            max_backlogs: parseInt(form.max_backlogs) || 0,
            allowed_branches: form.allowed_branches.length > 0 ? form.allowed_branches : null
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-bg-secondary border border-border-color rounded-3xl p-8 w-full max-w-2xl space-y-5 my-4 max-h-[90vh] overflow-y-auto">
                <div>
                    <h2 className="text-xl font-bold font-sora">Create Placement Drive</h2>
                    <p className="text-text-secondary text-xs mt-1">Students need the Access Code to register.</p>
                </div>
                <div className="space-y-4">
                    {/* Company */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Company Name *</label>
                        <input className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue"
                            placeholder="e.g. TCS, Accenture, Infosys"
                            value={form.company}
                            onChange={e => setForm({ ...form, company: e.target.value })} />
                    </div>

                    {/* Access Code */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">
                            Access Code * <span className="text-accent-purple">(share with students)</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue font-mono text-sm tracking-widest"
                                placeholder="e.g. TCS-ENTC-2026"
                                value={form.drive_code}
                                onChange={e => setForm({ ...form, drive_code: e.target.value.toUpperCase() })} />
                            <button type="button" onClick={generateCode}
                                title="Auto-generate code"
                                className="p-3.5 bg-accent-purple/10 hover:bg-accent-purple text-accent-purple hover:text-white border border-accent-purple/30 rounded-2xl transition-all">
                                <Wand2 className="w-5 h-5" />
                            </button>
                        </div>
                        {form.drive_code && (
                            <div className="mt-2 flex items-center justify-between bg-accent-green/5 border border-accent-green/20 rounded-xl px-4 py-2.5">
                                <span className="text-accent-green font-mono font-bold text-sm tracking-widest">{form.drive_code}</span>
                                <button onClick={copyCode} className="text-accent-green hover:text-white transition-colors">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Drive Date */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Drive Date *</label>
                        <input type="date" className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue"
                            value={form.drive_date}
                            onChange={e => setForm({ ...form, drive_date: e.target.value })} />
                    </div>

                    {/* Registration Deadline */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">
                            Registration Deadline <span className="text-text-secondary font-normal normal-case">(students can't join after this)</span>
                        </label>
                        <input type="datetime-local" className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue"
                            value={form.deadline}
                            onChange={e => setForm({ ...form, deadline: e.target.value })} />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Status</label>
                        <select className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option>Upcoming</option>
                            <option>Ongoing</option>
                            <option>Completed</option>
                        </select>
                    </div>

                    {/* Advanced Options Toggle */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm font-bold text-accent-blue border border-accent-blue/30 bg-accent-blue/5 hover:bg-accent-blue/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                        >
                            {showAdvanced ? "Hide Advanced Eligibility" : "Show Advanced Eligibility"}
                        </button>
                    </div>

                    {/* Advanced Fields */}
                    {showAdvanced && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4 pt-4 border-t border-border-color"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Min CGPA</label>
                                    <input type="number" step="0.01" min="0" max="10" placeholder="e.g. 7.5"
                                        className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-purple"
                                        value={form.min_cgpa} onChange={e => setForm({ ...form, min_cgpa: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Max Active Backlogs</label>
                                    <input type="number" min="0" placeholder="e.g. 0"
                                        className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-red"
                                        value={form.max_backlogs} onChange={e => setForm({ ...form, max_backlogs: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Min 10th %</label>
                                    <input type="number" step="0.01" min="0" max="100" placeholder="e.g. 60"
                                        className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue"
                                        value={form.min_10th} onChange={e => setForm({ ...form, min_10th: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Min 12th / Diploma %</label>
                                    <input type="number" step="0.01" min="0" max="100" placeholder="e.g. 60"
                                        className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue"
                                        value={form.min_12th} onChange={e => setForm({ ...form, min_12th: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-2">Allowed Branches</label>
                                <p className="text-xs text-text-secondary mb-3">If none selected, all branches are allowed.</p>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_BRANCHES.map(branch => {
                                        const isSelected = form.allowed_branches.includes(branch);
                                        return (
                                            <button
                                                key={branch}
                                                type="button"
                                                onClick={() => toggleBranch(branch)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                    ? 'bg-accent-blue text-white border-accent-blue'
                                                    : 'bg-bg-card text-text-secondary border-border-color hover:border-accent-blue/50'
                                                    }`}
                                            >
                                                {branch}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Status */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary block mb-1.5">Status</label>
                        <select className="w-full bg-bg-card border border-border-color rounded-2xl p-3.5 outline-none focus:border-accent-blue"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option>Upcoming</option>
                            <option>Ongoing</option>
                            <option>Completed</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 border border-border-color py-3 rounded-2xl font-bold hover:bg-bg-card transition-all">Cancel</button>
                    <button onClick={handleSave}
                        disabled={saving || !form.company || !form.drive_date || !form.drive_code}
                        className="flex-1 bg-accent-blue hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-all">
                        {saving ? "Creating..." : "Create Drive"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}


function StatCard({ icon, label, value, sub }: any) {
    return (
        <div className="bg-bg-secondary border border-border-color p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-bg-card">{icon}</div>
                <span className="text-text-secondary text-sm font-medium">{label}</span>
            </div>
            <span className="text-3xl font-bold">{value}</span>
            <p className="text-xs text-text-secondary mt-1">{sub}</p>
        </div>
    );
}

function InsightCard({ icon, title, value, description, color }: any) {
    const colorMap: any = {
        "accent-blue": "border-accent-blue/40 bg-accent-blue/5 text-accent-blue",
        "accent-red": "border-accent-red/40 bg-accent-red/5 text-accent-red",
        "accent-green": "border-accent-green/40 bg-accent-green/5 text-accent-green",
    };
    return (
        <div className={`p-6 rounded-2xl border-2 ${colorMap[color]} flex items-start gap-4`}>
            {icon}
            <div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-sm opacity-80"><span className="text-2xl font-bold mr-1">{value}</span>{description}</p>
            </div>
        </div>
    );
}

function DriveItem({ company, date, students, status }: any) {
    const styles: any = {
        Upcoming: "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
        Ongoing: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20",
        Completed: "bg-accent-green/10 text-accent-green border-accent-green/20",
    };
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border-color hover:border-accent-blue/30 transition-all">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center font-bold text-accent-blue border border-border-color text-lg">
                    {company[0]}
                </div>
                <div>
                    <h4 className="font-bold text-sm">{company}</h4>
                    <p className="text-xs text-text-secondary">{date} · {students} enrolled</p>
                </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider ${styles[status] || styles.Upcoming}`}>
                {status}
            </span>
        </div>
    );
}
