import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.from("wood_profiles").select("*").order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ ok: true, profiles: data || [] })
  } catch (err) {
    console.error("Error fetching wood profiles:", err)
    return NextResponse.json({ ok: false, error: "Failed to fetch wood profiles" }, { status: 500 })
  }
}
