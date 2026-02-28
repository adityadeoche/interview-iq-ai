"use client";

import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
    const { profile, user } = useAuth();

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold font-sora">Account Settings</h1>
                <p className="text-text-secondary mt-1">Manage your academic profile and notification preferences.</p>
            </div>

            <div className="bg-bg-secondary border border-border-color rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div className="space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <User className="w-5 h-5 text-accent-blue" />
                            Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary">Full Name</label>
                                <input readOnly value={profile?.full_name || ""} className="w-full bg-bg-card border border-border-color rounded-xl p-4 text-sm opacity-70 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary">Account Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                    <input readOnly value={user?.email || ""} className="w-full bg-bg-card border border-border-color rounded-xl p-4 pl-11 text-sm opacity-70 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-border-color/50" />

                    {/* Security Info */}
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <Shield className="w-5 h-5 text-accent-purple" />
                            Academic Integrity
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed bg-accent-purple/5 p-4 rounded-xl border border-accent-purple/20">
                            Your academic records (CGPA, Backlogs, Branch) are permanently secured under your registered profile. To maintain placement drive integrity, these records cannot be altered from the settings menu. Please contact your campus TPO if corrections are needed.
                        </p>
                    </div>

                    <hr className="border-border-color/50" />

                    {/* Preferences Info */}
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-accent-yellow" />
                            Notification Preferences
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-bg-card border border-border-color rounded-xl">
                            <div>
                                <p className="font-bold text-sm">Placement Drive Alerts</p>
                                <p className="text-xs text-text-secondary mt-1">Receive priority notifications when new drives match your Gatekeeper criteria.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
