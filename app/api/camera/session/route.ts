import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    const payload = {
      lead_id: body.leadId || null,
      source_app: body.sourceApp || 'quote',
      project_type: body.projectType || 'quote',
      selected_profile_id: body.selectedProfileId || null,
      selected_pattern_code: body.selectedPatternCode || null,
      selected_species: body.selectedSpecies || null,
      selected_cut_type: body.selectedCutType || null,
      selected_grade: body.selectedGrade || null,
      selected_stain: body.selectedStain || null,
      selected_finish_type: body.selectedFinishType || null,
      renderer_state: body.rendererState || {},
      room_dimensions: body.roomDimensions || {},
      measurements: body.measurements || {},
      screenshots: body.screenshots || [],
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (body.sessionId) {
      const { data, error } = await supabase
        .from('ar_sessions')
        .update(payload)
        .eq('id', body.sessionId)
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ ok: true, session: data });
    }

    const { data, error } = await supabase
      .from('ar_sessions')
      .insert({
        ...payload,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, session: data });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'ar_session_save_failed',
      },
      { status: 500 }
    );
  }
}