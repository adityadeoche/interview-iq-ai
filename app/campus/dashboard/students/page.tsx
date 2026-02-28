"use client";

import { useState } from "react";
import { Search, Filter, Mail, MoreVertical, GraduationCap, Building2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function CampusStudentsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Mock data for student roster
    const students = [
        { id: "1", name: "Rahul Sharma", email: "rahul.s@college.edu", branch: "Computer Science", year: "4th Year", cgpa: "8.9", status: "Placement Ready", drives: 3 },
        { id: "2", name: "Priya Patel", email: "priya.p@college.edu", branch: "Information Tech", year: "4th Year", cgpa: "9.2", status: "Placed", drives: 1 },
        { id: "3", name: "Amit Kumar", email: "amit.k@college.edu", branch: "E&TC", year: "3rd Year", cgpa: "7.5", status: "Technical Gap", drives: 0 },
        { id: "4", name: "Neha Singh", email: "neha.s@college.edu", branch: "Computer Science", year: "4th Year", cgpa: "8.1", status: "Needs Practice", drives: 2 },
        { id: "5", name: "Vikram Reddy", email: "vikram.r@college.edu", branch: "Mechanical", year: "4th Year", cgpa: "7.8", status: "Placement Ready", drives: 1 },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Placed': return 'bg-accent-green/10 text-accent-green border-accent-green/20';
            case 'Placement Ready': return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20';
            case 'Technical Gap': return 'bg-accent-red/10 text-accent-red border-accent-red/20';
            case 'Needs Practice': return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20';
            default: return 'bg-bg-card text-text-secondary border-border-color';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sora">Student Roster</h1>
                    <p className="text-text-secondary mt-1">Manage and track your institution's candidates.</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-secondary border border-border-color rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-accent-blue transition-colors text-sm"
                        />
                    </div>
                    <button className="bg-bg-secondary border border-border-color hover:bg-bg-card p-2.5 rounded-xl transition-colors text-text-secondary hover:text-white shrink-0">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-bg-secondary border border-border-color rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-bg-card border-b border-border-color uppercase text-[10px] tracking-wider text-text-secondary font-bold">
                            <tr>
                                <th className="px-6 py-4">Candidate</th>
                                <th className="px-6 py-4">Academic Details</th>
                                <th className="px-6 py-4">AI Readiness Status</th>
                                <th className="px-6 py-4 text-center">Active Drives</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {students.map((student, i) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={student.id}
                                    className="hover:bg-bg-card/50 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold border border-accent-blue/20">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-accent-blue transition-colors">{student.name}</div>
                                                <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3" /> {student.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{student.branch}</div>
                                        <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-2">
                                            <span>{student.year}</span>
                                            <span className="w-1 h-1 rounded-full bg-border-color"></span>
                                            <span className="font-mono text-accent-purple font-bold">{student.cgpa} CGPA</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg border flex items-center w-fit gap-1.5 ${getStatusStyle(student.status)}`}>
                                            {student.status === 'Placed' ? <CheckCircle2 className="w-3 h-3" /> :
                                                student.status === 'Technical Gap' ? <XCircle className="w-3 h-3" /> :
                                                    <GraduationCap className="w-3 h-3" />}
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bg-card border border-border-color font-mono text-xs font-bold text-text-secondary">
                                            {student.drives}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-text-secondary hover:text-white hover:bg-bg-card rounded-lg transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
