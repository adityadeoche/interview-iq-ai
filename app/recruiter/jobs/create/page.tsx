"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Plus,
    Briefcase,
    Globe,
    Rocket,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    Copy,
    Lock
} from "lucide-react";
import { motion } from "framer-motion";

export default function CreateJobPage() {
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        company: "",
        domain: "Engineering",
        experience: "Entry Level",
        description: "",
        skills: "",
        location: "",
        min_score: "75",
    });

    const router = useRouter();

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
                min_score: parseInt(formData.min_score) || 75,
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
                            <InputField
                                label="Job Title"
                                placeholder="e.g. Senior Frontend Engineer"
                                value={formData.title}
                                onChange={(val: string) => setFormData({ ...formData, title: val })}
                            />
                            <InputField
                                label="Company Name"
                                placeholder="e.g. DeltaX India"
                                value={formData.company}
                                onChange={(val: string) => setFormData({ ...formData, company: val })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                label="Domain / Department"
                                options={["Engineering (CS/IT)", "Electronics", "Mechanical", "Design", "Product", "Marketing", "Sales", "Finance"]}
                                value={formData.domain}
                                onChange={(val: string) => setFormData({ ...formData, domain: val })}
                            />
                            <InputField
                                label="Location"
                                placeholder="e.g. Pune, Remote"
                                value={formData.location}
                                onChange={(val: string) => setFormData({ ...formData, location: val })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                label="Experience Level"
                                options={["Entry Level", "Mid Level", "Senior", "Lead"]}
                                value={formData.experience}
                                onChange={(val: string) => setFormData({ ...formData, experience: val })}
                            />
                            <InputField
                                label="Min Interview Score % (0–100)"
                                placeholder="e.g. 75"
                                value={formData.min_score}
                                onChange={(val: string) => setFormData({ ...formData, min_score: val })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Job Description</label>
                            <textarea
                                className="w-full h-40 bg-bg-card border border-border-color rounded-2xl p-6 outline-none focus:border-accent-blue resize-none leading-relaxed text-sm"
                                placeholder="Paste the JD here for AI calibration..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Required Skills (Comma separated)</label>
                            <input
                                className="w-full bg-bg-card border border-border-color rounded-2xl p-6 outline-none focus:border-accent-blue text-sm"
                                placeholder="e.g. React, Next.js, Node.js, SQL"
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
            <input
                type="text"
                className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-blue text-sm transition-all"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}

function SelectField({ label, options, value, onChange }: any) {
    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{label}</label>
            <select
                className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-blue text-sm transition-all appearance-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    )
}
