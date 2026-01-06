import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sku: string }> }  // <- typedRoutes requires Promise
) {
  const { sku } = await params
  const key = decodeURIComponent(sku || '')
  if (!key) return NextResponse.json({ error: 'sku required' }, { status: 400 })

  const { data, error } = await supabase
    .from('wood_profiles')
    .select('id, sku, name, glb_url, usdz_url, poster_url')
    .or(`sku.eq.${key},id.eq.${key}`)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({
    title: data.name,
    glbUrl: data.glb_url,
    usdzUrl: data.usdz_url,
    posterUrl: data.poster_url ?? null
  })
}
