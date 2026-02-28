"use client";

import { LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function LogoutButton() {
    const handleLogout = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Clear the Supabase session from cookies/localStorage
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();

        // Nuclear option: full page reload to /login — clears ALL React state,
        // JS memory, and prevents the browser back-button ghost session
        window.location.href = "/";
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-xl text-text-secondary hover:bg-accent-red/10 hover:text-accent-red transition-colors font-medium"
        >
            <LogOut className="w-5 h-5" />
            Logout
        </button>
    );
}
