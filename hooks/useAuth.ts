"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function getSession() {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            }
            setLoading(false);
        }

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (session) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (!error && data) {
            setProfile(data as Profile);
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/";
    };

    return { user, profile, loading, signOut };
}
