"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Save, AlertCircle, CheckCircle2, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function TPOSettings() {
    const { user, profile } = useAuth();

    const [savingProfile, setSavingProfile] = useState(false);
    const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [fullName, setFullName] = useState("");
    const [collegeName, setCollegeName] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (profile?.full_name) setFullName(profile.full_name);
        if (profile?.college_name) setCollegeName(profile.college_name);
        if (profile?.email || user?.email) setEmail(profile?.email || user?.email || "");
    }, [profile, user]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSavingProfile(true);
        setProfileStatus(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    college_name: collegeName
                })
                .eq('id', user.id);

            if (error) throw error;
            setProfileStatus({ type: 'success', text: 'TPO Profile updated successfully!' });
        } catch (error: any) {
            setProfileStatus({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setUpdatingPassword(true);
        setPasswordStatus(null);

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordStatus({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setPasswordStatus({ type: 'error', text: error.message || 'Failed to update password' });
        } finally {
            setUpdatingPassword(false);
        }
    };

    const StatusMessage = ({ status }: { status: { type: 'success' | 'error', text: string } | null }) => (
        <AnimatePresence>
            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-4 mb-2 p-3 rounded-xl border flex items-center gap-2 text-sm font-bold ${status.type === 'success' ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : 'bg-accent-red/10 border-accent-red/20 text-accent-red'}`}
                >
                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {status.text}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/campus/dashboard" className="p-2 hover:bg-bg-secondary rounded-xl transition-all border border-border-color">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-sora">TPO Settings</h1>
                    <p className="text-text-secondary text-sm">Manage your institution profile and security.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Edit */}
                <section className="bg-bg-secondary border border-border-color rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center border border-accent-blue/20">
                            <User className="text-accent-blue w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold font-sora">Institution Profile</h2>
                    </div>

                    <StatusMessage status={profileStatus} />

                    <form onSubmit={handleSaveProfile} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">Coordinator Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-blue transition-all text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">College/Institution Name</label>
                            <input
                                type="text"
                                value={collegeName}
                                onChange={(e) => setCollegeName(e.target.value)}
                                className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-blue transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full bg-bg-primary border border-border-color rounded-2xl p-4 outline-none text-text-secondary cursor-not-allowed text-sm"
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={savingProfile || !fullName} className="bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm">
                                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Profile
                            </button>
                        </div>
                    </form>
                </section>

                {/* Security */}
                <section className="bg-bg-secondary border border-border-color rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center border border-accent-purple/20">
                            <Lock className="text-accent-purple w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold font-sora">Security</h2>
                    </div>

                    <StatusMessage status={passwordStatus} />

                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-purple transition-all text-sm"
                                minLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-bg-card border border-border-color rounded-2xl p-4 outline-none focus:border-accent-purple transition-all text-sm"
                                minLength={6}
                                required
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={updatingPassword || !newPassword || !confirmPassword} className="bg-accent-purple hover:bg-purple-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm">
                                {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}
