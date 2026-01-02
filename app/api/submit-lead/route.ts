// app/api/submit-lead/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      projectType,
      totalSqft,
      urgency,
      priceRange,
      source,
      ...rest
    } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      )
    }

    const fullName =
      [firstName, lastName].filter(Boolean).join(" ") || "Unknown"

    const supabase = createClient()

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: fullName,
        email,
        phone: phone || null,
        project_type: projectType || null,
        estimated_sqft: totalSqft ? Number(totalSqft) : null,
        timeline: urgency || null,
        notes: JSON.stringify({
          priceRange,
          source: source || "calculator",
          extra: rest,
        }),
        status: "new",
      })
      .select("id")
      .single()

    if (error) {
      console.error("[submit-lead] Supabase error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { ok: true, leadId: data.id },
      { status: 200 },
    )
  } catch (err) {
    console.error("[submit-lead] error:", err)
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 },
    )
  }
}