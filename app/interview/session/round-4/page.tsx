"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Code2,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Play,
    Terminal,
    AlertCircle,
    Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Round4Page() {
    const [loading, setLoading] = useState(true);
    const [question, setQuestion] = useState<any>(null);
    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

    const router = useRouter();

    useEffect(() => {
        const fetchQuestion = async () => {
            const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
            const resumeData = JSON.parse(sessionStorage.getItem("parsed_resume") || "{}");
            try {
                const res = await fetch("/api/round-4/question", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobData, resumeData }),
                });
                const data = await res.json();
                if (data.success) {
                    setQuestion(data.data);
                    setCode(data.data.boilerplate);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestion();
    }, []);

    // 30-minute countdown — auto-submit when it hits 0
    useEffect(() => {
        if (timeLeft > 0 && !result && !loading) {
            const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
            return () => clearTimeout(t);
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
        const jobData = JSON.parse(sessionStorage.getItem("interview_setup") || "{}");
        try {
            const res = await fetch("/api/round-4/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, question, jobData }),
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.data);
                sessionStorage.setItem("round4_score", JSON.stringify(Math.round(data.data.score ?? data.data.overallScore ?? 70)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <RoundLoading round="Round 4: Coding Tasks" />;

    if (result) return <RoundResult result={result} onNext={() => router.push("/interview/session/round-5")} />;

    // Guard: if question failed to load
    if (!question) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
                <Code2 className="w-16 h-16 text-accent-red mb-6 opacity-70" />
                <h1 className="text-2xl font-bold font-sora mb-3">Problem Failed to Load</h1>
                <p className="text-text-secondary max-w-sm mb-8">
                    Could not generate a coding problem. Please go back to setup and try again.
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
        <div className="min-h-screen bg-bg-primary text-text-primary p-4">
            {/* Timer Bar */}
            <div className={`flex items-center justify-between px-8 py-3 mb-4 rounded-2xl border ${timeLeft < 300 ? 'bg-accent-red/10 border-accent-red text-accent-red animate-pulse' : 'bg-bg-secondary border-border-color'}`}>
                <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-accent-blue" />
                    <span className="font-bold font-sora">Round 4: Coding Challenge</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-xl">
                    <AlertCircle className={`w-5 h-5 ${timeLeft < 300 ? 'text-accent-red' : 'text-text-secondary'}`} />
                    {formatTime(timeLeft)} remaining
                </div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6" style={{ height: 'calc(100vh - 120px)' }}>

                {/* Left Side: Problem Statement */}
                <div className="flex-1 bg-bg-secondary rounded-3xl border border-border-color overflow-y-auto p-8 scrollbar-hide">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center border border-accent-blue/20">
                            <Terminal className="text-accent-blue w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold font-sora">{question.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${question.difficulty === 'Hard' ? 'text-accent-red border-accent-red/30 bg-accent-red/5' : question.difficulty === 'Medium' ? 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/5' : 'text-accent-green border-accent-green/30 bg-accent-green/5'}`}>
                            {question.difficulty}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3">Problem Statement</h3>
                            <p className="text-text-primary leading-relaxed text-lg">{question.problemStatement}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3">Constraints</h3>
                            <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                {question.constraints.map((c: string, i: number) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3">Examples</h3>
                            <div className="space-y-4">
                                {question.examples.map((ex: any, i: number) => (
                                    <div key={i} className="p-4 bg-bg-card rounded-xl border border-border-color">
                                        <p className="text-xs font-bold text-accent-blue mb-2">Example {i + 1}</p>
                                        <p className="text-sm mb-1 font-mono"><span className="text-text-secondary">Input:</span> {ex.input}</p>
                                        <p className="text-sm mb-1 font-mono"><span className="text-text-secondary">Output:</span> {ex.output}</p>
                                        <p className="text-xs text-text-secondary italic mt-2">{ex.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Code Editor */}
                <div className="flex-[1.5] flex flex-col gap-6">
                    <div className="flex-1 bg-bg-card rounded-3xl border border-border-color overflow-hidden flex flex-col">
                        <div className="bg-bg-secondary px-6 py-3 border-b border-border-color flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code2 className="text-text-secondary w-4 h-4" />
                                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{question.language} Editor</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-accent-red/20 border border-accent-red/40"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-accent-yellow/20 border border-accent-yellow/40"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-accent-green/20 border border-accent-green/40"></div>
                            </div>
                        </div>
                        <textarea
                            className="flex-1 bg-transparent p-8 font-mono text-sm outline-none resize-none leading-relaxed text-accent-blue"
                            spellCheck={false}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-bg-secondary px-4 py-2 rounded-lg border border-border-color">
                            <AlertCircle className="w-4 h-4" />
                            AI will evaluate your logic & complexity.
                        </div>
                        <button
                            disabled={isSubmitting}
                            onClick={handleSubmit}
                            className="bg-accent-blue hover:bg-blue-600 text-white font-bold px-10 py-4 rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-accent-blue/20"
                        >
                            {isSubmitting ? "Running AI Evaluation..." : "Submit Code Round"} <Play className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoundLoading({ round }: any) {
    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 relative mb-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-accent-blue border-r-transparent border-b-transparent border-l-transparent rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Code2 className="text-accent-blue w-8 h-8" />
                </div>
            </div>
            <h1 className="text-2xl font-bold font-sora mb-4">Constructing Coding Problem...</h1>
            <p className="text-text-secondary max-w-sm">
                Creating a role-specific {round} with custom test cases.
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
                className="max-w-2xl w-full bg-bg-secondary p-10 rounded-[2.5rem] border border-border-color shadow-2xl"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${(result.passed || isDrive) ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                            {(result.passed || isDrive) ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-sora">
                                {isDrive ? 'Code Execution Saved' : (result.passed ? 'Code Accepted' : 'Refine Your Logic')}
                            </h2>
                            {!isDrive && (
                                <p className="text-text-secondary text-sm">Score: <span className="text-text-primary font-bold">{result.score}%</span></p>
                            )}
                        </div>
                    </div>
                </div>

                {isDrive && (
                    <div className="mb-6 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-xl text-left">
                        <p className="text-sm font-bold text-accent-blue flex items-center justify-start gap-2">
                            <Brain className="w-5 h-5" /> Silent Drive Evaluation
                        </p>
                        <p className="text-xs text-text-secondary mt-2">
                            Your coding submission and tests scores have been securely compiled for the final TPO report.
                        </p>
                    </div>
                )}

                {!isDrive && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-bg-card p-6 rounded-2xl border border-border-color">
                            <h3 className="text-[10px] text-text-secondary uppercase font-bold mb-4 tracking-widest">Performance Analysis</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Time Complexity:</span>
                                    <span className="font-mono text-accent-blue">{result.complexity.time}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Space Complexity:</span>
                                    <span className="font-mono text-accent-blue">{result.complexity.space}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-bg-card p-6 rounded-2xl border border-border-color">
                            <h3 className="text-[10px] text-text-secondary uppercase font-bold mb-4 tracking-widest">Key Feedback</h3>
                            <ul className="space-y-2">
                                {result.feedback.map((f: string, i: number) => (
                                    <li key={i} className="flex gap-2 text-xs text-text-secondary">
                                        <span className="text-accent-blue">•</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {!isDrive && (
                    <p className="text-text-secondary mb-10 text-sm leading-relaxed border-l-2 border-border-color pl-4 italic">
                        "{result.analysis}"
                    </p>
                )}

                {(result.passed || isDrive) ? (
                    <button
                        onClick={onNext}
                        className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-accent-blue/20 flex items-center justify-center gap-2"
                    >
                        Proceed to Final Round <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full border border-border-color hover:border-white text-text-primary font-bold py-4 rounded-2xl transition-all"
                    >
                        Retry Problem
                    </button>
                )}
            </motion.div>
        </div>
    )
}
