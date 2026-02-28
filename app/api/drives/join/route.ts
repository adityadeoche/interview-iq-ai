import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Anon client used for data reads (works with public SELECT RLS policy)
function getAnonClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST(req: Request) {
    try {
        const { driveId, code } = await req.json();

        // Use server cookie client for auth identity
        const authClient = await createServerClient();
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Use anon client for data reads (public SELECT policy on profiles)
        const supabase = getAnonClient();

        // 1. Determine drive type and fetch details
        const isHrJob = driveId.startsWith("hr_");
        const actualId = isHrJob ? driveId.replace("hr_", "") : driveId;

        let drive: any = null;

        if (isHrJob) {
            const { data, error } = await supabase
                .from("jobs")
                .select("id, company_name, title, job_code, min_score, min_10th, min_12th, max_backlogs, allowed_branches")
                .eq("id", actualId)
                .single();

            if (error || !data) {
                console.error("HR Job Fetch Error:", error, "ID:", actualId, "Data:", data);
                return NextResponse.json({ error: "HR Job Drive not found." }, { status: 404 });
            }

            drive = {
                id: data.id,
                company: data.company_name,
                drive_code: data.job_code,
                deadline: null, // HR jobs don't have a deadline field currently
                status: "Active",
                min_cgpa: data.min_score ? data.min_score / 10 : 0,
                min_10th: parseFloat(data.min_10th) || 0,
                min_12th: parseFloat(data.min_12th) || 0,
                max_backlogs: data.max_backlogs !== null ? parseInt(data.max_backlogs) : 99,
                allowed_branches: data.allowed_branches || [],
                isHr: true
            };
        } else {
            const { data, error } = await supabase
                .from("placement_drives")
                .select("id, company, drive_code, deadline, status, min_cgpa, min_10th, min_12th, max_backlogs, allowed_branches")
                .eq("id", actualId)
                .single();

            if (error || !data) {
                return NextResponse.json({ error: "TPO Drive not found." }, { status: 404 });
            }
            drive = { ...data, isHr: false };
        }

        // 2. Check registration deadline (TPO only)
        if (drive.deadline && new Date(drive.deadline) < new Date()) {
            return NextResponse.json({ error: "Registration deadline has passed for this drive." }, { status: 403 });
        }

        // 3. Validate the access code (case-insensitive)
        if (!drive.drive_code || drive.drive_code.toUpperCase() !== code.trim().toUpperCase()) {
            return NextResponse.json({ error: "Wrong Code — Please try again or ask for the correct code." }, { status: 403 });
        }

        // 4. Fetch student's permanent academic profile
        console.log("=== PROFILE FETCH START === user.id:", user.id);
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("college_name, resume_role, grad_cgpa, active_backlogs, branch, tenth_percent, twelfth_percent")
            .eq("id", user.id)
            .single();

        console.log("=== PROFILE FETCH RESULT ===");
        console.log("  profile:", JSON.stringify(profile));
        console.log("  error:", profileErr?.message || "none");
        console.log("  branch value:", JSON.stringify(profile?.branch));
        console.log("  branch type:", typeof profile?.branch);

        const studentCgpa = profile?.grad_cgpa ?? 0;
        const student10th = profile?.tenth_percent ?? 0;
        const student12th = profile?.twelfth_percent ?? 0;
        const studentBacklogs = profile?.active_backlogs ?? 0;
        const studentBranch = profile?.branch || "Unknown";

        // Optional: Broad warning if profile feels completely un-initialized
        const hasCriteria = drive.min_cgpa > 0 || drive.min_10th > 0 || drive.min_12th > 0;

        // If the drive requires a branch, but the user hasn't set it yet
        if (drive.allowed_branches && drive.allowed_branches.length > 0 && (!profile?.branch || profile.branch.trim() === "")) {
            console.error("=== BRANCH CHECK FAILED ===");
            console.error("  drive.allowed_branches:", JSON.stringify(drive.allowed_branches));
            console.error("  profile?.branch:", JSON.stringify(profile?.branch));
            console.error("  !profile?.branch:", !profile?.branch);
            console.error("  profile:", JSON.stringify(profile));
            return NextResponse.json({
                error: `❌ DEBUG: profile.branch=${JSON.stringify(profile?.branch)}, profileErr=${profileErr?.message || "none"}, user.id=${user.id}. Full profile: ${JSON.stringify(profile)}`
            }, { status: 403 });
        }

        // If the drive requires scores, and the user's DB values are genuinely null (not just 0)
        if (hasCriteria && profile?.grad_cgpa == null && profile?.tenth_percent == null) {
            return NextResponse.json({
                error: `❌ API DEBUG: profile=${JSON.stringify(profile)}, error=${JSON.stringify(profileErr)}. Please save /dashboard/profile/verify again.`
            }, { status: 403 });
        }

        // Gate 1: CGPA
        if (drive.min_cgpa > 0 && studentCgpa < drive.min_cgpa) {
            return NextResponse.json({
                error: `❌ Ineligible: CGPA too low. Drive requires ${drive.min_cgpa}, your CGPA is ${studentCgpa}.`
            }, { status: 403 });
        }

        // Gate 2: 10th %
        if (drive.min_10th > 0 && student10th < drive.min_10th) {
            return NextResponse.json({
                error: `❌ Ineligible: 10th % too low. Drive requires ${drive.min_10th}%, your score is ${student10th}%.`
            }, { status: 403 });
        }

        // Gate 3: 12th %
        if (drive.min_12th > 0 && student12th < drive.min_12th) {
            return NextResponse.json({
                error: `❌ Ineligible: 12th % too low. Drive requires ${drive.min_12th}%, your score is ${student12th}%.`
            }, { status: 403 });
        }

        // Gate 4: Backlogs
        if (drive.max_backlogs !== undefined && drive.max_backlogs !== null && studentBacklogs > drive.max_backlogs) {
            return NextResponse.json({
                error: `❌ Ineligible: Active backlogs. Drive allows max ${drive.max_backlogs}, you have ${studentBacklogs}.`
            }, { status: 403 });
        }

        // Gate 5: Branch
        if (drive.allowed_branches && drive.allowed_branches.length > 0 && !drive.allowed_branches.includes(studentBranch)) {
            return NextResponse.json({
                error: `❌ Ineligible: Branch not allowed. Your branch (${studentBranch}) is not eligible for this drive.`
            }, { status: 403 });
        }

        // 5. Register the student with a SNAPSHOT of their current academic data
        const registrationData: any = {
            student_id: user.id,
            student_branch: studentBranch,
            college_name: profile?.college_name || "Unknown",
            // Freeze academic data at time of registration
            snap_tenth_percent: profile?.tenth_percent ?? null,
            snap_twelfth_percent: profile?.twelfth_percent ?? null,
            snap_cgpa: studentCgpa,
            snap_backlogs: studentBacklogs,
        };

        if (drive.isHr) {
            registrationData.job_id = actualId;
        } else {
            registrationData.drive_id = actualId;
        }

        const { error: regError } = await supabase
            .from("drive_registrations")
            .insert(registrationData);

        if (regError) {
            if (regError.code === "23505") {
                return NextResponse.json({ error: "You are already registered for this drive/job." }, { status: 409 });
            }
            return NextResponse.json({ error: regError.message }, { status: 500 });
        }

        // 6. Increment enrolled_count (TPO drives) or candidates_count (HR jobs)
        if (drive.isHr) {
            // Note: If you want to track candidates_count on jobs table, could be an RPC or handled by a trigger. 
            // supabase.rpc('increment_job_candidates', { job_id_param: actualId });
        } else {
            await supabase.rpc("increment_drive_enrollment", { drive_id_param: actualId });
        }

        return NextResponse.json({ success: true, company: drive.company });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
