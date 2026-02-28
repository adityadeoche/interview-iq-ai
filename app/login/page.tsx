"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, Chrome, Loader2 } from "lucide-react";

function LoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const portal = searchParams.get("portal");

    useEffect(() => {
        const err = searchParams.get('error');
        if (err) {
            if (err === 'invalid_portal_tpo') setError("Access Denied: Your account is not authorized for the TPO portal.");
            else if (err === 'invalid_portal_recruiter') setError("Access Denied: Your account is not authorized for the Recruiter portal.");
            else if (err === 'unauthorized') setError("Please log in with the correct credentials to access this area.");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            try {
                // Fetch real role from DB to prevent metadata spoofing
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", data.user.id)
                    .single();

                const userRole = (profile?.role || data.user.user_metadata?.role || 'candidate').toLowerCase();
                const isStudent = userRole === 'candidate' || userRole === 'student';

                // THE GATE: Strict Role Verification
                if (portal === 'tpo' && !userRole.includes('tpo')) {
                    await supabase.auth.signOut();
                    setError("Invalid credentials for TPO portal. Student accounts cannot access this area.");
                    setLoading(false);
                    return;
                }

                if (portal === 'recruiter' && !userRole.includes('recruiter')) {
                    await supabase.auth.signOut();
                    setError("Invalid credentials for HR portal. Student accounts cannot access this area.");
                    setLoading(false);
                    return;
                }

                // Reverse Gate: TPOs/HRs trying to log into Student portal
                if (!portal && !isStudent) {
                    await supabase.auth.signOut();
                    setError(`This portal is for students only. Please use the ${userRole.toUpperCase()} portal.`);
                    setLoading(false);
                    return;
                }

                // Redirect Map
                const redirectMap: any = {
                    candidate: "/dashboard",
                    student: "/dashboard",
                    recruiter: "/recruiter/dashboard",
                    tpo: "/campus/dashboard",
                };

                const target = redirectMap[userRole] || "/dashboard";

                // If student, check if academic profile is missing
                if (isStudent && profile) {
                    const { data: acadProfile } = await supabase
                        .from('profiles')
                        .select('tenth_percent, twelfth_percent, grad_cgpa')
                        .eq('id', data.user.id)
                        .single();

                    if (!acadProfile?.grad_cgpa) {
                        router.push("/dashboard/profile/verify");
                        return;
                    }
                }

                router.push(target);
            } catch (err) {
                console.error("Post-login error:", err);
                router.push("/dashboard");
            }
        }
    };

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`
            }
        })
    }

    return (
        <div className="bg-bg-secondary p-8 rounded-[2.5rem] border border-border-color shadow-2xl">
            {/* Portal Switcher Tabs */}
            <div className="flex bg-bg-primary rounded-2xl p-1 mb-8 border border-border-color/50">
                <Link href="/login" className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all ${!portal ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20" : "text-text-secondary hover:text-text-primary"}`}>Student</Link>
                <Link href="/login?portal=recruiter" className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all ${portal === 'recruiter' ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20" : "text-text-secondary hover:text-text-primary"}`}>HR / Recruiter</Link>
                <Link href="/login?portal=tpo" className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all ${portal === 'tpo' ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20" : "text-text-secondary hover:text-text-primary"}`}>TPO Login</Link>
            </div>

            <h1 className="text-2xl font-bold mb-2 font-sora text-center">
                {portal === 'tpo' ? 'TPO Portal' : portal === 'recruiter' ? 'HR Portal' : 'Student Portal'}
            </h1>
            <p className="text-text-secondary text-sm text-center mb-8">Please enter your credentials to continue.</p>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium">Password</label>
                        <button
                            type="button"
                            className="text-xs text-accent-blue hover:underline"
                            onClick={() => supabase.auth.resetPasswordForEmail(email)}
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-lg bg-bg-card border border-border-color focus:border-accent-blue outline-none transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && <p className="text-accent-red text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border-color"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-bg-secondary px-2 text-text-secondary">Or sign in with</span>
                </div>
            </div>

            <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Chrome className="w-5 h-5" />
                Google
            </button>

            <p className="mt-8 text-center text-text-secondary text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-accent-blue hover:underline">
                    Create Account
                </Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-accent-blue rounded-xl flex items-center justify-center">
                            <LogIn className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold font-sora">Interview<span className="text-accent-blue">IQ</span></span>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="bg-bg-secondary p-8 rounded-[2.5rem] border border-border-color shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-accent-blue mb-4" />
                        <p className="text-text-secondary text-sm">Loading login portal...</p>
                    </div>
                }>
                    <LoginContent />
                </Suspense>
            </div>
        </div>
    );
}
