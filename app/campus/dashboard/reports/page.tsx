"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    BarChart3, TrendingUp, Users, BookOpen,
    Award, ShieldCheck, Zap, Target,
    PieChart as PieIcon, LineChart as LineIcon,
    ChevronRight, Download
} from "lucide-react";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell,
    PieChart, Pie
} from "recharts";

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

export default function CampusReportsPage() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        verifiedProfiles: 0,
        activeDrives: 0,
        avgPlacementReady: 0,
        topScore: 0
    });
    const [branchData, setBranchData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const { count: totalStudents } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
            const { count: verifiedProfiles } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).not('grad_cgpa', 'is', null).eq('role', 'student');
            const { count: activeDrives } = await supabase.from('placement_drives').select('*', { count: 'exact', head: true }).in('status', ['Active', 'Upcoming', 'Ongoing']);

            // Fetch interview data for analytics
            const { data: interviews } = await supabase.from('interviews').select('avg_score, role');

            let avgReady = 0;
            let maxScore = 0;
            const branchMap: Record<string, number[]> = {
                "CS/IT": [], "E&TC": [], "Marketing": [], "Finance": [], "Other": []
            };

            if (interviews && interviews.length > 0) {
                const scores = interviews.map((i: any) => (i.avg_score || 0));
                avgReady = Math.round((interviews.filter((i: any) => i.avg_score >= 7).length / interviews.length) * 100);
                maxScore = Math.max(...scores) * 10;

                interviews.forEach((i: any) => {
                    const r = (i.role || "").toLowerCase();
                    const s = (i.avg_score || 0) * 10;
                    if (r.includes("cs") || r.includes("software") || r.includes("frontend") || r.includes("it")) branchMap["CS/IT"].push(s);
                    else if (r.includes("e&tc") || r.includes("electronics") || r.includes("iot")) branchMap["E&TC"].push(s);
                    else if (r.includes("market") || r.includes("digital")) branchMap["Marketing"].push(s);
                    else if (r.includes("finance") || r.includes("bank")) branchMap["Finance"].push(s);
                    else branchMap["Other"].push(s);
                });
            }

            const bData = Object.entries(branchMap)
                .filter(([, arr]) => arr.length > 0)
                .map(([name, arr]) => ({
                    name,
                    value: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
                    count: arr.length
                }));

            setBranchData(bData);
            setStats({
                totalStudents: totalStudents || 0,
                verifiedProfiles: verifiedProfiles || 0,
                activeDrives: activeDrives || 0,
                avgPlacementReady: avgReady,
                topScore: maxScore
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sora">Campus Insights & Reports</h1>
                    <p className="text-text-secondary mt-1 max-w-2xl">High-level analytics of student performance, eligibility, and placement readiness across all departments.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-bg-secondary border border-border-color px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-bg-card transition-all">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                    <button className="flex items-center gap-2 bg-accent-blue text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-accent-blue/20 hover:scale-[1.02] transition-all">
                        Generate Batch Report
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <div className="bg-bg-secondary border border-border-color p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="w-20 h-20" />
                    </div>
                    <div className="p-3 bg-accent-blue/10 text-accent-blue rounded-2xl w-fit mb-4"><Users className="w-6 h-6" /></div>
                    <p className="text-3xl font-bold font-sora">{stats.totalStudents}</p>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mt-1">Total Student Roster</p>
                </div>

                <div className="bg-bg-secondary border border-border-color p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck className="w-20 h-20" />
                    </div>
                    <div className="p-3 bg-accent-green/10 text-accent-green rounded-2xl w-fit mb-4"><ShieldCheck className="w-6 h-6" /></div>
                    <p className="text-3xl font-bold font-sora">{stats.verifiedProfiles}</p>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mt-1">Verified Academic Profiles</p>
                </div>

                <div className="bg-bg-secondary border border-border-color p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="w-20 h-20" />
                    </div>
                    <div className="p-3 bg-accent-yellow/10 text-accent-yellow rounded-2xl w-fit mb-4"><Target className="w-6 h-6" /></div>
                    <p className="text-3xl font-bold font-sora">{stats.avgPlacementReady}%</p>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mt-1">Placement Eligibility Rate</p>
                </div>

                <div className="bg-bg-secondary border border-border-color p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award className="w-20 h-20" />
                    </div>
                    <div className="p-3 bg-accent-purple/10 text-accent-purple rounded-2xl w-fit mb-4"><Award className="w-6 h-6" /></div>
                    <p className="text-3xl font-bold font-sora">{stats.topScore}%</p>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mt-1">Batch Peak Performance</p>
                </div>
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Branch Performance Bar Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-bg-secondary border border-border-color p-8 rounded-[2rem] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold font-sora">Departmental Performance</h3>
                            <p className="text-xs text-text-secondary">Average technical accuracy scores by branch.</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={branchData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40}>
                                    {branchData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Distribution Pie Chart */}
                <motion.div variants={itemVariants} className="bg-bg-secondary border border-border-color p-8 rounded-[2rem] shadow-sm">
                    <h3 className="text-lg font-bold font-sora mb-2">Student Division</h3>
                    <p className="text-xs text-text-secondary mb-8">Roster distribution across departments.</p>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={branchData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="count"
                                >
                                    {branchData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {branchData.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-text-secondary font-medium">{item.name}</span>
                                </div>
                                <span className="font-bold">{item.count} Candidates</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Detailed Roster Preview */}
            <motion.div variants={itemVariants} className="bg-bg-secondary border border-border-color rounded-[2rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-border-color flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold font-sora">Recent Evaluations</h3>
                        <p className="text-xs text-text-secondary">Summary of the last 5 evaluated students.</p>
                    </div>
                    <button className="text-accent-blue text-sm font-bold flex items-center gap-1 hover:underline">
                        View Full Database <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-4 text-center text-text-secondary italic text-sm py-12">
                    Evaluation roster is being aggregated from the real-time interview engine...
                </div>
            </motion.div>
        </div>
    );
}
