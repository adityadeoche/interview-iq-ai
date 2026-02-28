"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    ChevronRight,
    CheckCircle2,
    XCircle,
    History,
    Brain,
    AlertCircle,
    Timer,
    FileSearch
} from "lucide-react";
import { motion } from "framer-motion";

export default function Round3Page() {
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
            const resumeData = JSON.parse(sessionStorage.getItem("parsed_resume") || "{}");
            try {
                const res = await fetch("/api/round-3/questions", {
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

    // Countdown timer — auto-submit when it hits 0
    useEffect(() => {
        if (timeLeft > 0 && !result && !loading) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !result && !loading) {
            handleSubmit();
        }
    }, [timeLeft, result, loading]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const resumeData = JSON.parse(sessionStorage.getItem("parsed_resume") || "{}");
        const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
        try {
            const res = await fetch("/api/round-3/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, questions, resumeData, jobData }),
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.data);
                sessionStorage.setItem("round3_score", JSON.stringify(Math.round(data.data.score)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <RoundLoading round="Round 3: Resume Deep-Dive" />;
    if (result) return <RoundResult result={result} onNext={() => router.push("/interview/session/round-4")} />;

    const currentQ = questions[currentIdx];

    if (!currentQ) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-16 h-16 text-accent-red mb-6 opacity-70" />
                <h1 className="text-2xl font-bold font-sora mb-3">Questions Failed to Load</h1>
                <p className="text-text-secondary max-w-sm mb-8">
                    Could not generate resume-based questions. Please go back and try again.
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
                        <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center border border-accent-blue/20">
                            <FileText className="text-accent-blue w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg font-sora">Resume Deep-Dive</h2>
                            <p className="text-xs text-text-secondary">Question {currentIdx + 1} of {questions.length} · Based on your resume</p>
                        </div>
                    </div>
                    <div className={`px-6 py-2 rounded-2xl border flex items-center gap-2 font-bold text-lg ${timeLeft < 180 ? 'bg-accent-red/10 border-accent-red text-accent-red animate-pulse' : 'bg-bg-secondary border-border-color'}`}>
                        <Timer className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Resume-based info banner */}
                <div className="mb-4 p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="text-accent-blue w-4 h-4 shrink-0" />
                    <p className="text-xs text-text-secondary">
                        Questions are generated strictly from <strong className="text-text-primary">your uploaded resume</strong> — answers should reflect your real experience.
                    </p>
                </div>

                <div className="flex gap-6">
                    {/* Left Sidebar: Question Navigator */}
                    <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
                        <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest text-center mb-1">Q No.</p>
                        {questions.map((_: any, i: number) => {
                            const qId = questions[i]?.id;
                            const isAnswered = answers[qId] !== undefined;
                            const isCurrent = i === currentIdx;
                            return (
                                <button key={i} onClick={() => setCurrentIdx(i)}
                                    className={`w-12 h-12 mx-auto rounded-xl font-bold text-sm transition-all border-2 ${isCurrent
                                        ? 'border-accent-blue bg-accent-blue text-white shadow-lg shadow-accent-blue/30'
                                        : isAnswered
                                            ? 'border-accent-green bg-accent-green/10 text-accent-green'
                                            : 'border-border-color bg-bg-card text-text-secondary hover:border-accent-blue/40'
                                        }`}>
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
                            <div className="absolute top-0 right-10 p-3 bg-bg-card border-x border-b border-border-color rounded-b-xl text-[10px] font-bold text-accent-blue uppercase tracking-widest">
                                {currentQ.context}
                            </div>

                            <motion.div key={currentIdx}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8">
                                <h3 className="text-xl font-bold font-sora leading-normal pt-2">
                                    {currentQ.question}
                                </h3>

                                <div className="grid grid-cols-1 gap-3">
                                    {currentQ.options.map((option: string, idx: number) => (
                                        <button key={idx}
                                            onClick={() => setAnswers({ ...answers, [currentQ.id]: idx })}
                                            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${answers[currentQ.id] === idx ? 'border-accent-blue bg-accent-blue/5' : 'border-border-color bg-bg-card hover:border-accent-blue/40'}`}>
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border shrink-0 ${answers[currentQ.id] === idx ? 'bg-accent-blue text-white border-accent-blue' : 'bg-bg-secondary text-text-secondary border-border-color'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="font-medium">{option}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                                disabled={currentIdx === 0}
                                className="px-8 py-3 rounded-xl border border-border-color text-text-secondary font-bold hover:text-white disabled:opacity-30">
                                Previous
                            </button>

                            {currentIdx < questions.length - 1 ? (
                                <button onClick={() => setCurrentIdx(currentIdx + 1)}
                                    className="px-8 py-4 rounded-xl bg-accent-blue text-white font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-accent-blue/20">
                                    Next Question <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isSubmitting}
                                    className="px-10 py-4 rounded-xl bg-accent-green text-white font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-accent-green/20">
                                    {isSubmitting ? "Analyzing..." : "Finish Resume Check"} <CheckCircle2 className="w-5 h-5" />
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
            <motion.div animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mb-8 border border-accent-blue/20">
                <FileText className="text-accent-blue w-10 h-10" />
            </motion.div>
            <h1 className="text-2xl font-bold font-sora mb-4">Analysing Your Resume...</h1>
            <p className="text-text-secondary max-w-sm">
                AI is reading your uploaded resume to craft personalized {round} questions.
            </p>
        </div>
    )
}

function RoundResult({ result, onNext }: any) {
    const [countdown, setCountdown] = useState(3);
    const [isDrive, setIsDrive] = useState(false);

    useEffect(() => {
        const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
        setIsDrive(jobData.mode === 'drive');
    }, []);

    useEffect(() => {
        if (!result.passed && !isDrive) return;
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [result.passed, countdown, isDrive]);

    useEffect(() => {
        if ((result.passed || isDrive) && countdown === 0) onNext();
    }, [countdown, result.passed, isDrive]);

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-bg-secondary p-10 rounded-[2.5rem] border border-border-color text-center shadow-2xl">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${(result.passed || isDrive) ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                    {(result.passed || isDrive) ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>
                <h2 className="text-3xl font-bold font-sora mb-2">
                    {isDrive ? 'Resume Verification Saved' : (result.passed ? 'Authenticity Verified! 🎉' : 'Gaps Detected')}
                </h2>

                {!isDrive && (
                    <div className="text-5xl font-bold text-accent-blue mb-4">{Math.round(result.score)}%</div>
                )}

                {isDrive && (
                    <div className="my-6 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
                        <p className="text-sm font-bold text-accent-blue flex items-center justify-center gap-2">
                            <Brain className="w-5 h-5" /> Silent Drive Evaluation
                        </p>
                        <p className="text-xs text-text-secondary mt-2">
                            Your scores and feedback are being securely compiled for the final TPO report.
                        </p>
                    </div>
                )}

                {!isDrive && (
                    <p className="text-text-secondary mb-8 text-sm italic">&ldquo;{result.summary}&rdquo;</p>
                )}

                {(result.passed || isDrive) ? (
                    <div className="space-y-4">
                        <div className="w-full bg-accent-green/10 border border-accent-green/30 rounded-2xl py-4 px-6">
                            <p className="text-accent-green font-bold text-sm">Proceeding to Round 4 in {countdown}s...</p>
                            <div className="mt-2 h-1.5 bg-bg-card rounded-full overflow-hidden">
                                <motion.div className="h-full bg-accent-green"
                                    initial={{ width: "100%" }} animate={{ width: "0%" }}
                                    transition={{ duration: 3, ease: "linear" }} />
                            </div>
                        </div>
                        <button onClick={onNext}
                            className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-accent-blue/20 flex items-center justify-center gap-2">
                            Go Now <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => window.location.reload()}
                        className="w-full border border-border-color hover:border-white text-text-primary font-bold py-4 rounded-2xl transition-all">
                        Retry Round
                    </button>
                )}
            </motion.div>
        </div>
    )
}
