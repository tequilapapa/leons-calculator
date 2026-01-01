import { NextResponse } from "next/server";

const WIX_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL!; // same one you used for calculator → Wix

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // GHL sends a bunch of info – adjust these keys based on actual payload
    const {
      contact,
      calendarId,
      startTime,
      endTime,
      locationId,
      status,
      notes,
    } = body;

    // Only process your main calendar
    if (calendarId !== "4UHrntvfTwqklVXXfarP") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payloadForWix = {
      type: "calendar_appointment",
      calendarId,
      locationId,
      status,
      startTime,
      endTime,
      notes: notes || null,
      contact: {
        name: contact?.name || null,
        email: contact?.email || null,
        phone: contact?.phone || null,
      },
      meta: {
        source: "leons-ghl-calendar",
        createdAt: new Date().toISOString(),
      },
    };

    // Forward to the SAME Wix webhook you’re already using for calculator leads
    const res = await fetch(WIX_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadForWix),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Wix webhook error for appointment:", text);
      return NextResponse.json(
        { ok: false, error: "Failed to forward to Wix" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("GHL appointment webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
