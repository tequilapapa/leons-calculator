/// <reference path="../../types/model-viewer.d.ts" />
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';  // <- fixed
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ruler, DollarSign, ChevronRight, X, Check, Scan } from 'lucide-react';

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

export default function ARVisualizerPage() {
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

  // <model-viewer> ref to call activateAR()
  const mvRef = useRef<any>(null);

  // Load profiles and preselect by ?sku=
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

  // Recompute sqft/price
  useEffect(() => {
    if (measurements.length && measurements.width) {
      const sqft = measurements.length * measurements.width;
      setMeasurements((prev) => ({ ...prev, sqft }));
      if (selectedWood) setEstimatedPrice(sqft * (selectedWood.price_per_sqft || 0));
    }
  }, [measurements.length, measurements.width, selectedWood]);

  const hasIosUsdz = useMemo(() => Boolean(selectedWood?.usdz_url), [selectedWood]);

  // Open native AR
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

  // Submit lead (do NOT call wood-profiles API here)
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadFormData.name,
          email: leadFormData.email,
          phone: leadFormData.phone,
          address: leadFormData.address,
          projectType: 'flooring',
          selectedWoodId: selectedWood?.id,
          selectedWoodSku: selectedWood?.sku,
          estimatedSqft: measurements.sqft,
          estimatedPrice,
          roomMeasurements: measurements,
          arSessionData: { woodSelected: selectedWood?.name, timestamp: new Date().toISOString() },
          notes: leadFormData.notes,
        }),
      });

      if (response.ok) {
        alert("Thank you! We'll contact you soon with a detailed quote.");
        setShowLeadForm(false);
        setLeadFormData({ name: '', email: '', phone: '', address: '', notes: '' });
      } else {
        alert('Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Register the web component on the client */}
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AR Wood Visualizer</h1>
              <p className="text-sm text-slate-400">Place selected floors at true scale. Android + iOS supported.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => (window.location.href = '/calculator')}
                variant="outline"
                className="border-orange-600/50 text-orange-500 hover:bg-orange-600/10"
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

      <div className="mx-auto max-w-7xl p-4">
        {/* AR Viewer */}
        <Card className="mb-6 overflow-hidden border-slate-800 bg-slate-900">
          <div className="relative aspect-video w-full bg-slate-950">
            {loading && <div className="flex h-full items-center justify-center text-slate-300">Loading models…</div>}

            {!loading && err && <div className="flex h-full items-center justify-center text-red-300">{err}</div>}

            {!loading && !err && !selectedWood && (
              <div className="flex h-full items-center justify-center">
                <div className="text-slate-300">No profiles yet. Add one in Supabase.</div>
              </div>
            )}

            {!loading && !err && selectedWood && (
              <>
                {(selectedWood.glb_url || selectedWood.usdz_url) ? (
                  <model-viewer
                    ref={mvRef}
                    src={selectedWood.glb_url || ''}
                    {...(hasIosUsdz ? { 'ios-src': selectedWood.usdz_url! } : {})}
                    ar
                    ar-modes={hasIosUsdz ? 'scene-viewer quick-look webxr' : 'scene-viewer webxr'}
                    ar-scale="fixed"
                    camera-controls
                    touch-action="pan-y"
                    interaction-prompt="auto"
                    interaction-prompt-threshold="750"
                    exposure="0.9"
                    poster={selectedWood.poster_url || '/poster.png'}
                    style={{ width: '100%', height: '100%', background: 'transparent' }}
                    onError={(e: any) => console.error('model-viewer error', e?.detail || e)}
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
                )}

                {!hasIosUsdz && (
                  <div className="absolute bottom-3 left-3 rounded bg-black/60 px-3 py-1 text-xs text-yellow-200">
                    Tip: iPhone AR requires a USDZ. You’ll still see the 3D preview here.
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Wood Selection */}
          <div className="lg:col-span-2">
            <Card className="border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-bold">Select Wood Profile</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {woodProfiles.map((wood) => (
                  <button
                    key={wood.id}
                    onClick={() => setSelectedWood(wood)}
                    className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedWood?.id === wood.id
                        ? 'border-orange-600 ring-2 ring-orange-600/50'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={wood.image_url || '/placeholder.svg'}
                        alt={wood.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="bg-slate-800/90 p-3 backdrop-blur-sm">
                      <p className="font-semibold">{wood.name}</p>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-slate-400">{wood.wood_type}</span>
                        <span className="font-semibold text-orange-500">${wood.price_per_sqft}/sq ft</span>
                      </div>
                    </div>
                    {selectedWood?.id === wood.id && (
                      <div className="absolute right-2 top-2 rounded-full bg-orange-600 p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Measurements & Price */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-orange-600" />
                <h2 className="text-xl font-bold">Measurements</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="length" className="text-slate-300">Length (ft)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={measurements.length || ''}
                    onChange={(e) => setMeasurements({ ...measurements, length: parseFloat(e.target.value) || 0 })}
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-slate-300">Width (ft)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={measurements.width || ''}
                    onChange={(e) => setMeasurements({ ...measurements, width: parseFloat(e.target.value) || 0 })}
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                {measurements.sqft > 0 && (
                  <div className="rounded-lg bg-slate-800 p-3">
                    <p className="text-sm text-slate-400">Total Area</p>
                    <p className="text-2xl font-bold">{measurements.sqft.toFixed(1)} sq ft</p>
                  </div>
                )}
              </div>
            </Card>

            {selectedWood && measurements.sqft > 0 && (
              <Card className="border-orange-600/50 bg-slate-900 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <h2 className="text-xl font-bold">Price Estimate</h2>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span className="font-semibold">
                      ${(measurements.sqft * (selectedWood.price_per_sqft || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Estimated Total:</span>
                      <span className="font-bold text-orange-500">${estimatedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setShowLeadForm(true)} className="mt-4 w-full bg-orange-600 hover:bg-orange-700">
                  Get Detailed Quote
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h2 className="text-xl font-bold">Get Your Detailed Quote</h2>
              <Button onClick={() => setShowLeadForm(false)} variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmitLead} className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lead-name" className="text-slate-300">Full Name *</Label>
                  <Input id="lead-name" value={leadFormData.name} onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })} required className="mt-1 border-slate-700 bg-slate-800 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-email" className="text-slate-300">Email *</Label>
                  <Input id="lead-email" type="email" value={leadFormData.email} onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })} required className="mt-1 border-slate-700 bg-slate-800 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-phone" className="text-slate-300">Phone</Label>
                  <Input id="lead-phone" type="tel" value={leadFormData.phone} onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })} className="mt-1 border-slate-700 bg-slate-800 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-address" className="text-slate-300">Project Address</Label>
                  <Input id="lead-address" value={leadFormData.address} onChange={(e) => setLeadFormData({ ...leadFormData, address: e.target.value })} className="mt-1 border-slate-700 bg-slate-800 text-white" />
                </div>
                <div>
                  <Label htmlFor="lead-notes" className="text-slate-300">Additional Notes</Label>
                  <Textarea id="lead-notes" value={leadFormData.notes} onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })} rows={3} className="mt-1 border-slate-700 bg-slate-800 text-white" />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Submit Quote Request</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}