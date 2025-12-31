import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      projectType,
      selectedWoodId,
      estimatedSqft,
      estimatedPrice,
      roomMeasurements,
      arSessionData,
      notes,
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        phone,
        address,
        project_type: projectType,
        selected_wood_id: selectedWoodId,
        estimated_sqft: estimatedSqft,
        estimated_price: estimatedPrice,
        room_measurements: roomMeasurements,
        ar_session_data: arSessionData,
        notes,
        status: "new",
      })
      .select()
      .single()

    if (leadError) {
      console.error("Lead creation error:", leadError)
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    // If AR session data exists, create AR session record
    if (arSessionData && lead) {
      const { error: sessionError } = await supabase.from("ar_sessions").insert({
        lead_id: lead.id,
        room_dimensions: roomMeasurements,
        measurements: arSessionData,
      })

      if (sessionError) {
        console.error("AR session error:", sessionError)
      }
    }

    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (error) {
    console.error("Lead submission error:", error)
    return NextResponse.json({ error: "Failed to submit lead" }, { status: 500 })
  }
}
