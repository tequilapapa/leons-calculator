import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(_: Request, { params }: { params: { sku: string } }) {
  const { data, error } = await supabase
    .from('wood_profiles')
    .select('sku,title,glb_url,usdz_url')
    .eq('sku', params.sku)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    title: data.title ?? data.sku,
    glbUrl: data.glb_url,
    usdzUrl: data.usdz_url || null,
  });
}