"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Briefcase, Building2, Check, Chrome, Loader2 } from "lucide-react";
import { UserRole } from "@/lib/types";

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        collegeName: "",
        companyName: "",
    });

    const router = useRouter();

    const handleRoleSelect = (selectedRole: UserRole) => {
        setRole(selectedRole);
        setStep(2);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError(null);

        const { data, error: signupError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.fullName,
                    role: role,
                    college_name: role === "tpo" ? formData.collegeName : null,
                    company_name: role === "recruiter" ? formData.companyName : null,
                },
                emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            },
        });

        if (signupError) {
            if (signupError.message.toLowerCase().includes("already registered")) {
                setError("This email is already registered. Please sign in instead. Roles cannot be changed.");
            } else {
                setError(signupError.message);
            }
            setLoading(false);
            return;
        }

        if (data.user) {
            // Direct redirect for now, Supabase creates profile via trigger or we handle it here
            // For this project, we'll assume a profile is created via a DB function/trigger
            // or we can manually insert it if RLS allows.
            const redirectMap = {
                candidate: "/dashboard",
                recruiter: "/recruiter/dashboard",
                tpo: "/campus/dashboard",
            };
            router.push(redirectMap[role!]);
        }
    };

    const handleGoogleLogin = async () => {
        if (!role) {
            setError("Please select a role first");
            return;
        }
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
                queryParams: {
                    role: role // Note: Custom query param might need handling in callback
                }
            }
        })
    }

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-bold text-center mb-8 font-sora">
                    {step === 1 ? "Choose Your Path" : "Create Your Free Account"}
                </h1>

                {step === 1 ? (
                    <div className="space-y-4">
                        <RoleCard
                            icon={<GraduationCap className="w-8 h-8" />}
                            title="I'm a Student / Job Seeker"
                            description="Practice mock interviews and get hired."
                            selected={role === "candidate"}
                            onClick={() => handleRoleSelect("candidate")}
                        />
                        <RoleCard
                            icon={<Briefcase className="w-8 h-8" />}
                            title="I'm a Recruiter / HR"
                            description="Screen candidates smarter and faster."
                            selected={role === "recruiter"}
                            onClick={() => handleRoleSelect("recruiter")}
                        />
                        <RoleCard
                            icon={<Building2 className="w-8 h-8" />}
                            title="I'm a College TPO"
                            description="Manage placement drives for your batch."
                            selected={role === "tpo"}
                            onClick={() => handleRoleSelect("tpo")}
                        />
                    </div>
                ) : (
                    <div className="bg-bg-secondary p-8 rounded-2xl border border-border-color shadow-xl">
                        <div className="mb-6 pb-4 border-b border-border-color">
                            <p className="text-sm font-bold text-accent-blue font-sora">Selected Role: <span className="uppercase">{role}</span></p>
                            <p className="text-xs text-text-secondary mt-1">Note: Role selections are permanent and cannot be changed later.</p>
                        </div>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            {role === "tpo" && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">College Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                                        value={formData.collegeName}
                                        onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                                    />
                                </div>
                            )}
                            {role === "recruiter" && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>

                            {error && <p className="text-accent-red text-sm">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? "Creating Account..." : "Sign Up"}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border-color"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-bg-secondary px-2 text-text-secondary">Or continue with</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Chrome className="w-5 h-5" />
                            Google
                        </button>

                        <p className="mt-6 text-center text-text-secondary text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-accent-blue hover:underline">
                                Login
                            </Link>
                        </p>

                        <button
                            onClick={() => setStep(1)}
                            className="mt-4 w-full text-center text-text-secondary text-xs hover:underline"
                        >
                            ← Back to role selection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function RoleCard({ icon, title, description, selected, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left ${selected
                ? "border-accent-blue bg-accent-blue/5 shadow-lg shadow-accent-blue/10"
                : "border-border-color bg-bg-secondary hover:border-accent-blue/50"
                }`}
        >
            <div className={`p-3 rounded-xl ${selected ? "bg-accent-blue text-white" : "bg-bg-card text-accent-blue"}`}>
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-text-secondary text-sm">{description}</p>
            </div>
            {selected && <Check className="text-accent-blue w-6 h-6" />}
        </button>
    );
}
