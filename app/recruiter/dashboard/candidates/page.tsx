"use client";

import { useState, useEffect } from "react";
// Lucide icons
import { Search, Filter, Star, MapPin, Building2, ExternalLink, Download, CheckCircle2, XCircle, Briefcase, Loader2, Users } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AllCandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId");

    useEffect(() => {
        async function fetchCandidates() {
            setLoading(true);
            try {
                let studentIds: string[] = [];
                let hasFilteredIds = false;
                let studentJobMap: Record<string, string[]> = {};

                // 1. If a specific job is selected, fetch its registered students
                if (jobId) {
                    const { data: jobInfo } = await supabase.from("jobs").select("title").eq("id", jobId).single();
                    const jobTitle = jobInfo?.title || "Unknown Job";

                    const { data: regs } = await supabase
                        .from("drive_registrations")
                        .select("student_id")
                        .eq("job_id", jobId);

                    if (regs && regs.length > 0) {
                        studentIds = regs.map((r: any) => r.student_id);
                        hasFilteredIds = true;

                        studentIds.forEach(id => {
                            if (!studentJobMap[id]) studentJobMap[id] = [];
                            studentJobMap[id].push(jobTitle);
                        });
                    } else {
                        // Specific Job has no applicants, exit early
                        setCandidates([]);
                        setLoading(false);
                        return;
                    }
                } else {
                    // 2. No specific job selected. We must only show candidates who applied to ANY of this HR's jobs.
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        // Find all jobs owned by this HR
                        const { data: myJobs } = await supabase
                            .from("jobs")
                            .select("id, title")
                            .eq("recruiter_id", user.id);

                        if (myJobs && myJobs.length > 0) {
                            const myJobIds = myJobs.map((j: any) => j.id);
                            const jobTitleMap: Record<string, string> = {};
                            myJobs.forEach((j: any) => { jobTitleMap[j.id] = j.title; });

                            // Find all students who registered for these jobs
                            const { data: globalRegs } = await supabase
                                .from("drive_registrations")
                                .select("student_id, job_id")
                                .in("job_id", myJobIds);

                            if (globalRegs && globalRegs.length > 0) {
                                globalRegs.forEach((r: any) => {
                                    if (!studentJobMap[r.student_id]) studentJobMap[r.student_id] = [];
                                    const title = jobTitleMap[r.job_id];
                                    if (title && !studentJobMap[r.student_id].includes(title)) {
                                        studentJobMap[r.student_id].push(title);
                                    }
                                    if (!studentIds.includes(r.student_id)) {
                                        studentIds.push(r.student_id);
                                    }
                                });
                                hasFilteredIds = true;
                            } else {
                                // HR has jobs, but zero applicants across all jobs
                                setCandidates([]);
                                setLoading(false);
                                return;
                            }
                        } else {
                            // HR has no jobs created at all
                            setCandidates([]);
                            setLoading(false);
                            return;
                        }
                    } else {
                        setCandidates([]);
                        setLoading(false);
                        return;
                    }
                }

                // 3. Fetch student profiles using the resolved IDs
                let query = supabase
                    .from("profiles")
                    .select("*")
                    .eq("role", "student")
                    .order("created_at", { ascending: false });

                if (hasFilteredIds && studentIds.length > 0) {
                    query = query.in("id", studentIds);
                }

                const { data: profiles, error: profileError } = await query;

                // Fetch all their interviews to find their highest/latest scores
                const { data: interviews, error: interviewError } = await supabase
                    .from("interviews")
                    .select("user_id, avg_score, status, transcript")
                    .order("created_at", { ascending: false });

                if (profiles) {
                    const formattedCandidates = profiles.map((profile: any) => {
                        // Find this user's interviews
                        const userInterviews = interviews?.filter((i: any) => i.user_id === profile.id) || [];

                        // Default values
                        let displayScore = 0; // If they have no interviews
                        let status = "Not Evaluated";

                        if (userInterviews.length > 0) {
                            // Find if any interview was Screened Out
                            const screenedOut = userInterviews.find((i: any) => i.status === 'Screened Out');
                            const completed = userInterviews.find((i: any) => i.status === 'Completed');

                            if (screenedOut) {
                                status = "Technical Gap";
                                displayScore = screenedOut.avg_score || 0; // avg_score holds Project Match Score here
                            } else if (completed) {
                                status = "Evaluated";
                                displayScore = completed.avg_score || 0;
                            } else {
                                status = "In Progress";
                            }
                        }

                        return {
                            id: profile.id,
                            name: profile.full_name || "Unknown Candidate",
                            role: profile.resume_role || "Student",
                            college: profile.college_name || "Not Specified",
                            location: "No Location",
                            score: displayScore,
                            status: status,
                            matchedSkills: profile.resume_projects ? ["Has Resume"] : ["No Resume Set"],
                            missingSkills: [],
                            experience: "Fresher",
                            appliedJobs: studentJobMap[profile.id] || []
                        };
                    });

                    setCandidates(formattedCandidates);
                }
            } catch (err) {
                console.error("Failed to fetch candidates:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCandidates();
    }, []);

    const filteredCandidates = candidates.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sora">Candidate Talent Pool</h1>
                    <p className="text-text-secondary mt-1">Review verified candidates from the platform.</p>
                </div>

                <button className="flex items-center gap-2 bg-bg-secondary border border-border-color hover:border-accent-blue px-5 py-2.5 rounded-xl font-bold transition-all text-sm">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-bg-secondary border border-border-color rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search candidates by name, college, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-card border border-border-color rounded-xl py-3 pl-12 pr-4 outline-none focus:border-accent-blue transition-colors text-sm"
                    />
                </div>

                <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 bg-bg-card border border-border-color hover:border-accent-blue px-4 py-3 rounded-xl transition-all text-sm">
                        <Filter className="w-4 h-4" />
                        More Filters
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col flex-1 items-center justify-center p-20 text-text-secondary border border-border-color bg-bg-secondary rounded-3xl">
                    <Loader2 className="w-10 h-10 animate-spin text-accent-blue mb-4" />
                    <p className="font-bold">Fetching verified candidates...</p>
                </div>
            )}

            {/* Candidates Grid */}
            {!loading && filteredCandidates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCandidates.map((candidate, index) => (
                        <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-bg-secondary border border-border-color rounded-3xl p-6 hover:border-accent-blue/40 transition-all flex flex-col h-full group"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center font-bold text-lg text-accent-blue shrink-0">
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 pr-2">
                                        <h3 className="font-bold text-lg truncate group-hover:text-accent-blue transition-colors">
                                            {candidate.name}
                                        </h3>
                                        <p className="text-xs text-text-secondary truncate">{candidate.role}</p>
                                    </div>
                                </div>

                                <div className={`bg-bg-card border border-border-color px-3 py-1.5 rounded-xl flex items-center justify-center flex-col shrink-0 ${candidate.status === 'Technical Gap' ? 'border-accent-purple/30 bg-accent-purple/5' : ''}`}>
                                    <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider text-center">
                                        {candidate.status === 'Technical Gap' ? 'Project Match' : 'Score'}
                                    </span>
                                    <span className={`font-bold font-sora ${candidate.status === 'Technical Gap' ? 'text-accent-purple' :
                                        candidate.score >= 90 ? 'text-accent-green' :
                                            candidate.score >= 75 ? 'text-accent-yellow' : 'text-accent-red'
                                        }`}>{candidate.score}%</span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-2 text-sm text-text-secondary w-full">
                                    <Building2 className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{candidate.college}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-text-secondary w-full">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{candidate.location}</span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-sm text-text-secondary w-full">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 shrink-0" />
                                        <span>Applied Drives:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 ml-6">
                                        {candidate.appliedJobs.length > 0 ? (
                                            candidate.appliedJobs.map((jobTitle: string, idx: number) => (
                                                <span key={idx} className="bg-accent-blue/10 border border-accent-blue/20 text-accent-blue px-2.5 py-1 rounded-md text-[10px] font-bold truncate max-w-full">
                                                    {jobTitle}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs italic opacity-70">No target drive</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Skills Match */}
                            <div className="mb-6 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Top Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {candidate.matchedSkills.slice(0, 3).map((skill: string) => (
                                        <span key={skill} className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-[10px] px-2 py-1 rounded-md font-bold">
                                            {skill}
                                        </span>
                                    ))}
                                    {candidate.missingSkills.length > 0 && (
                                        <span className="bg-bg-card text-text-secondary border border-border-color text-[10px] px-2 py-1 rounded-md line-through title" title={`Missing: ${candidate.missingSkills.join(', ')}`}>
                                            {candidate.missingSkills[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border-color shrink-0">
                                <button className="flex-1 bg-bg-card hover:bg-accent-blue hover:text-white border border-border-color hover:border-accent-blue text-sm font-bold py-2.5 rounded-xl transition-all">
                                    View Profile
                                </button>
                                <button className="flex items-center justify-center p-2.5 bg-bg-card border border-border-color hover:border-accent-green hover:text-accent-green hover:bg-accent-green/10 rounded-xl transition-all" title="Shortlist">
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button className="flex items-center justify-center p-2.5 bg-bg-card border border-border-color hover:border-accent-red hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all" title="Reject">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && filteredCandidates.length === 0 && (
                <div className="text-center py-20 bg-bg-secondary rounded-3xl border border-border-color">
                    <div className="w-16 h-16 bg-bg-card border border-border-color rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Candidates Found</h3>
                    <p className="text-text-secondary max-w-sm mx-auto">
                        {searchTerm ? "No candidates match your search." : "There are currently no registered candidates on the platform."}
                    </p>
                </div>
            )}
        </div>
    );
}
