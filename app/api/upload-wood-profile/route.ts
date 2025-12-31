import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const pricePerSqft = Number.parseFloat(formData.get("pricePerSqft") as string)
    const color = formData.get("color") as string
    const woodType = formData.get("woodType") as string
    const finish = formData.get("finish") as string

    if (!imageFile || !name || !pricePerSqft || !woodType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload image to Vercel Blob
    const blob = await put(`wood-profiles/${imageFile.name}`, imageFile, {
      access: "public",
    })

    // Save to Supabase
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("wood_profiles")
      .insert({
        name,
        description,
        image_url: blob.url,
        price_per_sqft: pricePerSqft,
        color,
        wood_type: woodType,
        finish,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
