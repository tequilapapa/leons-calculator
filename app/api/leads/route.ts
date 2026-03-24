import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const wixWebhookUrl = process.env.WIX_WEBHOOK_URL || "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    wixWebhookUrl,
  };
}

function getSupabase() {
  const { supabaseUrl, supabaseServiceRoleKey } = getEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Helper: convert FormData → plain object
function formDataToObject(formData: FormData) {
  const obj: Record<string, any> = {};

  formData.forEach((value, key) => {
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

function normalizeLead(incoming: Record<string, any>, req: Request) {
  const name = incoming.name || incoming.fullName || null;
  const email = incoming.email || null;
  const phone = incoming.phone || null;

  return {
    name,
    email,
    phone,
    source: incoming.source || "leons-calculator",
    project_type: incoming.projectType || incoming.project_type || null,
    status: "new",
    address: incoming.address || incoming.projectAddress || null,
    city: incoming.city || null,
    state: incoming.state || null,
    zip: incoming.zip || null,
    sqft: incoming.sqft || incoming.squareFeet || null,
    timeline: incoming.timeline || null,
    budget: incoming.budget || null,
    condition: incoming.condition || null,
    payload: incoming,
    meta: {
      preferredDate: incoming.preferredDate || incoming.date || null,
      referer: req.headers.get("referer"),
      userAgent: req.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
    },
    camera_assets:
      incoming.cameraAssets || incoming.images || incoming.photos || null,
    wix_sync: null,
  };
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { wixWebhookUrl } = getEnv();

    const contentType = req.headers.get("content-type") || "";
    let incoming: Record<string, any>;

    if (contentType.includes("application/json")) {
      incoming = await req.json();
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      incoming = formDataToObject(formData);
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported content type" },
        { status: 400 }
      );
    }

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

    const lead = normalizeLead(incoming, req);

    const { data, error } = await supabase
      .from("leads")
      .insert([lead])
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert failed:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to store lead" },
        { status: 500 }
      );
    }

    if (wixWebhookUrl) {
      const wixPayload = {
        leadId: data.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        projectType: lead.project_type,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        sqft: lead.sqft,
        timeline: lead.timeline,
        submittedAt: lead.meta.timestamp,
      };

      try {
        const wixRes = await fetch(wixWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(wixPayload),
        });

        const wixSync = {
          attempted: true,
          status: wixRes.status,
          ok: wixRes.ok,
          syncedAt: new Date().toISOString(),
        };

        await supabase
          .from("leads")
          .update({ wix_sync: wixSync })
          .eq("id", data.id);

        if (!wixRes.ok) {
          const text = await wixRes.text().catch(() => "");
          console.error("Wix webhook failed:", wixRes.status, text);
        }
      } catch (wixErr) {
        console.error("Wix webhook request error:", wixErr);

        await supabase
          .from("leads")
          .update({
            wix_sync: {
              attempted: true,
              ok: false,
              error: "Webhook request failed",
              syncedAt: new Date().toISOString(),
            },
          })
          .eq("id", data.id);
      }
    }

    return NextResponse.json({
      ok: true,
      leadId: data.id,
    });
  } catch (err) {
    console.error("Error in /api/leads:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}