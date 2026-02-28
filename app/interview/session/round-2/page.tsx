"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Terminal,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Brain,
    Code2,
    AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Round2Page() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

    const router = useRouter();

    useEffect(() => {
        const fetchQuestions = async () => {
            const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
            try {
                const res = await fetch("/api/round-2/questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobData }),
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

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0 && !result && !loading) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !result) {
            handleSubmit();
        }
    }, [timeLeft, result, loading]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
        const resumeDataStr = sessionStorage.getItem("parsed_resume");
        const round1Score = parseInt(sessionStorage.getItem("round1_score") || "0");

        try {
            // 1. Evaluate Technical Round
            const res = await fetch("/api/round-2/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, questions, jobData }),
            });
            const data = await res.json();

            if (!data.success) throw new Error("Round 2 Eval failed");

            const r2Score = Math.round(data.data.score);
            sessionStorage.setItem("round2_score", JSON.stringify(r2Score));

            // 2. Drive Match Audit (only if mode === 'drive')
            if (jobData.mode === 'drive') {
                const parsedResume = resumeDataStr ? JSON.parse(resumeDataStr) : null;
                const projects = parsedResume?.projects || [];

                const auditRes = await fetch("/api/project-audit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: jobData.role, projects, userId: user?.id, driveRegId: jobData.driveRegId }),
                });

                const auditData = await auditRes.json();
                if (auditData.success && !auditData.auditPassed) {
                    // TERMINATION Logic
                    if (user) {
                        const overall = Math.round(((round1Score / 100) + (r2Score / 100)) / 5 * 10);
                        await supabase.from("interviews").insert({
                            user_id: user.id,
                            role: jobData.role,
                            avg_score: overall,
                            status: "Screened Out",
                            rejection_reason: "Weak Project Audit",
                            drive_id: jobData.driveId || null
                        });

                        await supabase.from("drive_registrations")
                            .update({ status: "Screened Out" })
                            .eq("id", jobData.driveRegId);
                    }
                    alert("INTERVIEW TERMINATED: Your uploaded resume projects failed to demonstrate the 30% baseline required for this campus drive.");
                    setResult(null);
                    router.push("/dashboard");
                    return;
                }
            }

            setResult(data.data);

        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <RoundLoading round="Round 2: Technical Skills" />;

    if (result) return <RoundResult result={result} onNext={() => router.push("/interview/session/round-3")} />;

    const currentQ = questions[currentIdx];

    // Guard: if questions failed to load
    if (!currentQ) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
                <Code2 className="w-16 h-16 text-accent-red mb-6 opacity-70" />
                <h1 className="text-2xl font-bold font-sora mb-3">Questions Failed to Load</h1>
                <p className="text-text-secondary max-w-sm mb-8">
                    Could not generate technical questions. Please go back to setup and try again.
                </p>
                <button
                    onClick={() => router.push("/interview/setup")}
                    className="px-8 py-3 bg-accent-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-all"
                >
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
                        <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center border border-accent-purple/20">
                            <Terminal className="text-accent-purple w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg font-sora">Technical Round</h2>
                            <p className="text-xs text-text-secondary">Question {currentIdx + 1} of {questions.length}</p>
                        </div>
                    </div>
                    <div className={`px-6 py-2 rounded-2xl border flex items-center gap-2 font-bold text-lg ${timeLeft < 180 ? 'bg-accent-red/10 border-accent-red text-accent-red animate-pulse' : 'bg-bg-secondary border-border-color'}`}>
                        <Terminal className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Left Sidebar: Question Navigator */}
                    <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
                        <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest text-center mb-1">Q No.</p>
                        {questions.map((_: any, i: number) => {
                            const qId = questions[i]?.id;
                            const isAnswered = answers[qId] !== undefined && answers[qId] !== "";
                            const isCurrent = i === currentIdx;
                            const isShort = questions[i]?.type === 'short_answer';
                            return (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIdx(i)}
                                    className={`w-12 h-12 mx-auto rounded-xl font-bold text-sm transition-all border-2 ${isCurrent
                                        ? 'border-accent-purple bg-accent-purple text-white shadow-lg shadow-accent-purple/30'
                                        : isAnswered
                                            ? 'border-accent-green bg-accent-green/10 text-accent-green'
                                            : 'border-border-color bg-bg-card text-text-secondary hover:border-accent-purple/40'
                                        }`}
                                    title={isShort ? "Short Answer" : "MCQ"}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                        <div className="mt-3 pt-3 border-t border-border-color text-center">
                            <p className="text-[9px] text-text-secondary">{Object.keys(answers).length}/{questions.length}</p>
                            <p className="text-[9px] text-accent-green font-bold">done</p>
                        </div>
                    </div>

                    {/* Right: Question Area */}
                    <div className="flex-1">
                        <div className="bg-bg-secondary p-8 rounded-[2.5rem] border border-border-color shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-10 p-3 bg-bg-card border-x border-b border-border-color rounded-b-xl text-[10px] font-bold text-accent-purple uppercase tracking-widest">
                                {currentQ.topic}
                            </div>

                            <motion.div
                                key={currentIdx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex gap-3 pt-2">
                                    <span className="text-accent-purple font-bold text-xl font-sora shrink-0">Q.</span>
                                    <h3 className="text-xl font-bold font-sora leading-normal">{currentQ.question}</h3>
                                </div>

                                {currentQ.type === 'short_answer' ? (
                                    <div className="space-y-4">
                                        <textarea
                                            className="w-full h-40 bg-bg-card border border-border-color rounded-2xl p-6 outline-none focus:border-accent-purple resize-none leading-relaxed transition-all"
                                            placeholder="Type your brief explanation here..."
                                            value={answers[currentQ.id] || ""}
                                            onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                                        />
                                        <p className="text-xs text-text-secondary italic">
                                            <span className="font-bold text-accent-purple">Tip:</span> Keep it concise and technical. Focus on the 'Why' and 'How'.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {currentQ.options?.map((option: string, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setAnswers({ ...answers, [currentQ.id]: idx })}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${answers[currentQ.id] === idx ? 'border-accent-purple bg-accent-purple/5' : 'border-border-color bg-bg-card hover:border-accent-purple/30'}`}
                                            >
                                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border shrink-0 ${answers[currentQ.id] === idx ? 'bg-accent-purple text-white border-accent-purple' : 'bg-bg-secondary text-text-secondary border-border-color'}`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className="font-medium">{option}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                                disabled={currentIdx === 0}
                                className="px-8 py-3 rounded-xl border border-border-color text-text-secondary font-bold hover:text-white disabled:opacity-30"
                            >
                                Previous
                            </button>

                            {currentIdx < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentIdx(currentIdx + 1)}
                                    className="px-8 py-4 rounded-xl bg-accent-purple text-white font-bold flex items-center gap-2 hover:bg-purple-600 transition-all shadow-lg shadow-accent-purple/20"
                                >
                                    Next Question <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-10 py-4 rounded-xl bg-accent-green text-white font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-accent-green/20"
                                >
                                    {isSubmitting ? "Grading..." : "Submit Technical Round"} <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoundLoading({ round }: any) {
    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                animate={{ rotate: [0, 90, 180, 270, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 bg-accent-purple/10 rounded-full flex items-center justify-center mb-8 border border-accent-purple/20"
            >
                <Code2 className="text-accent-purple w-10 h-10" />
            </motion.div>
            <h1 className="text-2xl font-bold font-sora mb-4">Generating Technical Test...</h1>
            <p className="text-text-secondary max-w-sm">
                Creating 10 high-impact {round} based on your target role.
            </p>
        </div>
    )
}

function RoundResult({ result, onNext }: any) {
    const [isDrive, setIsDrive] = useState(false);

    useEffect(() => {
        const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
        setIsDrive(jobData.mode === 'drive');
    }, []);

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-bg-secondary p-10 rounded-[2.5rem] border border-border-color text-center shadow-2xl"
            >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${(result.passed || isDrive) ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                    {(result.passed || isDrive) ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>

                <h2 className="text-3xl font-bold font-sora mb-2">
                    {isDrive ? 'Technical Evaluation Saved' : (result.passed ? 'Technical Level: Approved' : 'Keep Learning')}
                </h2>

                {!isDrive && (
                    <div className="text-5xl font-bold text-accent-purple mb-4">{result.score}%</div>
                )}

                {isDrive && (
                    <div className="my-6 p-4 bg-accent-purple/10 border border-accent-purple/20 rounded-xl">
                        <p className="text-sm font-bold text-accent-purple flex items-center justify-center gap-2">
                            <Brain className="w-5 h-5" /> Silent Drive Evaluation
                        </p>
                        <p className="text-xs text-text-secondary mt-2">
                            Your scores and feedback are being securely compiled for the final TPO report.
                        </p>
                    </div>
                )}

                {!isDrive && (
                    <p className="text-text-secondary mb-8 text-sm italic">
                        "{result.summary}"
                    </p>
                )}

                {(result.passed || isDrive) ? (
                    <button
                        onClick={onNext}
                        className="w-full bg-accent-purple hover:bg-purple-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-accent-purple/20 flex items-center justify-center gap-2"
                    >
                        Proceed to Round 3 <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full border border-border-color hover:border-white text-text-primary font-bold py-4 rounded-2xl transition-all"
                    >
                        Retake Test
                    </button>
                )}
            </motion.div>
        </div>
    )
}
