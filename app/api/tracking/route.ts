import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    // You can log, send to Supabase, etc. later.
    console.log("[tracking]", body)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[tracking] error", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}