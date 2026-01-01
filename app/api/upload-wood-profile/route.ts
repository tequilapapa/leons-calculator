import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type WoodProfileInsert = {
  name: string
  description?: string | null
  image_url: string
  texture_url?: string | null
  price_per_sqft: number
  color?: string | null
  wood_type: string
  finish?: string | null
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()

    const { records } = (await req.json()) as {
      records: WoodProfileInsert[]
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records provided" },
        { status: 400 },
      )
    }

    const cleaned = records.map((r) => ({
      name: r.name,
      description: r.description ?? null,
      image_url: r.image_url,
      texture_url: r.texture_url ?? r.image_url,
      price_per_sqft: Number(r.price_per_sqft) || 0,
      color: r.color ?? null,
      wood_type: r.wood_type,
      finish: r.finish ?? null,
    }))

    const { data, error } = await supabase
      .from("wood_profiles")
      .insert(cleaned)
      .select("id")

    if (error) {
      console.error("[upload-wood-profile] Supabase insert error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { inserted: data?.length ?? 0 },
      { status: 200 },
    )
  } catch (err: any) {
    console.error("[upload-wood-profile] Unexpected error:", err)
    return NextResponse.json(
      { error: "Unexpected error while uploading wood profiles" },
      { status: 500 },
    )
  }
}