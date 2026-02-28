"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ClipboardList,
    Dna,
    Settings,
    Briefcase,
    Users,
    Building2,
    GraduationCap,
    Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/types";
import LogoutButton from "./LogoutButton";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    // Candidate Links
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["candidate"] },
    { label: "My Interviews", href: "/dashboard/interviews", icon: <ClipboardList className="w-5 h-5" />, roles: ["candidate"] },
    { label: "My DNA Cards", href: "/dashboard/dna-cards", icon: <Dna className="w-5 h-5" />, roles: ["candidate"] },
    { label: "Placement Drives", href: "/dashboard/drives", icon: <Building2 className="w-5 h-5" />, roles: ["candidate"] },
    { label: "Profile", href: "/dashboard/profile", icon: <Users className="w-5 h-5" />, roles: ["candidate"] },
    { label: "Academic Profile", href: "/dashboard/profile/verify", icon: <GraduationCap className="w-5 h-5" />, roles: ["candidate"] },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-5 h-5" />, roles: ["candidate"] },

    // Recruiter Links
    { label: "Overview", href: "/recruiter/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["recruiter"] },
    { label: "Job Openings", href: "/recruiter/dashboard/jobs", icon: <Briefcase className="w-5 h-5" />, roles: ["recruiter"] },
    { label: "All Candidates", href: "/recruiter/dashboard/candidates", icon: <Users className="w-5 h-5" />, roles: ["recruiter"] },
    { label: "Settings", href: "/recruiter/dashboard/settings", icon: <Settings className="w-5 h-5" />, roles: ["recruiter"] },

    // TPO Links
    { label: "Overview", href: "/campus/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["tpo"] },
    { label: "Students", href: "/campus/dashboard/students", icon: <GraduationCap className="w-5 h-5" />, roles: ["tpo"] },
    { label: "Placement Drives", href: "/campus/dashboard/drives", icon: <Building2 className="w-5 h-5" />, roles: ["tpo"] },
    { label: "Batch Report", href: "/campus/dashboard/reports", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["tpo"] },
    { label: "Settings", href: "/campus/dashboard/settings", icon: <Settings className="w-5 h-5" />, roles: ["tpo"] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, profile, signOut } = useAuth();

    const role = profile?.role || user?.user_metadata?.role || "candidate";
    const filteredNav = navItems.filter(item => item.roles.includes(role));

    const getInitials = (name: string, email?: string) => {
        if (name && name.trim()) return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        if (email) return email[0].toUpperCase();
        return "U";
    };

    return (
        <div className="w-64 bg-bg-secondary border-r border-border-color h-screen flex flex-col fixed left-0 top-0">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold font-sora">Interview<span className="text-accent-blue">IQ</span></span>
                </Link>

                {profile && (
                    <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-bg-card border border-border-color">
                        <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple font-bold text-sm">
                            {getInitials(profile.full_name, profile.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{profile.full_name || "My Account"}</p>
                            <p className="text-xs text-text-secondary truncate">{profile.email}</p>
                        </div>
                    </div>
                )}

                <nav className="space-y-1">
                    {filteredNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-medium ${pathname === item.href
                                ? "bg-accent-blue text-white"
                                : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-border-color">
                <LogoutButton />
                <p className="mt-4 text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">
                    🇮🇳 India's Free Interview Platform
                </p>
            </div>
        </div>
    );
}
