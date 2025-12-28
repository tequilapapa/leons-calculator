// app/api/leads/route.js
import { NextResponse } from "next/server";

// Optional: later we’ll use this env var for GoHighLevel or any CRM/webhook
const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL;

export async function POST(request) {
  try {
    const body = await request.json();

    // Basic shape we expect from the frontend
    const {
      projectType,
      size,
      extras,
      zip,
      estimateRange,
      contact,
      meta,
    } = body;

    // Quick validation – don’t accept completely empty payloads
    if (!projectType) {
      return NextResponse.json(
        { ok: false, error: "Missing projectType" },
        { status: 400 }
      );
    }

    const leadPayload = {
      projectType,
      size,
      extras,
      zip,
      estimateRange,
      contact,
      meta: {
        ...meta,
        receivedAt: new Date().toISOString(),
      },
    };

    // 🔹 1) For now: just log to server logs (you can see in Vercel → Logs)
    console.log("New lead from calculator:", leadPayload);

    // 🔹 2) OPTIONAL: forward to GoHighLevel (or any CRM) via webhook
    if (GHL_WEBHOOK_URL) {
      await fetch(GHL_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadPayload),
      });
    }

    // 🔹 3) OPTIONAL (later): also save to Firebase / Vercel KV / Supabase here

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/leads:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
