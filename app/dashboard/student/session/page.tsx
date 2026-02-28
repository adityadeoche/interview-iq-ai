"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Send,
    BrainCircuit,
    MessageSquare,
    Zap,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    History,
    Timer,
    ChevronLeft,
    Search,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    feedback?: string;
    score?: number;
    confidence?: number;
    isProbe?: boolean;
}

export default function InterviewSessionPage() {
    const [config, setConfig] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [avgScore, setAvgScore] = useState(5);
    const [latestConfidence, setLatestConfidence] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const [resultId, setResultId] = useState<string | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isScreenedOut, setIsScreenedOut] = useState(false);
    const [auditReason, setAuditReason] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const storedConfig = sessionStorage.getItem("current_interview_config");
        if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            setConfig(parsed);
            startInterview(parsed);
        } else {
            router.push("/dashboard/student/new");
        }
        const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const formatTime = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const s = sec % 60;
        return `${mins}:${s.toString().padStart(2, '0')}`;
    };

    const startInterview = async (conf: any) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/interview/start", {
                method: "POST",
                body: JSON.stringify(conf),
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error || "Failed to start interview");
            setMessages([{ role: 'assistant', content: result.data.question }]);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please check your Gemini API quota.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!currentAnswer.trim() || sending || isFinished) return;

        setSending(true);
        setError(null);
        const newUserMessage: Message = { role: 'user', content: currentAnswer };
        const updatedHistory = [...messages, newUserMessage];
        setMessages(updatedHistory);
        setCurrentAnswer("");

        try {
            const res = await fetch("/api/interview/chat", {
                method: "POST",
                body: JSON.stringify({
                    role: config.role,
                    projects: config.projects,
                    history: updatedHistory,
                    answer: currentAnswer,
                    questionCount,
                    avgScore,
                }),
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error || "Failed to analyze answer");

            const { data } = result;
            const newScore = data.score || 5;
            const newConfidence = data.confidence || 5;
            const newCount = questionCount + 1;

            // Update running averages
            setQuestionCount(newCount);
            setAvgScore(prev => Math.round((prev * questionCount + newScore) / newCount));
            setLatestConfidence(newConfidence);

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    feedback: data.feedback,
                    score: newScore,
                    confidence: newConfidence,
                    isProbe: data.isProbe,
                };
                if (data.nextQuestion && !data.isFinished) {
                    updated.push({ role: 'assistant', content: data.nextQuestion, isProbe: data.isProbe });
                }
                return updated;
            });

            if (data.isScreenedOut) {
                setIsFinished(true);
                setIsScreenedOut(true);
                setAuditReason(data.auditReason);
                await saveInterview(updatedHistory, data.projectMatchScore || 0, config, 'Screened Out', 'Weak Project Audit');
                return;
            }

            if (data.isFinished) {
                setIsFinished(true);
                await saveInterview(updatedHistory, avgScore, config, 'Completed');
            }
        } catch (err: any) {
            setError(err.message || "AI Analysis failed. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const saveInterview = async (transcript: Message[], finalAvgScore: number, conf: any, status: string = 'Completed', rejectionReason?: string) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/interview/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: conf.role,
                    transcript,
                    avgScore: finalAvgScore,
                    status,
                    rejectionReason
                }),
            });
            const result = await res.json();
            if (result.success) setResultId(result.id);
        } catch (err) {
            console.error("Failed to save interview:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const confidenceColor = latestConfidence >= 7
        ? 'bg-accent-green'
        : latestConfidence >= 4
            ? 'bg-accent-yellow'
            : 'bg-accent-red';

    if (loading) return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-8">
            <BrainCircuit className="w-16 h-16 text-accent-blue animate-pulse" />
            <div className="text-center">
                <h2 className="text-2xl font-bold font-sora">Calibrating Interviewer...</h2>
                <p className="text-text-secondary mt-2">Setting up the probe for {config?.role}</p>
            </div>
        </div>
    );

    if (error && messages.length === 0) return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-bg-card border border-accent-red/20 p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto">
                    <History className="text-accent-red w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-sora text-accent-red">System Hiccup</h2>
                    <p className="text-text-secondary text-sm leading-relaxed">{error}</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => startInterview(config)} className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all">Try Again</button>
                    <button onClick={() => router.push("/dashboard")} className="w-full bg-bg-secondary border border-border-color font-bold py-4 rounded-2xl transition-all">Back to Dashboard</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col h-screen overflow-hidden">
            {/* Session Header */}
            <div className="bg-bg-secondary/50 backdrop-blur-xl border-b border-border-color p-4 md:px-8 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-bg-card rounded-xl transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-bold font-sora text-sm md:text-base">{config?.role} Interview</h2>
                        <div className="flex items-center gap-4 mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-accent-green flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Live Session
                            </span>
                            <span className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1">
                                <Timer className="w-3 h-3" /> {formatTime(timeElapsed)}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Q{questionCount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Confidence Meter */}
                <div className="hidden md:flex flex-col items-center gap-1 min-w-[120px]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Confidence</span>
                    <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden border border-border-color">
                        <motion.div
                            animate={{ width: `${(latestConfidence / 10) * 100}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full ${confidenceColor}`}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary">{latestConfidence}/10</span>
                </div>

                <div className="flex items-center gap-3">
                    {avgScore >= 8 && questionCount >= 3 && (
                        <span className="hidden md:flex items-center gap-1 text-[10px] font-bold text-accent-green bg-accent-green/10 px-3 py-1 rounded-full border border-accent-green/20">
                            <TrendingUp className="w-3 h-3" /> Expert Mode
                        </span>
                    )}
                    {avgScore < 4 && questionCount >= 2 && (
                        <span className="hidden md:flex items-center gap-1 text-[10px] font-bold text-accent-yellow bg-accent-yellow/10 px-3 py-1 rounded-full border border-accent-yellow/20">
                            <TrendingDown className="w-3 h-3" /> Foundational Mode
                        </span>
                    )}
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="hidden md:flex items-center gap-2 bg-bg-card hover:bg-bg-secondary px-4 py-2 rounded-xl border border-border-color text-xs font-bold transition-all"
                    >
                        <History className="w-4 h-4" /> Save & Exit
                    </button>
                    {isFinished && resultId && (
                        <button
                            className="bg-accent-green px-5 py-2 rounded-xl text-white font-bold text-xs"
                            onClick={() => router.push(`/dashboard/student/results/${resultId}`)}
                        >
                            View Final Report
                        </button>
                    )}
                    {isFinished && isSaving && (
                        <span className="text-xs text-text-secondary animate-pulse">Saving...</span>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-12 pb-24">
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className="max-w-[85%] md:max-w-[70%] space-y-3">
                                    {/* Probe badge */}
                                    {msg.role === 'assistant' && msg.isProbe && i > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-1.5 text-accent-purple text-[10px] font-bold uppercase tracking-widest mb-1"
                                        >
                                            <Search className="w-3 h-3" /> Probing Deeper...
                                        </motion.div>
                                    )}
                                    <div className={`p-6 rounded-3xl ${msg.role === 'user'
                                        ? 'bg-accent-blue text-white shadow-xl shadow-accent-blue/10 rounded-tr-none'
                                        : 'bg-bg-secondary border border-border-color rounded-tl-none'
                                        }`}>
                                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>

                                    {/* Feedback panel */}
                                    {msg.feedback && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-accent-purple/5 border border-accent-purple/20 p-4 rounded-2xl"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap className="text-accent-purple w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">Interviewer Insights</span>
                                                <div className="ml-auto flex gap-1">
                                                    {[...Array(10)].map((_, j) => (
                                                        <div key={j} className={`w-1 h-3 rounded-full ${j < (msg.score || 0) ? 'bg-accent-purple' : 'bg-bg-card'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-text-secondary leading-relaxed italic">{msg.feedback}</p>
                                            {msg.confidence !== undefined && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[10px] text-text-secondary">Confidence detected:</span>
                                                    <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden">
                                                        <div
                                                            style={{ width: `${(msg.confidence / 10) * 100}%` }}
                                                            className={`h-full rounded-full ${msg.confidence >= 7 ? 'bg-accent-green' : msg.confidence >= 4 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold">{msg.confidence}/10</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {sending && (
                        <div className="flex justify-start">
                            <div className="bg-bg-secondary border border-border-color rounded-3xl p-6 flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                                <span className="text-xs font-bold text-text-secondary">AI is evaluating...</span>
                            </div>
                        </div>
                    )}

                    {error && messages.length > 0 && (
                        <div className="text-center">
                            <p className="text-accent-red text-sm bg-accent-red/10 px-4 py-3 rounded-xl border border-accent-red/20">
                                {error}
                            </p>
                        </div>
                    )}

                    {isFinished && isScreenedOut && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-accent-red/10 border border-accent-red/30 p-8 rounded-[2.5rem] text-center space-y-6"
                        >
                            <div className="w-16 h-16 bg-accent-red rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent-red/20">
                                <ShieldCheck className="text-white w-8 h-8" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold font-sora text-accent-red">Interview Terminated</h3>
                                <p className="text-text-secondary text-sm">
                                    Based on the automated project audit, your technical profile does not meet the minimum 30% requirements for the <strong>{config?.role}</strong> role.
                                </p>
                                <div className="bg-bg-card p-4 rounded-xl border border-border-color text-left">
                                    <p className="text-xs font-bold uppercase text-text-secondary mb-2">Gatekeeper Feedback:</p>
                                    <p className="text-sm italic">{auditReason}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/dashboard`)}
                                className="bg-bg-card hover:bg-bg-secondary border border-border-color font-bold px-10 py-4 rounded-2xl transition-all flex items-center gap-2 mx-auto active:scale-95"
                            >
                                Return to Dashboard
                            </button>
                        </motion.div>
                    )}

                    {isFinished && !isScreenedOut && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-accent-green/10 border border-accent-green/30 p-8 rounded-[2.5rem] text-center space-y-6"
                        >
                            <div className="w-16 h-16 bg-accent-green rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent-green/20">
                                <CheckCircle2 className="text-white w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold font-sora">Interview Completed!</h3>
                                <p className="text-text-secondary text-sm">Your performance matrix is being generated. Average score: <strong>{avgScore}/10</strong></p>
                            </div>
                            {resultId ? (
                                <button
                                    onClick={() => router.push(`/dashboard/student/results/${resultId}`)}
                                    className="bg-accent-green hover:bg-green-600 text-white font-bold px-10 py-4 rounded-2xl transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-xl shadow-accent-green/10"
                                >
                                    Generate Final Report <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <p className="text-text-secondary text-sm animate-pulse">{isSaving ? "Saving interview..." : "Preparing report..."}</p>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Input Footer */}
            {!isFinished && (
                <div className="bg-bg-primary p-4 md:p-8 border-t border-border-color z-10">
                    <div className="max-w-4xl mx-auto relative group">
                        <textarea
                            className="w-full bg-bg-secondary border border-border-color rounded-2xl md:rounded-[2rem] p-6 pr-16 md:pr-24 outline-none focus:border-accent-blue min-h-[100px] md:min-h-[120px] max-h-[300px] resize-none transition-all text-sm md:text-base leading-relaxed group-focus-within:shadow-2xl group-focus-within:shadow-accent-blue/5"
                            placeholder="Type your detailed technical answer..."
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSend(); }}
                            disabled={sending}
                        />

                        <div className="absolute right-4 bottom-4 md:right-8 md:bottom-8 flex flex-col items-center gap-3">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest hidden md:block">Ctrl + Enter</span>
                            <button
                                onClick={handleSend}
                                disabled={!currentAnswer.trim() || sending}
                                className="bg-accent-blue hover:bg-blue-600 disabled:opacity-30 p-3 md:p-4 rounded-2xl text-white transition-all shadow-xl shadow-accent-blue/20 active:scale-90"
                            >
                                <Send className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* AI Thinking Overlay */}
                        <AnimatePresence>
                            {(sending || isAuditing) && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-bg-secondary/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl md:rounded-[2rem]"
                                >
                                    <div className={`border px-6 py-4 rounded-full flex items-center gap-3 shadow-2xl ${isAuditing
                                        ? 'bg-accent-purple/10 border-accent-purple/30 shadow-accent-purple/10'
                                        : 'bg-bg-card border-accent-blue/20 shadow-accent-blue/10'
                                        }`}>
                                        <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isAuditing ? 'border-accent-purple' : 'border-accent-blue'
                                            }`} />
                                        <span className={`text-sm font-bold font-sora ${isAuditing ? 'text-accent-purple' : 'text-accent-blue'
                                            }`}>
                                            {isAuditing ? 'Running Gatekeeper Audit...' : 'AI is Thinking...'}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
