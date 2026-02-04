// app/api/capture/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Optional shared-secret check (recommended)
    const secret = process.env.CAPTURE_SECRET;
    if (secret && body?.secret !== secret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const wixUrl = process.env.WIX_WEBHOOK_URL;
    const ghlUrl = process.env.GHL_WEBHOOK_URL;

    if (!wixUrl) {
      return NextResponse.json({ ok: false, error: "Missing WIX_WEBHOOK_URL" }, { status: 500 });
    }

    // Always send to Wix (your temporary source of truth)
    const wixRes = await fetch(wixUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Optionally also send to GHL webhook (best-effort)
    let ghlStatus: number | null = null;
    if (ghlUrl) {
      try {
        const ghlRes = await fetch(ghlUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        ghlStatus = ghlRes.status;
      } catch {
        ghlStatus = null;
      }
    }

    return NextResponse.json({
      ok: true,
      wixStatus: wixRes.status,
      ghlStatus,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "capture_failed" },
      { status: 500 }
    );
  }
}

