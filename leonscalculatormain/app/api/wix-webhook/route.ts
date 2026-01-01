import { NextRequest, NextResponse } from "next/server";

const WIX_WEBHOOK_URL =
  "https://manage.wix.com/_api/webhook-trigger/report/4baa8d1b-07eb-4266-a7e0-408e248f509d/7e98fb05-e985-4344-92ce-11fec244f906";

export async function POST(req: Request) {
  const data = await req.json();

  console.log("Sending payload to Wix:", data);

  try {
    const res = await fetch(WIX_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("Wix webhook failed:", text);
      return NextResponse.json(
        { ok: false, error: "Wix webhook failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error talking to Wix:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
