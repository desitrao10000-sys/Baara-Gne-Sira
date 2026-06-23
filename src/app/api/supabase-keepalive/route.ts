import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Route de "keepalive" — appelée automatiquement par Vercel Cron toutes les 6h
// pour empêcher Supabase de mettre le projet en pause après 7 jours d'inactivité
export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Missing Supabase config", status: "error" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Requête simple pour garder la base active
        const { error } = await supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .limit(1);

        if (error) {
            // Essayer une autre table si "projects" n'existe pas
            return NextResponse.json({
                status: "warn",
                message: "Ping sent but table query failed (project may be resuming)",
                timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            status: "ok",
            message: "Supabase keepalive ping successful",
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        return NextResponse.json({
            status: "error",
            message: "Keepalive failed — project may be paused. Restore from Supabase dashboard.",
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}