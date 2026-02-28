"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, BookOpen, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AVAILABLE_BRANCHES } from "@/lib/constants";

export default function VerifyProfilePage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        tenth_percent: "",
        twelfth_percent: "",
        grad_cgpa: "",
        branch: "",
        active_backlogs: "0",
        passing_year: ""
    });

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push("/login"); return; }

                // 2. Fetch their profile directly (no useAuth dependency chain)
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("tenth_percent, twelfth_percent, grad_cgpa, branch, active_backlogs, passing_year")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setFormData({
                        tenth_percent: profile.tenth_percent?.toString() ?? "",
                        twelfth_percent: profile.twelfth_percent?.toString() ?? "",
                        grad_cgpa: profile.grad_cgpa?.toString() ?? "",
                        branch: profile.branch ?? "",
                        active_backlogs: (profile.active_backlogs ?? 0).toString(),
                        passing_year: profile.passing_year?.toString() ?? "",
                    });
                }

                setLoading(false);
            } catch (e) {
                setLoading(false);
            }
        };

        init();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error: saveErr } = await supabase.from('profiles').upsert({
                id: user.id,
                tenth_percent: parseFloat(formData.tenth_percent),
                twelfth_percent: parseFloat(formData.twelfth_percent),
                grad_cgpa: parseFloat(formData.grad_cgpa),
                branch: formData.branch,
                active_backlogs: parseInt(formData.active_backlogs || "0"),
                passing_year: formData.passing_year ? parseInt(formData.passing_year) : null,
            });

            if (saveErr) throw saveErr;

            setSaved(true);
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err: any) {
            setError(err.message || "Failed to save profile data.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <GraduationCap className="w-10 h-10 text-accent-blue mx-auto animate-pulse" />
                    <p className="text-text-secondary text-sm">Loading Academic Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border-color rounded-3xl p-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-accent-blue/10 rounded-xl">
                        <GraduationCap className="w-6 h-6 text-accent-blue" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-sora">Academic Profile</h1>
                        <p className="text-sm text-text-secondary mt-1">
                            This data acts as your official academic record for strict drive eligibility.
                        </p>
                    </div>
                </div>


                {error && (
                    <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> 10th Percentage %
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                required
                                value={formData.tenth_percent}
                                onChange={e => setFormData({ ...formData, tenth_percent: e.target.value })}
                                className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                                placeholder="e.g. 85.5"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> 12th / Diploma %
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                required
                                value={formData.twelfth_percent}
                                onChange={e => setFormData({ ...formData, twelfth_percent: e.target.value })}
                                className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                                placeholder="e.g. 88.0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                                <GraduationCap className="w-3 h-3 text-accent-purple" /> Current CGPA
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                required
                                value={formData.grad_cgpa}
                                onChange={e => setFormData({ ...formData, grad_cgpa: e.target.value })}
                                className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-3 outline-none focus:border-accent-purple transition-colors text-accent-purple font-bold"
                                placeholder="e.g. 8.5"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                                <AlertCircle className="w-3 h-3 text-accent-red" /> Active Backlogs
                            </label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.active_backlogs}
                                onChange={e => setFormData({ ...formData, active_backlogs: e.target.value })}
                                className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-3 outline-none focus:border-accent-red transition-colors"
                                placeholder="Number of active backlogs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-accent-blue" />
                                Passing Year
                            </label>
                            <input
                                type="number"
                                min="2000"
                                max="2035"
                                required
                                value={formData.passing_year}
                                onChange={e => setFormData({ ...formData, passing_year: e.target.value })}
                                className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                                placeholder="e.g. 2026"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-accent-purple" />
                                Academic Branch / Specialization
                            </label>
                            <select
                                required
                                value={formData.branch}
                                onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-3 outline-none focus:border-accent-purple transition-colors appearance-none"
                            >
                                <option value="">Select your branch...</option>
                                {AVAILABLE_BRANCHES.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
                    >
                        {saving ? (
                            "Saving..."
                        ) : saved ? (
                            <><CheckCircle2 className="w-5 h-5" /> Saved!</>
                        ) : (
                            <><Save className="w-5 h-5" /> Save Academic Profile</>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
