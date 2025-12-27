// app/api/lead/route.ts
import { NextResponse } from "next/server";

const GHL_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/xPGp97UEGHbh48A0Th2k/webhook-trigger/96242f67-a5cf-4e28-a881-2063830c5dc0";

// Helper: convert FormData → plain object
function formDataToObject(formData: FormData) {
  const obj: Record<string, any> = {};

  formData.forEach((value, key) => {
    // Support multiple values for same key (e.g. images[])
    if (key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  });

  return obj;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let incoming: any;

    if (contentType.includes("application/json")) {
      // Calculator / camera sending JSON
      incoming = await req.json();
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      // In case you ever POST a regular form
      const formData = await req.formData();
      incoming = formDataToObject(formData);
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // Basic sanity: we want at least *something* to identify them
    const { name, fullName, email, phone } = incoming;

    if (!name && !fullName && !email && !phone) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing basic contact info (need at least name / email / phone)",
        },
        { status: 400 }
      );
    }

    // Normalize a bit + add meta. Everything else gets passed through.
    const payload = {
      ...incoming,
      // Soft normalize common fields (GHL will map these on the webhook screen)
      name: name || fullName,
      email,
      phone,
      // Helpful meta for mapping & reporting inside GHL
      _meta: {
        source: incoming.source || "leons-calculator",
        projectType: incoming.projectType || incoming.project_type || null,
        sqft: incoming.sqft || incoming.squareFeet || null,
        condition: incoming.condition || null,
        preferredDate: incoming.preferredDate || incoming.date || null,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get("user-agent"),
        referer: req.headers.get("referer"),
      },
    };

    // Fire into GoHighLevel inbound webhook
    const ghlRes = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!ghlRes.ok) {
      const text = await ghlRes.text().catch(() => "");
      console.error("GHL webhook failed:", ghlRes.status, text);

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to send lead to GoHighLevel",
          status: ghlRes.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/lead:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
