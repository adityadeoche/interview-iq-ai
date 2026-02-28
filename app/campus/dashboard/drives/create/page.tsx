"use client";

import { useState, useRef } from "react";
import { Briefcase, Building2, Users, Target, Send, Filter, GraduationCap, AlertCircle, Calendar, Loader2, Copy, CheckCircle2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AVAILABLE_BRANCHES } from "@/lib/constants";

function generateDriveCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CreateDrivePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const [form, setForm] = useState({
        company: "",
        target_roles: "",
        drive_date: "",
        expected_intake: "50",
        min_cgpa: "6.0",
        min_10th: "50",
        min_12th: "50",
        max_backlogs: "0",
        allowed_branches: [] as string[],
    });

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, o => o.value);
        setForm({ ...form, allowed_branches: selected });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const drive_code = generateDriveCode();

        const { data, error: insertError } = await supabase
            .from("placement_drives")
            .insert({
                company: form.company,
                target_roles: form.target_roles,
                drive_date: form.drive_date,
                expected_intake: parseInt(form.expected_intake),
                min_cgpa: parseFloat(form.min_cgpa),
                min_10th: parseFloat(form.min_10th),
                min_12th: parseFloat(form.min_12th),
                max_backlogs: parseInt(form.max_backlogs),
                allowed_branches: form.allowed_branches,
                drive_code,
                status: "Active",
                enrolled_count: 0,
            })
            .select("id, drive_code")
            .single();

        setLoading(false);

        if (insertError) {
            setError(insertError.message);
            return;
        }

        setGeneratedCode(drive_code);
    };

    const copyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (generatedCode) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">🎉</motion.div>
                <h1 className="text-3xl font-bold font-sora">Drive Published!</h1>
                <p className="text-text-secondary">Share this unique access code with your eligible students.</p>

                <div className="bg-bg-secondary border border-border-color rounded-3xl p-8 space-y-4">
                    <p className="text-xs uppercase font-bold tracking-widest text-text-secondary">Drive Access Code</p>
                    <div className="flex items-center justify-between bg-bg-card border border-accent-blue/30 rounded-2xl px-6 py-4 gap-4">
                        <span className="font-mono text-4xl font-black text-accent-blue tracking-wider">{generatedCode}</span>
                        <button onClick={copyCode} className="p-3 bg-accent-blue/10 hover:bg-accent-blue rounded-xl text-accent-blue hover:text-white transition-all">
                            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-text-secondary">
                        Only students meeting the academic criteria you set will be able to register using this code.
                    </p>
                </div>

                <button
                    onClick={() => router.push('/campus/dashboard/drives')}
                    className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all"
                >
                    View All Drives
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold font-sora">Initiate Placement Drive</h1>
                <p className="text-text-secondary mt-2">Configure academic eligibility gates and drive specifics for your students.</p>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border-color rounded-[2.5rem] p-6 md:p-10 shadow-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-border-color pb-4 mb-6">
                            <div className="p-2 bg-accent-blue/10 text-accent-blue rounded-xl">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Drive Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary">Participating Company</label>
                                <input
                                    type="text"
                                    required
                                    value={form.company}
                                    onChange={e => setForm({ ...form, company: e.target.value })}
                                    placeholder="e.g. Google, Amazon, TCS"
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-blue transition-colors text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary">Target Roles</label>
                                <input
                                    type="text"
                                    required
                                    value={form.target_roles}
                                    onChange={e => setForm({ ...form, target_roles: e.target.value })}
                                    placeholder="e.g. SDE-1, Data Analyst"
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-blue transition-colors text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Drive Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={form.drive_date}
                                    onChange={e => setForm({ ...form, drive_date: e.target.value })}
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-blue transition-colors text-sm [color-scheme:dark]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Expected Intake
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.expected_intake}
                                    onChange={e => setForm({ ...form, expected_intake: e.target.value })}
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-blue transition-colors text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Eligibility Criteria */}
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center gap-3 border-b border-border-color pb-4 mb-6">
                            <div className="p-2 bg-accent-yellow/10 text-accent-yellow rounded-xl">
                                <Filter className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Academic Eligibility Criteria</h2>
                                <p className="text-xs text-text-secondary mt-1">Students must meet ALL thresholds to register using the Drive Code.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-accent-blue" /> Min 10th %
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={form.min_10th}
                                    onChange={e => setForm({ ...form, min_10th: e.target.value })}
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-blue transition-colors text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-accent-green" /> Min 12th %
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={form.min_12th}
                                    onChange={e => setForm({ ...form, min_12th: e.target.value })}
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-green transition-colors text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-accent-purple" /> Min CGPA
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    value={form.min_cgpa}
                                    onChange={e => setForm({ ...form, min_cgpa: e.target.value })}
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-purple transition-colors text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-accent-red" /> Max Active Backlogs
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.max_backlogs}
                                onChange={e => setForm({ ...form, max_backlogs: e.target.value })}
                                className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-red transition-colors text-sm max-w-xs"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-secondary">
                                Allowed Branches (Multi-Select)
                            </label>
                            <select
                                multiple
                                value={form.allowed_branches}
                                onChange={handleBranchChange}
                                className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-yellow transition-colors text-sm min-h-[120px]"
                            >
                                {AVAILABLE_BRANCHES.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-text-secondary mt-1">Hold CMD/CTRL to select multiple. Leave blank to allow all branches.</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border-color flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-4 rounded-xl font-bold text-text-secondary hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-accent-blue/10 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {loading ? "Generating Drive Code..." : "Publish Drive"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
