'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ruler, DollarSign, ChevronRight, X, Check, Scan } from 'lucide-react';
import ReviewsWidget from '@/components/reviews-widget';

type WoodProfile = {
  id: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  image_url: string | null;
  price_per_sqft: number | null;
  color?: string | null;
  wood_type?: string | null;
  finish?: string | null;
  glb_url?: string | null;
  usdz_url?: string | null;
  poster_url?: string | null;
};

type LeadFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export default function ClientPage() {
  const params = useSearchParams();
  const urlSku = params?.get('sku') ?? undefined;

  const [woodProfiles, setWoodProfiles] = useState<WoodProfile[]>([]);
  const [selectedWood, setSelectedWood] = useState<WoodProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [measurements, setMeasurements] = useState({ length: 0, width: 0, sqft: 0 });
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const mvRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('wood_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        const items = (data || []) as WoodProfile[];
        setWoodProfiles(items);

        let pick: WoodProfile | undefined;
        if (urlSku) {
          pick = items.find(
            (p) => (p.sku || '').toLowerCase() === urlSku.toLowerCase() || p.id === urlSku
          );
        }
        if (!pick) pick = items.find((p) => p.glb_url || p.usdz_url) || items[0];
        setSelectedWood(pick || null);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load wood profiles');
      } finally {
        setLoading(false);
      }
    })();
  }, [urlSku]);

  useEffect(() => {
    if (measurements.length && measurements.width) {
      const sqft = measurements.length * measurements.width;
      setMeasurements((prev) => ({ ...prev, sqft }));
      setEstimatedPrice(sqft * (selectedWood?.price_per_sqft || 0));
    } else {
      setEstimatedPrice(0);
    }
  }, [measurements.length, measurements.width, selectedWood?.price_per_sqft]);

  const hasIosUsdz = useMemo(() => Boolean(selectedWood?.usdz_url), [selectedWood]);

  const openAR = () => {
    if (!selectedWood) return;

    if (mvRef.current?.activateAR) {
      mvRef.current.activateAR();
      return;
    }
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    if (isIOS && selectedWood.usdz_url) {
      window.location.href = selectedWood.usdz_url;
      return;
    }
    if (selectedWood.glb_url) {
      const sceneViewer = new URL('https://arvr.google.com/scene-viewer/1.0');
      sceneViewer.searchParams.set('file', selectedWood.glb_url);
      sceneViewer.searchParams.set('mode', 'ar_only');
      sceneViewer.searchParams.set('title', selectedWood.name || selectedWood.sku || 'Flooring');
      window.location.href = sceneViewer.toString();
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: leadFormData.name,
        email: leadFormData.email,
        phone: leadFormData.phone,
        address: leadFormData.address,
        notes: leadFormData.notes,
        projectType: 'flooring',
        selectedWoodId: selectedWood?.id,
        selectedWoodSku: selectedWood?.sku,
        estimatedSqft: measurements.sqft,
        estimatedPrice,
        roomMeasurements: measurements,
        arSessionData: { woodSelected: selectedWood?.name, timestamp: new Date().toISOString() },
        source: 'camera',
      };

      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        window.location.href = 'https://www.leonshardwood.com/quote';
      } else {
        alert('Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-7xl p-4">
        <Card className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            {loading && <div className="flex h-full items-center justify-center text-slate-300">Loading…</div>}
            {!loading && err && <div className="flex h-full items-center justify-center text-red-300">{err}</div>}
            {!loading && !err && selectedWood && (
              (selectedWood.glb_url || selectedWood.usdz_url) ? (
                <model-viewer
                  ref={mvRef}
                  src={selectedWood.glb_url || ''}
                  {...(hasIosUsdz ? { 'ios-src': selectedWood.usdz_url! } : {})}
                  ar
                  ar-modes={hasIosUsdz ? 'scene-viewer quick-look webxr' : 'scene-viewer webxr'}
                  ar-scale="fixed"
                  camera-controls
                  interaction-prompt="auto"
                  interaction-prompt-threshold="750"
                  exposure="0.9"
                  poster={selectedWood.poster_url || '/poster.png'}
                  style={{ width: '100%', height: '100%', background: 'transparent' }}
                >
                  <Button slot="ar-button" onClick={openAR} className="bg-emerald-600 hover:bg-emerald-700">
                    <Scan className="mr-2 h-4 w-4" />
                    View in your space
                  </Button>
                </model-viewer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  This profile has no AR assets (GLB/USDZ) yet.
                </div>
              )
            )}
          </div>
        </Card>

        {/* … your selection grid + form (unchanged) … */}
        {/* Keep your existing selection cards, measurement inputs, price estimate, and lead form */}
      </div>

      {/* Example lead form usage */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <Card className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-xl font-semibold tracking-tight">Get Your Detailed Quote</h2>
              <Button onClick={() => setShowLeadForm(false)} variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmitLead} className="p-6">
              {/* your inputs */}
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Submit Quote Request</Button>
              <ReviewsWidget variant="floating" title="Customers love Leon’s" />
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}