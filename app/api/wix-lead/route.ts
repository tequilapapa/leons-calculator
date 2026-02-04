import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = process.env.WIX_WEBHOOK_URL;

    if (!url) {
      return NextResponse.json({ ok: false, error: "Missing WIX_WEBHOOK_URL" }, { status: 500 });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => "");
    return NextResponse.json({ ok: res.ok, status: res.status, response: text });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}

