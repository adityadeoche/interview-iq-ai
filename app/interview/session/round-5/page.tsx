"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileEdit,
    ChevronRight,
    CheckCircle2,
    MessageSquare,
    Sparkles,
    Timer
} from "lucide-react";
import { motion } from "framer-motion";

export default function Round5Page() {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes for 5 tasks

    const router = useRouter();

    useEffect(() => {
        const fetchQuestions = async () => {
            const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
            const resumeData = JSON.parse(sessionStorage.getItem("parsed_resume") || "{}");
            try {
                const res = await fetch("/api/round-5/questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobData, resumeData }),
                });
                const data = await res.json();
                if (data.success) {
                    setQuestions(data.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // 25-minute countdown — auto-submit when it hits 0
    useEffect(() => {
        if (timeLeft > 0 && !loading) {
            const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
            return () => clearTimeout(t);
        } else if (timeLeft === 0 && !loading) {
            handleSubmit();
        }
    }, [timeLeft, loading]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
        const resumeData = JSON.parse(sessionStorage.getItem("parsed_resume") || "{}");

        // Read real scores saved by each round's evaluate API
        const allRoundData = {
            round1: { score: JSON.parse(sessionStorage.getItem("round1_score") || "0") },
            round2: { score: JSON.parse(sessionStorage.getItem("round2_score") || "0") },
            round3: { score: JSON.parse(sessionStorage.getItem("round3_score") || "0") },
            round4: { score: JSON.parse(sessionStorage.getItem("round4_score") || "0") },
        };

        try {
            const res = await fetch("/api/round-5/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, questions, allRoundData, jobData, resumeData }),
            });
            const data = await res.json();
            if (data.success) {
                const finalReport = data.data.finalReport;
                sessionStorage.setItem("final_dna_report", JSON.stringify(finalReport));

                // Save to database
                await fetch("/api/interview/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        role: jobData.role,
                        transcript: JSON.stringify(finalReport.roundScores), // Use transcript to store the breakdown
                        avgScore: finalReport.overallScore,
                        status: "Completed",
                        rejectionReason: null,
                        driveId: jobData.driveId || null,
                        registrationId: jobData.driveRegId || null
                    }),
                });

                router.push("/dashboard/report/latest");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <RoundLoading />;

    const currentQ = questions[currentIdx];

    if (!currentQ) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="w-16 h-16 text-accent-red mb-6 opacity-70" />
                <h1 className="text-2xl font-bold font-sora mb-3">Tasks Failed to Load</h1>
                <p className="text-text-secondary max-w-sm mb-8">
                    Could not generate written assessment tasks. Please go back to setup and try again.
                </p>
                <button onClick={() => router.push("/interview/setup")}
                    className="px-8 py-3 bg-accent-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-all">
                    Back to Setup
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-color">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center border border-accent-green/20">
                            <MessageSquare className="text-accent-green w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg font-sora">Final Round: Written Assessment</h2>
                            <p className="text-xs text-text-secondary">Task {currentIdx + 1} of {questions.length}</p>
                        </div>
                    </div>
                    <div className={`px-6 py-2 rounded-2xl border flex items-center gap-2 font-bold text-lg ${timeLeft < 300 ? 'bg-accent-red/10 border-accent-red text-accent-red animate-pulse' : 'bg-bg-secondary border-border-color'}`}>
                        <Timer className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Left Sidebar: Task Navigator */}
                    <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
                        <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest text-center mb-1">Tasks</p>
                        {questions.map((_: any, i: number) => {
                            const qId = questions[i]?.id;
                            const isAnswered = answers[qId] !== undefined && answers[qId] !== "";
                            const isCurrent = i === currentIdx;
                            return (
                                <button key={i} onClick={() => setCurrentIdx(i)}
                                    className={`w-12 h-12 mx-auto rounded-xl font-bold text-sm transition-all border-2 ${isCurrent
                                        ? 'border-accent-green bg-accent-green text-white shadow-lg shadow-accent-green/30'
                                        : isAnswered
                                            ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                                            : 'border-border-color bg-bg-card text-text-secondary hover:border-accent-green/40'
                                        }`}>
                                    {i + 1}
                                </button>
                            );
                        })}
                        <div className="mt-3 pt-3 border-t border-border-color text-center">
                            <p className="text-[9px] text-text-secondary">
                                {Object.values(answers).filter((a: any) => a && a !== "").length}/{questions.length}
                            </p>
                            <p className="text-[9px] text-accent-blue font-bold">done</p>
                        </div>
                    </div>

                    {/* Right: Task Area */}
                    <div className="flex-1">
                        <motion.div key={currentIdx}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="bg-bg-secondary p-8 rounded-[2.5rem] border border-border-color shadow-2xl space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold font-sora">{currentQ.title}</h3>
                                <span className="text-[10px] bg-bg-card px-3 py-1 rounded-full border border-border-color text-text-secondary font-bold uppercase">
                                    {currentQ.category}
                                </span>
                            </div>

                            <div className="p-6 bg-accent-green/5 border border-accent-green/20 rounded-2xl">
                                <p className="text-text-primary leading-relaxed">{currentQ.scenario}</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> {currentQ.instruction}
                                </label>
                                <textarea
                                    className="w-full h-56 bg-bg-card border border-border-color rounded-2xl p-6 outline-none focus:border-accent-green resize-none leading-relaxed transition-all"
                                    placeholder="Type your response here..."
                                    value={answers[currentQ.id] || ""}
                                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                                />
                            </div>
                        </motion.div>

                        <div className="mt-6 flex items-center justify-between">
                            <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                                disabled={currentIdx === 0}
                                className="px-8 py-3 rounded-xl border border-border-color text-text-secondary font-bold hover:text-white disabled:opacity-30">
                                Previous Task
                            </button>

                            {currentIdx < questions.length - 1 ? (
                                <button onClick={() => setCurrentIdx(currentIdx + 1)}
                                    className="px-8 py-4 rounded-xl bg-accent-green text-white font-bold flex items-center gap-2 hover:bg-green-600 transition-all font-sora shadow-lg shadow-accent-green/20">
                                    Save & Next Task <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isSubmitting}
                                    className="px-10 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent-blue/30">
                                    {isSubmitting ? "Generating DNA Report..." : "Complete Interview"} <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoundLoading() {
    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mb-8 border border-accent-green/20">
                <FileEdit className="text-accent-green w-10 h-10" />
            </motion.div>
            <h1 className="text-2xl font-bold font-sora mb-4">Setting the Final Stage...</h1>
            <p className="text-text-secondary max-w-sm">
                Creating written communication scenarios tailored to your profile.
            </p>
        </div>
    )
}
