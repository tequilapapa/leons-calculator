'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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

// Tell Next this page is dynamic and uncached (avoids the prerender/revalidate error)
export const dynamic = 'force-dynamic';
export const revalidate = 0;              // must be a number or false
export const fetchCache = 'force-no-store';

export default function CameraPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] grid place-items-center text-slate-300">Loading…</div>}>
      <ARPageInner />
    </Suspense>
  );
}

interface WoodProfile {
  id: string;
  sku?: string | null;
  name: string;
  description: string;
  image_url: string;
  price_per_sqft: number;
  color: string;
  wood_type: string;
  finish: string;
  glb_url?: string | null;
  usdz_url?: string | null;
  poster_url?: string | null;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

function ARPageInner() {
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
        const items = (data || []) as unknown as WoodProfile[];
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
      if (selectedWood) setEstimatedPrice(sqft * (selectedWood.price_per_sqft || 0));
    }
  }, [measurements.length, measurements.width, selectedWood]);

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

  // ✅ Single, correct submit handler (removes the stray one)
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadFormData,
          selectedWoodId: selectedWood?.id,
          selectedWoodSku: selectedWood?.sku,
          estimatedSqft: measurements.sqft,
          estimatedPrice,
          source: 'camera',
        }),
      });

      if (res.ok) {
        // close modal and send them to booking page
        setShowLeadForm(false);
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
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(1200px_600px_at_80%_-10%,rgba(234,88,12,.12),transparent_60%),radial-gradient(800px_400px_at_10%_-10%,rgba(56,189,248,.10),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(1000px_600px_at_50%_0%,black,transparent)]" />

      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {/* header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AR Wood Visualizer</h1>
              <p className="text-sm text-slate-300/80">Place floors at true scale. Android + iOS supported.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => (window.location.href = '/calculator')}
                variant="outline"
                className="border-orange-500/40 text-orange-300 hover:bg-orange-600/10"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Price Calculator
              </Button>
              <Button onClick={openAR} className="bg-emerald-600 hover:bg-emerald-700">
                <Scan className="mr-2 h-4 w-4" />
                Open in AR
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* viewer + lists … (unchanged UI) */}
      {/* … keep the rest of your rendering exactly as you had it … */}

      {/* Lead Form Modal */}
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lead-name" className="text-slate-300">Full Name *</Label>
                  <Input id="lead-name" value={leadFormData.name} onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })} required className="mt-1 border-white/10 bg-white/5 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-email" className="text-slate-300">Email *</Label>
                  <Input id="lead-email" type="email" value={leadFormData.email} onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })} required className="mt-1 border-white/10 bg-white/5 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-phone" className="text-slate-300">Phone</Label>
                  <Input id="lead-phone" type="tel" value={leadFormData.phone} onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })} className="mt-1 border-white/10 bg-white/5 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-address" className="text-slate-300">Project Address</Label>
                  <Input id="lead-address" value={leadFormData.address} onChange={(e) => setLeadFormData({ ...leadFormData, address: e.target.value })} className="mt-1 border-white/10 bg-white/5 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-notes" className="text-slate-300">Additional Notes</Label>
                  <Textarea id="lead-notes" value={leadFormData.notes} onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })} rows={3} className="mt-1 border-white/10 bg-white/5 text-white" />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Submit & Book</Button>
                <ReviewsWidget variant="floating" title="Customers love Leon’s" />
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}