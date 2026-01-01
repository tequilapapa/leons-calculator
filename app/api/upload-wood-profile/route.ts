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
    export async function POST(req: Request) {
      try {
        const { records } = (await req.json()) as {
          records: WoodProfileInsert[];
        };
    
        if (!Array.isArray(records) || records.length === 0) {
          return NextResponse.json(
            { error: "No records provided." },
            { status: 400 }
          );
        }
    
        const supabase = createClient();
    
        const { data, error } = await supabase
          .from("wood_profiles")
          .insert(records)
          .select("id");
    
        if (error) {
          console.error(error);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
    
        return NextResponse.json(
          { inserted: data ? data.length : records.length },
          { status: 200 }
        );
      } catch (err: any) {
        console.error(err);
        return NextResponse.json(
          { error: err.message || "Unexpected error." },
          { status: 500 }
        );
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
