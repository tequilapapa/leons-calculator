import { NextRequest, NextResponse } from "next/server";

const WIX_WEBHOOK_URL =
  "https://manage.wix.com/_api/webhook-trigger/report/4baa8d1b-07eb-4266-a7e0-408e248f509d/7e98fb05-e985-4344-92ce-11fec244f906";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Optional: basic sanity log while debugging (remove later)
    console.log("Sending payload to Wix:", data);

    const res = await fetch(WIX_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Wix webhook failed:", text);
      return NextResponse.json(
        { ok: false, error: "Wix webhook failed", details: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error calling Wix webhook:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
