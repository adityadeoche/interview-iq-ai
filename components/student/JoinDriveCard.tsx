"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, KeyRound, CheckCircle2, AlertCircle, ChevronDown, Loader2 } from "lucide-react";

interface Drive {
    id: string;
    company: string;
    drive_date: string;
    branch: string;
    status: string;
    deadline: string | null;
}

export default function JoinDriveCard() {
    const [drives, setDrives] = useState<Drive[]>([]);
    const [selectedDrive, setSelectedDrive] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [registeredDrives, setRegisteredDrives] = useState<string[]>([]);

    useEffect(() => {
        const fetchDrives = async () => {
            const { data } = await supabase
                .from("placement_drives")
                .select("id, company, drive_date, branch, status, deadline")
                .in("status", ["Upcoming", "Ongoing"])
                .order("drive_date", { ascending: true });
            setDrives(data || []);
            setLoading(false);
        };
        fetchDrives();
    }, []);

    const handleJoin = async () => {
        if (!selectedDrive || !code.trim()) return;
        setSubmitting(true);
        setStatus(null);

        try {
            const res = await fetch("/api/drives/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driveId: selectedDrive, code: code.trim() }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus({ type: 'success', text: `✅ Successfully registered for ${data.company}!` });
                setRegisteredDrives(prev => [...prev, selectedDrive]);
                setCode("");
                setSelectedDrive("");
            } else {
                setStatus({ type: 'error', text: data.error || "Registration failed." });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const selectedDriveData = drives.find(d => d.id === selectedDrive);
    const isDeadlinePassed = selectedDriveData?.deadline
        ? new Date(selectedDriveData.deadline) < new Date()
        : false;

    if (loading || drives.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-secondary border border-border-color rounded-3xl p-6"
        >
            <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-accent-purple" />
                <h2 className="text-lg font-bold font-sora">Join Placement Drive</h2>
                <span className="ml-auto text-xs text-text-secondary">{drives.length} active drive{drives.length > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-4">
                {/* Drive Selector */}
                <div className="relative">
                    <select
                        className="w-full appearance-none bg-bg-card border border-border-color rounded-2xl px-4 py-3.5 outline-none focus:border-accent-purple transition-all pr-10 text-sm"
                        value={selectedDrive}
                        onChange={e => { setSelectedDrive(e.target.value); setStatus(null); }}
                    >
                        <option value="">Select a placement drive...</option>
                        {drives.map(d => (
                            <option key={d.id} value={d.id} disabled={registeredDrives.includes(d.id)}>
                                {d.company} · {new Date(d.drive_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {d.branch}
                                {registeredDrives.includes(d.id) ? ' (Registered ✓)' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                </div>

                {/* Deadline Warning */}
                {isDeadlinePassed && (
                    <p className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3 py-2 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Registration deadline has passed for this drive.
                    </p>
                )}

                {selectedDriveData && !isDeadlinePassed && selectedDriveData.deadline && (
                    <p className="text-xs text-text-secondary">
                        ⏰ Deadline: {new Date(selectedDriveData.deadline).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}

                {/* Access Code Input */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            className="w-full bg-bg-card border border-border-color rounded-2xl pl-10 pr-4 py-3.5 outline-none focus:border-accent-purple transition-all font-mono text-sm tracking-widest uppercase"
                            placeholder="Enter Access Code..."
                            value={code}
                            onChange={e => { setCode(e.target.value); setStatus(null); }}
                            onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
                        />
                    </div>
                    <button
                        onClick={handleJoin}
                        disabled={!selectedDrive || !code.trim() || submitting || isDeadlinePassed}
                        className="bg-accent-purple hover:bg-purple-700 disabled:opacity-40 text-white font-bold px-5 rounded-2xl transition-all flex items-center gap-2 text-sm"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                    </button>
                </div>

                {/* Status */}
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${status.type === 'success'
                                ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
                                : 'bg-accent-red/10 border-accent-red/20 text-accent-red'
                                }`}
                        >
                            {status.type === 'success'
                                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            }
                            {status.text}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
