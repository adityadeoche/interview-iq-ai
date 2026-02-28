"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, profile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            fetchResume();
        }
    }, [user]);

    const fetchResume = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("resume_url")
            .eq("id", user?.id)
            .single();

        if (data?.resume_url) {
            setResumeUrl(data.resume_url);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.type !== "application/pdf") {
            setMessage({ type: 'error', text: "Please upload a PDF file." });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `resumes/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('resume')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('resume')
                .getPublicUrl(filePath);

            // 3. Update Profile with Resume URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ resume_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setResumeUrl(publicUrl);
            setMessage({ type: 'success', text: "Resume uploaded successfully!" });
        } catch (error: any) {
            console.error("Upload error:", error);
            setMessage({ type: 'error', text: error.message || "Failed to upload resume. Make sure the 'resume' bucket exists." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold font-sora">Student Profile</h1>
                <p className="text-text-secondary">Manage your professional information and resume.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Profile Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-bg-secondary border border-border-color rounded-3xl p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue text-2xl font-bold">
                                {profile?.full_name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                                <p className="text-text-secondary">{profile?.email}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-accent-blue/10 text-accent-blue text-[10px] font-bold uppercase rounded-full border border-accent-blue/20">
                                    {profile?.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-color/50">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Target Role</label>
                                <div className="p-4 bg-bg-card border border-border-color rounded-2xl font-medium">
                                    Frontend Developer (E&TC)
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Key Projects</label>
                                <div className="p-4 bg-bg-card border border-border-color rounded-2xl font-medium">
                                    ESP32 Atmosphere Monitoring
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Resume Upload */}
                <div className="space-y-6">
                    <div className="bg-bg-secondary border border-border-color rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${resumeUrl ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-blue/10 text-accent-blue'}`}>
                            {resumeUrl ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>

                        <div>
                            <h3 className="font-bold text-lg">My Resume</h3>
                            <p className="text-sm text-text-secondary mt-1">
                                {resumeUrl ? "Your resume is active and ready for interviews." : "Upload your latest PDF resume to initialize the AI engine."}
                            </p>
                        </div>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium w-full ${message.type === 'success' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}
                            >
                                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {message.text}
                            </motion.div>
                        )}

                        <div className="w-full">
                            <label className="block w-full">
                                <span className="sr-only">Choose profile photo</span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <div className={`cursor-pointer w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${uploading ? 'bg-bg-card text-text-secondary' : 'bg-accent-blue text-white shadow-xl shadow-accent-blue/20 hover:bg-blue-600'}`}>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            {resumeUrl ? "Update Resume" : "Upload PDF"}
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>

                        {resumeUrl && (
                            <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-accent-blue font-bold hover:underline"
                            >
                                View Current Resume
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
