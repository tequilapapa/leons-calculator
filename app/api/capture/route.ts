import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CaptureRequestBody = {
  imageDataUrl?: string;
  lead?: {
    leadId?: string;
    sessionToken?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    source?: string;
    wixContactId?: string;
  };
  selections?: {
    species?: string;
    grade?: string;
    stain?: string;
    finish?: string;
    layout?: string;
  };
  metadata?: Record<string, unknown>;
};

function sanitizePathSegment(value: string | undefined, fallback: string) {
  const cleaned = (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || fallback;
}

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error('Invalid imageDataUrl format.');
  }

  const mimeType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  let extension = 'jpg';
  if (mimeType.includes('png')) extension = 'png';
  if (mimeType.includes('webp')) extension = 'webp';

  return { buffer, mimeType, extension };
}

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CaptureRequestBody;

    if (!body?.imageDataUrl) {
      return NextResponse.json(
        { ok: false, error: 'Missing imageDataUrl.' },
        { status: 400 }
      );
    }

    const { buffer, mimeType, extension } = dataUrlToBuffer(body.imageDataUrl);

    if (buffer.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Empty capture image.' },
        { status: 400 }
      );
    }

    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: 'Capture image is too large.' },
        { status: 413 }
      );
    }

    const supabase = getSupabaseAdmin();

    const bucketName = process.env.SUPABASE_CAMERA_BUCKET || 'camera-captures';
    const leadId = sanitizePathSegment(body.lead?.leadId, 'anonymous');
    const sessionToken = sanitizePathSegment(body.lead?.sessionToken, 'session');
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const filePath = `${leadId}/${sessionToken}/${fileName}`;

    const uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(`Supabase upload failed: ${uploadResult.error.message}`);
    }

    const publicUrlResult = supabase.storage.from(bucketName).getPublicUrl(filePath);

    let signedUrl: string | null = null;
    const signedResult = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24 * 14);

    if (!signedResult.error) {
      signedUrl = signedResult.data.signedUrl;
    }

    const captureResult = {
      bucket: bucketName,
      path: filePath,
      publicUrl: publicUrlResult?.data?.publicUrl || null,
      signedUrl,
    };

    const wixWebhookUrl = process.env.WIX_WEBHOOK_URL;
    let wix: {
      enabled: boolean;
      ok: boolean;
      status: number | null;
      response: unknown;
    } = {
      enabled: Boolean(wixWebhookUrl),
      ok: false,
      status: null,
      response: null,
    };

    if (wixWebhookUrl) {
      const wixPayload = {
        event: 'camera_capture_saved',
        occurredAt: new Date().toISOString(),
        lead: body.lead || {},
        selections: body.selections || {},
        metadata: body.metadata || {},
        capture: captureResult,
      };

      const wixResponse = await fetch(wixWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wixPayload),
      });

      wix.status = wixResponse.status;
      wix.ok = wixResponse.ok;

      const contentType = wixResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        wix.response = await wixResponse.json().catch(() => null);
      } else {
        wix.response = await wixResponse.text().catch(() => null);
      }
    }

    return NextResponse.json({
      ok: true,
      capture: captureResult,
      wix,
    });
  } catch (error: any) {
    console.error('Capture route error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'capture_failed',
      },
      { status: 500 }
    );
  }
}