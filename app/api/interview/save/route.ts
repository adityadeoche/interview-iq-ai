import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
    try {
        const { role, transcript, avgScore, status, rejectionReason, driveId, registrationId } = await req.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Insert into interviews
        // driveId here should be the placement_drive.id (UUID)
        // registrationId is the drive_registrations.id
        const { data, error: insertError } = await supabase
            .from("interviews")
            .insert({
                user_id: user.id,
                role,
                transcript,
                avg_score: Math.round(avgScore),
                status: status || 'Completed',
                rejection_reason: rejectionReason || null,
                drive_id: driveId || null
            })
            .select("id")
            .single();

        if (insertError) {
            console.error("Save interview error:", insertError);
            // If it's a FK error, it might be because driveId was a registrationId
            // We should ideally fix the caller, but let's log it clearly
            return NextResponse.json({ error: insertError.message, details: insertError.details }, { status: 500 });
        }

        // 2. Update registration status if valid
        if (registrationId && status) {
            await supabase.from("drive_registrations").update({ status }).eq('id', registrationId);
        } else if (driveId && status === 'Completed') {
            // Fallback for older clients that only pass driveId (which might be the registrationId)
            await supabase.from("drive_registrations").update({ status: 'Completed' }).eq('id', driveId);
        }

        return NextResponse.json({ success: true, id: data.id });

    } catch (error: any) {
        console.error("Save Interview API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
