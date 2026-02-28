"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    Briefcase,
    Code,
    ChevronRight,
    Sparkles,
    Zap,
    Cpu,
    Target,
    Paperclip,
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ClipboardEdit,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

function InterviewSetupContent() {
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const driveRegId = searchParams.get("driveRegId");
    const driveId = searchParams.get("driveId");
    const driveRole = searchParams.get("role");

    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [parseStatus, setParseStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [usingSavedResume, setUsingSavedResume] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualGrades, setManualGrades] = useState({ tenth: '', twelfth: '', cgpa: '', branch: '' });
    const [savingGrades, setSavingGrades] = useState(false);
    const [formData, setFormData] = useState({
        role: driveRole || ""
    });

    const router = useRouter();

    // Prevent going back to this page during a live drive
    useEffect(() => {
        if (mode === "drive" && driveRegId) {
            const existingSetup = sessionStorage.getItem("interview_setup");
            if (existingSetup) {
                try {
                    const parsed = JSON.parse(existingSetup);
                    if (parsed.mode === 'drive' && parsed.driveRegId === driveRegId) {
                        sessionStorage.removeItem("interview_setup");
                        sessionStorage.removeItem("current_interview_config");
                        alert("Drive sessions cannot be restarted or modified once initiated. Returning to dashboard.");
                        router.push("/dashboard");
                    }
                } catch (e) { }
            }
        }
    }, [mode, driveRegId, router]);

    // Pre-fill from profile — load saved resume if available
    useEffect(() => {
        if (mode === "drive" && driveRole) {
            setFormData({ role: driveRole });
            // Force resume upload for drives
            setUsingSavedResume(false);
        } else if (profile && !formData.role) {
            if (profile.resume_role) {
                setFormData({ role: profile.resume_role || "" });
                setUsingSavedResume(true);
            } else {
                setFormData(prev => ({
                    ...prev,
                    role: (profile.role && profile.role !== 'candidate') ? profile.role : "",
                }));
            }
        }
    }, [profile]);

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setParsing(true);
        setParseStatus(null);

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `resumes/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('resume')
                .upload(filePath, file);

            if (uploadError) throw new Error("Storage upload failed: " + uploadError.message);

            // 2. Parse PDF via API
            const apiFormData = new FormData();
            apiFormData.append('file', file);

            let res: Response;
            try {
                res = await fetch('/api/parse-resume', {
                    method: 'POST',
                    body: apiFormData
                });
            } catch (networkErr: any) {
                throw new Error('Network error — could not reach server. Check your connection.');
            }

            let result: any;
            if (!res.ok) {
                try { result = await res.json(); } catch { result = {}; }
                // Show manual entry form if PDF can't be read
                if (result?.requiresManualEntry) {
                    setParseStatus({ type: 'error', text: 'PDF could not be read. Please enter your grades manually below.' });
                    setShowManualEntry(true);
                    return;
                }
                throw new Error(result?.error || `Server error (${res.status})`);
            }

            result = await res.json();
            if (!result.success) {
                if (result.requiresManualEntry) {
                    setParseStatus({ type: 'error', text: 'Could not extract data from PDF. Enter grades manually.' });
                    setShowManualEntry(true);
                    return;
                }
                throw new Error(result.error || 'Resume processing failed');
            }

            const data = result.data;

            // 3. Auto-fill fields — AI detects branch automatically
            const extractedRole =
                data.detectedIndustry ||
                data.experience?.[0]?.role ||
                (data.primaryTechStack?.[0] ? `${data.primaryTechStack[0]} Developer` : '') ||
                "";
            if (mode !== 'drive') {
                setFormData({
                    role: extractedRole || formData.role
                });
            }

            // Save parsed resume data to profile for future sessions
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({
                    resume_role: extractedRole || formData.role,
                }).eq('id', user.id);
            }

            // Save to session storage for the interview rounds
            sessionStorage.setItem("parsed_resume", JSON.stringify(data));

            setUsingSavedResume(false);
            setParseStatus({ type: 'success', text: `✅ Resume analyzed by Groq AI! Fields auto-filled.` });
        } catch (error: any) {
            console.error("Resume integration error:", error);
            setParseStatus({ type: 'error', text: error.message || "Failed to analyze resume." });
        } finally {
            setParsing(false);
        }
    };

    const handleManualGradesSave = async () => {
        setSavingGrades(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const updates: Record<string, any> = {};
            if (manualGrades.tenth) updates.tenth_percent = parseFloat(manualGrades.tenth);
            if (manualGrades.twelfth) updates.twelfth_percent = parseFloat(manualGrades.twelfth);
            if (manualGrades.cgpa) updates.grad_cgpa = parseFloat(manualGrades.cgpa);
            if (manualGrades.branch) updates.branch = manualGrades.branch;
            if (Object.keys(updates).length > 0) {
                await supabase.from('profiles').update(updates).eq('id', user.id);
            }
            setShowManualEntry(false);
            setParseStatus({ type: 'success', text: '✅ Academic grades saved successfully!' });
        } catch (e: any) {
            setParseStatus({ type: 'error', text: 'Failed to save grades: ' + e.message });
        } finally {
            setSavingGrades(false);
        }
    };

    const handleStart = async () => {
        if (!formData.role) return;

        // If in drive mode, force resume scan explicitly if not using a parsed saved one
        // REMOVED block to allow students who bypassed parsing to still proceed

        setLoading(true);

        // Save setup to session to be picked up by the interview session
        const setupData = {
            role: formData.role,
            domain: formData.role, // Approximate domain
            experience: "Freshers/Entry-Level", // Default for students
            pattern: "Standard",
            mode: mode || "practice",
            driveRegId: driveRegId || null,
            driveId: driveId || null
        };

        sessionStorage.setItem("interview_setup", JSON.stringify(setupData));
        sessionStorage.setItem("current_interview_config", JSON.stringify(formData));

        // Navigate to Round 1
        router.push("/interview/session/round-1");
    };

    const isDriveMode = mode === 'drive';

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-12">
            <div className="max-w-3xl mx-auto pt-8">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color">
                        <Cpu className="text-accent-blue w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold font-sora">Interview Wizard</h1>
                        <p className="text-text-secondary mt-1">Calibrate your personalized AI technical round.</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-secondary p-8 md:p-12 rounded-[2.5rem] border border-border-color shadow-2xl relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl"></div>

                    <div className="space-y-10 relative z-10">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-accent-blue" /> Target Job Role
                            </label>
                            <input
                                className={`w-full bg-bg-card border ${isDriveMode ? 'border-accent-blue/30 text-accent-blue cursor-not-allowed opacity-80' : 'border-border-color'} rounded-2xl p-5 outline-none focus:border-accent-blue text-lg transition-all`}
                                placeholder="e.g. E&TC Engineer, Frontend Dev..."
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                readOnly={mode === 'drive'}
                            />
                            <p className="text-xs text-text-secondary italic px-2">
                                {isDriveMode ? 'Role is locked by the campus drive. Resume and academic profiles have been pulled automatically.' : 'Role-specific questions will be generated based on your Target Job Role.'}
                            </p>
                        </div>


                        <div className="space-y-4">
                            {/* Resume Upload Section */}
                            <div className="mt-4 pt-6 border-t border-border-color/30">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue">
                                            <Paperclip className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">Auto-fill via Resume</h4>
                                            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">PDF Format only</p>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center justify-center gap-2 bg-bg-card hover:bg-bg-secondary border border-border-color px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 group">
                                        {parsing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
                                                <span className="text-xs font-bold">Analyzing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 text-accent-blue group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold">Upload Resume</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={handleResumeUpload}
                                            disabled={parsing}
                                        />
                                    </label>
                                </div>

                                {parseStatus && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-[11px] font-bold ${parseStatus.type === 'success' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}
                                    >
                                        {parseStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        {parseStatus.text}
                                    </motion.div>
                                )}
                            </div>

                            <p className="text-xs text-text-secondary italic px-2">
                                Mention specific tech stacks to get deep-dive technical questions.
                            </p>
                        </div>
                        <div className="pt-6 border-t border-border-color flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3 text-xs text-text-secondary bg-bg-card px-4 py-2 rounded-full border border-border-color">
                                <Sparkles className="text-accent-yellow w-4 h-4" />
                                Powered by Groq llama-3.3-70b
                            </div>

                            {/* Manual Entry Modal */}
                            <AnimatePresence>
                                {showManualEntry && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                                    >
                                        <div className="bg-bg-secondary border border-border-color rounded-3xl p-8 w-full max-w-md shadow-2xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    <ClipboardEdit className="w-5 h-5 text-accent-yellow" />
                                                    Manual Grade Entry
                                                </h3>
                                                <button onClick={() => setShowManualEntry(false)} className="p-2 hover:bg-bg-card rounded-xl transition-colors">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-text-secondary mb-6">Your PDF couldn't be read. Please enter your academic grades so you're never blocked from drives.</p>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">10th %</label>
                                                        <input type="number" step="0.01" min="0" max="100" value={manualGrades.tenth}
                                                            onChange={e => setManualGrades({ ...manualGrades, tenth: e.target.value })}
                                                            className="w-full mt-1 bg-bg-card border border-border-color rounded-xl px-3 py-2.5 outline-none focus:border-accent-blue transition-colors"
                                                            placeholder="e.g. 85.5" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">12th / Diploma %</label>
                                                        <input type="number" step="0.01" min="0" max="100" value={manualGrades.twelfth}
                                                            onChange={e => setManualGrades({ ...manualGrades, twelfth: e.target.value })}
                                                            className="w-full mt-1 bg-bg-card border border-border-color rounded-xl px-3 py-2.5 outline-none focus:border-accent-blue transition-colors"
                                                            placeholder="e.g. 88.0" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Current CGPA</label>
                                                        <input type="number" step="0.01" min="0" max="10" value={manualGrades.cgpa}
                                                            onChange={e => setManualGrades({ ...manualGrades, cgpa: e.target.value })}
                                                            className="w-full mt-1 bg-bg-card border border-border-color rounded-xl px-3 py-2.5 outline-none focus:border-accent-purple transition-colors"
                                                            placeholder="e.g. 8.5" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Branch</label>
                                                        <input type="text" value={manualGrades.branch}
                                                            onChange={e => setManualGrades({ ...manualGrades, branch: e.target.value })}
                                                            className="w-full mt-1 bg-bg-card border border-border-color rounded-xl px-3 py-2.5 outline-none focus:border-accent-blue transition-colors"
                                                            placeholder="e.g. Computer Science" />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleManualGradesSave}
                                                    disabled={savingGrades}
                                                    className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {savingGrades ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    {savingGrades ? 'Saving...' : 'Save Grades'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={handleStart}
                                disabled={loading || !formData.role}
                                className="w-full md:w-auto bg-gradient-to-r from-accent-blue to-accent-purple hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-12 py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent-blue/20 text-lg"
                            >
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? "Initializing..." : <>Start Interview <ChevronRight className="w-5 h-5" /></>}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="p-6 bg-bg-secondary rounded-3xl border border-border-color flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue">
                            <Zap className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold">Real-time Feedback</p>
                    </div>
                    <div className="p-6 bg-bg-secondary rounded-3xl border border-border-color flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center text-accent-purple">
                            <Target className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold">Deep Professional Probe</p>
                    </div>
                    <div className="p-6 bg-bg-secondary rounded-3xl border border-border-color flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center text-accent-green">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold">Performance Matrix</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewInterviewSetup() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-12 text-center text-text-secondary">Loading wizard...</div>}>
            <InterviewSetupContent />
        </Suspense>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    )
}
