"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, CheckCircle2, Cpu, User, Pencil, Save } from "lucide-react";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<{ full_name: string; email: string; skills: string[] } | null>(null);
    const [skills, setSkills] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [savingSkill, setSavingSkill] = useState(false);
    const [saved, setSaved] = useState(false);
    const [fullName, setFullName] = useState("");
    const [editingName, setEditingName] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("full_name, email, skills")
                .eq("id", user.id)
                .single();

            if (data) {
                setProfile(data);
                setFullName(data.full_name || "");
                setSkills(data.skills || []);
            }
            setLoading(false);
        };
        init();
    }, []);

    // Debounce-save skills automatically whenever the list changes
    const saveSkills = async (newSkills: string[]) => {
        setSavingSkill(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from("profiles").upsert({ id: user.id, skills: newSkills });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSavingSkill(false);
        }
    };

    const addSkill = () => {
        const trimmed = inputValue.trim();
        if (!trimmed || skills.includes(trimmed)) {
            setInputValue("");
            return;
        }
        const newSkills = [...skills, trimmed];
        setSkills(newSkills);
        setInputValue("");
        saveSkills(newSkills);
    };

    const removeSkill = (skill: string) => {
        const newSkills = skills.filter(s => s !== skill);
        setSkills(newSkills);
        saveSkills(newSkills);
    };

    const saveName = async () => {
        setSavingName(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
        }
        setSavingName(false);
        setEditingName(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold font-sora flex items-center gap-3">
                    <User className="w-7 h-7 text-accent-blue" />
                    My Profile
                </h1>
                <p className="text-text-secondary mt-1 text-sm">Manage your personal info and skills. Changes save automatically.</p>
            </div>

            {/* Identity Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border-color rounded-3xl p-6 space-y-4"
            >
                <h2 className="font-bold text-sm uppercase tracking-widest text-text-secondary">Account Info</h2>

                {/* Full Name */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-text-secondary mb-1">Full Name</p>
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && saveName()}
                                    className="bg-bg-card border border-accent-blue rounded-xl px-3 py-2 outline-none text-sm"
                                />
                                <button
                                    onClick={saveName}
                                    disabled={savingName}
                                    className="px-3 py-2 bg-accent-blue text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-blue-600 transition-all disabled:opacity-50"
                                >
                                    {savingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                </button>
                                <button onClick={() => setEditingName(false)} className="text-text-secondary text-xs hover:text-white">Cancel</button>
                            </div>
                        ) : (
                            <p className="font-bold text-lg">{fullName || "—"}</p>
                        )}
                    </div>
                    {!editingName && (
                        <button
                            onClick={() => setEditingName(true)}
                            className="p-2 rounded-xl bg-bg-card border border-border-color text-text-secondary hover:text-white hover:border-accent-blue transition-all"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Email - Read Only */}
                <div>
                    <p className="text-xs text-text-secondary mb-1">Email</p>
                    <p className="text-sm text-text-secondary">{profile?.email || "—"}</p>
                </div>
            </motion.div>

            {/* Skills Section */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-bg-secondary border border-border-color rounded-3xl p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-accent-purple" />
                        <h2 className="font-bold">My Skills</h2>
                    </div>

                    {/* Live save indicator */}
                    <AnimatePresence>
                        {savingSkill && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                            </motion.span>
                        )}
                        {saved && !savingSkill && (
                            <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-xs font-bold text-accent-green">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-xs text-text-secondary">
                    Add skills you want recruiters and TPOs to see. No verification needed — just type and press Enter.
                </p>

                {/* Skill Pills */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                    <AnimatePresence>
                        {skills.map(skill => (
                            <motion.span
                                key={skill}
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple/10 border border-accent-purple/25 text-accent-purple text-xs font-bold rounded-xl group"
                            >
                                {skill}
                                <button
                                    onClick={() => removeSkill(skill)}
                                    className="opacity-50 group-hover:opacity-100 transition-opacity hover:text-accent-red ml-0.5"
                                    aria-label={`Remove ${skill}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.span>
                        ))}
                    </AnimatePresence>
                    {skills.length === 0 && (
                        <span className="text-xs text-text-secondary italic">No skills added yet. Start typing below!</span>
                    )}
                </div>

                {/* Input Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-color">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                addSkill();
                            }
                        }}
                        placeholder="e.g. React, Python, SQL..."
                        className="flex-1 bg-bg-card border border-border-color rounded-xl px-4 py-2.5 outline-none focus:border-accent-purple transition-colors text-sm placeholder:text-text-secondary"
                    />
                    <button
                        onClick={addSkill}
                        disabled={!inputValue.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-purple text-white text-sm font-bold rounded-xl hover:bg-purple-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>
                <p className="text-[10px] text-text-secondary">Press <kbd className="px-1 py-0.5 bg-bg-card border border-border-color rounded text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 bg-bg-card border border-border-color rounded text-[10px]">,</kbd> to add a skill quickly.</p>
            </motion.div>
        </div>
    );
}
