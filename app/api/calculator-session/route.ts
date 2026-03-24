import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

type CalculatorSessionPayload = {
  session_id?: string | null;
  lead_id?: string | null;
  source?: string;
  project_type?: string | null;
  pricing_style?: string | null;
  selections?: Record<string, unknown>;
  generated_prices?: Record<string, unknown> | null;
  step_data?: Record<string, unknown>;
  last_completed_step?: number;
  status?: "in_progress" | "submitted" | "completed";
};

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await req.json()) as CalculatorSessionPayload;

    const {
      session_id = null,
      lead_id = null,
      source = "quote.leonshardwood.com",
      project_type = null,
      pricing_style = "range",
      selections = {},
      generated_prices = {},
      step_data = {},
      last_completed_step = 0,
      status = "in_progress",
    } = body || {};

    if (session_id) {
      const { data, error } = await supabase
        .from("calculator_sessions")
        .update({
          lead_id,
          source,
          project_type,
          pricing_style,
          selections,
          generated_prices,
          step_data,
          last_completed_step,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session_id)
        .select("id")
        .single();

      if (error) {
        console.error("Failed to update calculator session:", error);
        return NextResponse.json(
          { ok: false, error: "Failed to update session" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        session_id: data.id,
        mode: "updated",
      });
    }

    const { data, error } = await supabase
      .from("calculator_sessions")
      .insert([
        {
          lead_id,
          source,
          project_type,
          pricing_style,
          selections,
          generated_prices,
          step_data,
          last_completed_step,
          status,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create calculator session:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      session_id: data.id,
      mode: "created",
    });
  } catch (error) {
    console.error("Error in /api/calculator-session:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}