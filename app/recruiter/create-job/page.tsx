"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Plus,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    Copy,
    Lock,
    Filter,
    BookOpen,
    GraduationCap,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { AVAILABLE_BRANCHES } from "@/lib/constants";

export default function CreateJobPage() {
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        company: "",
        domain: "Engineering (CS/IT)",
        experience: "Entry Level",
        description: "",
        skills: "",
        location: "",
        min_score: "7.0",
        min_10th: "60",
        min_12th: "60",
        max_backlogs: "0",
        allowed_branches: [] as string[],
    });

    const router = useRouter();

    // Use imported AVAILABLE_BRANCHES list from @/lib/constants

    const toggleBranch = (branch: string) => {
        setFormData(prev => ({
            ...prev,
            allowed_branches: prev.allowed_branches.includes(branch)
                ? prev.allowed_branches.filter(b => b !== branch)
                : [...prev.allowed_branches, branch]
        }));
    };

    const generateCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.company) {
            setError("Job Title and Company Name are required.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const job_code = generateCode();
            const required_skills = formData.skills.split(",").map(s => s.trim()).filter(Boolean);

            const { error: insertErr } = await supabase.from("jobs").insert({
                recruiter_id: user.id,
                company_name: formData.company,
                title: formData.title,
                department: formData.domain,
                location: formData.location,
                description: formData.description,
                required_skills,
                min_score: parseFloat(formData.min_score) || 0,
                min_10th: parseFloat(formData.min_10th) || 0,
                min_12th: parseFloat(formData.min_12th) || 0,
                max_backlogs: parseInt(formData.max_backlogs) || 99,
                allowed_branches: formData.allowed_branches,
                job_code,
            });

            if (insertErr) throw insertErr;

            setCreatedCode(job_code);
        } catch (err: any) {
            setError(err.message || "Failed to create job.");
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (createdCode) {
            navigator.clipboard.writeText(createdCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Success screen
    if (createdCode) {
        return (
            <div className="min-h-screen bg-bg-primary text-text-primary p-12 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-bg-secondary border border-accent-green/30 rounded-3xl p-10 text-center space-y-6"
                >
                    <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-accent-green" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-sora">Job Drive Created!</h2>
                        <p className="text-text-secondary mt-2 text-sm">Share this unique access code with students so they can register for your drive.</p>
                    </div>
                    <div className="bg-bg-card border border-border-color rounded-2xl p-6">
                        <p className="text-xs uppercase tracking-widest text-text-secondary mb-3 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Drive Access Code
                        </p>
                        <p className="text-4xl font-black font-mono tracking-[0.3em] text-accent-blue">{createdCode}</p>
                    </div>
                    <button
                        onClick={copyCode}
                        className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all"
                    >
                        {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        {copied ? "Copied!" : "Copy Access Code"}
                    </button>
                    <button
                        onClick={() => router.push("/recruiter/dashboard")}
                        className="w-full text-text-secondary hover:text-white text-sm py-2 transition-colors"
                    >
                        Go to Dashboard →
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color">
                        <Plus className="text-accent-blue w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-sora">Post a New Drive</h1>
                        <p className="text-text-secondary">A unique access code will be generated for students to join.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 px-4 py-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-xl">
                        {error}
                    </div>
                )}

                <div className="bg-bg-secondary p-10 rounded-[2.5rem] border border-border-color shadow-2xl">
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Job Title" placeholder="e.g. Frontend Engineer" value={formData.title} onChange={(val: string) => setFormData({ ...formData, title: val })} />
                            <InputField label="Company Name" placeholder="e.g. DeltaX India" value={formData.company} onChange={(val: string) => setFormData({ ...formData, company: val })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                label="Domain / Department"
                                options={["Engineering (CS/IT)", "Electronics", "Mechanical", "Design", "Product", "Marketing", "Sales", "Finance"]}
                                value={formData.domain}
                                onChange={(val: string) => setFormData({ ...formData, domain: val })}
                            />
                            <InputField label="Location" placeholder="e.g. Pune, Remote" value={formData.location} onChange={(val: string) => setFormData({ ...formData, location: val })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                label="Experience Level"
                                options={["Entry Level", "Mid Level", "Senior", "Lead"]}
                                value={formData.experience}
                                onChange={(val: string) => setFormData({ ...formData, experience: val })}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                                    Allowed Branches (Multi-Select)
                                </label>
                                <span className="text-xs text-text-secondary">
                                    {formData.allowed_branches.length === 0 ? "All Branches Allowed" : `${formData.allowed_branches.length} Selected`}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 p-4 bg-bg-card border border-border-color rounded-2xl max-h-48 overflow-y-auto">
                                {AVAILABLE_BRANCHES.map(branch => {
                                    const isSelected = formData.allowed_branches.includes(branch);
                                    return (
                                        <button
                                            key={branch}
                                            type="button"
                                            onClick={() => toggleBranch(branch)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                ? "bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30"
                                                : "bg-bg-primary text-text-secondary border-border-color hover:border-accent-yellow/30 hover:text-white"
                                                }`}
                                        >
                                            {branch}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-text-secondary mt-1 ml-1">Leave all unselected to allow students from any branch to register.</p>
                        </div>

                        {/* Elegibility Criteria block */}
                        <div className="space-y-6 pt-6 mt-4">
                            <div className="flex items-center gap-3 border-b border-border-color pb-4 mb-6">
                                <div className="p-2 bg-accent-yellow/10 text-accent-yellow rounded-xl">
                                    <Filter className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Academic Eligibility Criteria</h2>
                                    <p className="text-xs text-text-secondary mt-1">Students must meet ALL thresholds to register using the Job Code.</p>
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
                                        value={formData.min_10th}
                                        onChange={e => setFormData({ ...formData, min_10th: e.target.value })}
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
                                        value={formData.min_12th}
                                        onChange={e => setFormData({ ...formData, min_12th: e.target.value })}
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
                                        value={formData.min_score}
                                        onChange={e => setFormData({ ...formData, min_score: e.target.value })}
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
                                    value={formData.max_backlogs}
                                    onChange={e => setFormData({ ...formData, max_backlogs: e.target.value })}
                                    className="w-full bg-bg-card border border-border-color rounded-xl p-4 outline-none focus:border-accent-red transition-colors text-sm max-w-xs"
                                />
                            </div>


                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Job Description</label>
                            <textarea
                                className="w-full h-40 bg-bg-card border border-border-color rounded-2xl p-6 outline-none focus:border-accent-blue resize-none leading-relaxed text-sm"
                                placeholder="Paste the JD here..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Required Skills (Comma separated)</label>
                            <input
                                className="w-full bg-bg-card border border-border-color rounded-2xl p-6 outline-none focus:border-accent-blue text-sm"
                                placeholder="e.g. React, Next.js, Node.js"
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            />
                        </div>

                        <div className="pt-6 border-t border-border-color flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <Sparkles className="text-accent-purple w-4 h-4" />
                                A unique invite code will be generated automatically.
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-accent-blue hover:bg-blue-600 text-white font-bold px-10 py-4 rounded-xl transition-all flex items-center gap-2 shadow-xl shadow-accent-blue/20 disabled:opacity-50"
                            >
                                {loading ? "Creating..." : "Post & Generate Code"} <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, placeholder, value, onChange }: any) {
    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{label}</label>
            <input type="text" className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-blue text-sm transition-all" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

function SelectField({ label, options, value, onChange }: any) {
    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{label}</label>
            <select className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-blue text-sm transition-all appearance-none" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}
