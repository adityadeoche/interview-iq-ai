"use client";

import { useState } from "react";
import { User, Mail, Shield, Save, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
    const { profile } = useAuth();
    const [saving, setSaving] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => setSaving(false), 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-sora mb-2">Account Settings</h1>
                <p className="text-text-secondary">Manage your profile information and preferences.</p>
            </div>

            <div className="bg-bg-secondary border border-border-color rounded-3xl p-6 md:p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border-color">
                        <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center text-accent-blue border border-accent-blue/20">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{profile?.full_name || "Student User"}</h3>
                            <p className="text-text-secondary text-sm">{profile?.college_name || "No College Set"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                <User className="w-4 h-4" /> Full Name
                            </label>
                            <input
                                type="text"
                                defaultValue={profile?.full_name || ""}
                                className="w-full bg-bg-card border border-border-color rounded-xl p-3 outline-none focus:border-accent-blue transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email Address
                            </label>
                            <input
                                type="email"
                                disabled
                                defaultValue={profile?.id ? "user@example.com" : ""}
                                className="w-full bg-bg-card/50 border border-border-color rounded-xl p-3 outline-none text-text-secondary cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-border-color">
                        <h4 className="font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-accent-purple" /> Notifications</h4>
                        <label className="flex items-center gap-3 p-4 border border-border-color rounded-xl bg-bg-card cursor-pointer hover:border-accent-blue transition-colors">
                            <input type="checkbox" defaultChecked className="w-5 h-5 accent-accent-blue" />
                            <div>
                                <p className="font-bold text-sm">Email Updates</p>
                                <p className="text-xs text-text-secondary">Receive alerts for new placement drives and interview results.</p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-6 border-t border-border-color flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-accent-blue hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
