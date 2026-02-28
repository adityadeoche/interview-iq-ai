"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Database,
    ChevronRight,
    ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";

export default function BulkUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        // Simulate bulk upload
        await new Promise(r => setTimeout(r, 2000));
        setIsUploading(false);
        setSuccess(true);
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color">
                        <Database className="text-accent-purple w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-sora">Bulk Batch Intake</h1>
                        <p className="text-text-secondary">Onboard an entire placement batch via CSV / Excel.</p>
                    </div>
                </div>

                <div className="bg-bg-secondary p-10 rounded-[2.5rem] border border-border-color shadow-2xl">
                    {!success ? (
                        <div className="space-y-10">
                            <div
                                className={`border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${file ? 'border-accent-green bg-accent-green/5' : 'border-border-color hover:border-accent-purple/50 bg-bg-card'}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                                }}
                            >
                                <div className="w-16 h-16 bg-bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border-color text-text-secondary">
                                    <FileSpreadsheet className="w-8 h-8" />
                                </div>
                                {file ? (
                                    <div className="space-y-2">
                                        <p className="font-bold text-accent-green">{file.name}</p>
                                        <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(2)} KB • Ready to process</p>
                                        <button onClick={() => setFile(null)} className="text-[10px] uppercase font-bold text-accent-red mt-4 underline">Remove</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold font-sora">Drop CSV or Click to Browse</h3>
                                        <p className="text-sm text-text-secondary max-w-xs mx-auto">
                                            Upload a list of students with their names, emails, and target branches.
                                        </p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="csv-upload"
                                            accept=".csv,.xlsx"
                                            onChange={handleFileChange}
                                        />
                                        <label htmlFor="csv-upload" className="inline-block px-8 py-3 bg-bg-secondary border border-border-color rounded-xl cursor-pointer font-bold text-sm hover:border-white transition-all">
                                            Select File
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-bg-card rounded-2xl border border-border-color">
                                <div className="flex gap-4">
                                    <ShieldAlert className="text-accent-yellow w-6 h-6 shrink-0" />
                                    <div className="text-xs text-text-secondary leading-relaxed">
                                        <p className="font-bold text-text-primary mb-1">Batch Format Warning</p>
                                        Ensure headers match our <span className="text-accent-blue underline underline-offset-4 cursor-pointer">sample template</span> for accurate AI profile mapping.
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="w-full md:w-auto bg-accent-purple hover:bg-purple-600 disabled:opacity-30 text-white font-bold px-12 py-4 rounded-xl transition-all shadow-xl shadow-accent-purple/20 flex items-center justify-center gap-2"
                                >
                                    {isUploading ? "Processing..." : "Sync Batch"} <Upload className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                        >
                            <div className="w-20 h-20 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-accent-green/20">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold font-sora mb-4">Batch Synchronized!</h2>
                            <p className="text-text-secondary mb-10 max-w-md mx-auto">
                                We've successfully onboarded 150 students. AI invitations have been sent to their registered emails.
                            </p>
                            <button
                                onClick={() => window.location.href = "/campus/dashboard"}
                                className="bg-bg-secondary border border-border-color text-white font-bold px-12 py-4 rounded-xl hover:border-white transition-all flex items-center gap-2 mx-auto"
                            >
                                View Batch Insights <ChevronRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
