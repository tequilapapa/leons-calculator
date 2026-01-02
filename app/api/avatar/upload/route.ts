// app/api/gohighlevel-lead/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, contact, notes, profileId } = await req.json();

    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;

    if (!apiKey || !locationId) {
      console.error("Missing GHL env vars");
      return NextResponse.json(
        { error: "Server not configured for GoHighLevel" },
        { status: 500 }
      );
    }

    // Split name into first/last as best we can
    const [firstName, ...rest] = (name || "").trim().split(" ");
    const lastName = rest.join(" ");

    // Decide whether 'contact' looks like email or phone
    const payload: any = {
      locationId,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      source: "Estimator Camera Visualizer",
      tags: ["Estimator Camera Lead"],
    };

    if (contact) {
      if (contact.includes("@")) {
        payload.email = contact.trim();
      } else {
        payload.phone = contact.trim();
      }
    }

    // Optional: stuff notes & profile into one notes field
    if (notes || profileId) {
      const noteParts = [];
      if (profileId) noteParts.push(`Camera profile: ${profileId}`);
      if (notes) noteParts.push(`Notes: ${notes}`);
      payload.notes = noteParts.join(" | ");
    }

    const res = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // GHL v2 API requires Version header
        Version: "2021-07-28",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("GHL API error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to sync with GoHighLevel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("GHL integration error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}