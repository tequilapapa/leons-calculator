import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [profilesRes, patternsRes] = await Promise.all([
      supabase
        .from('wood_profiles')
        .select(
          `
            id,
            sku,
            name,
            description,
            image_url,
            texture_url,
            price_per_sqft,
            color,
            wood_type,
            finish,
            category,
            species,
            cut_type,
            grade,
            stain,
            finish_type,
            layout_family,
            bucket_path,
            catalog_url,
            albedo_url,
            normal_url,
            roughness_url,
            displacement_url,
            is_active,
            sort_order
          `
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),

      supabase
        .from('pattern_presets')
        .select(
          `
            id,
            code,
            name,
            category,
            supports_border,
            supports_random_width,
            supports_rotation,
            sort_order,
            generator_config,
            is_active
          `
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    ]);

    if (profilesRes.error) {
      throw new Error(profilesRes.error.message);
    }

    if (patternsRes.error) {
      throw new Error(patternsRes.error.message);
    }

    return NextResponse.json({
      ok: true,
      profiles: profilesRes.data ?? [],
      patterns: patternsRes.data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'catalog_fetch_failed',
      },
      { status: 500 }
    );
  }
}