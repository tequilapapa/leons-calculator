'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import KitchenEstimator from '@/components/kitchen-estimator';
// ✅ REMOVED: ReviewsWidget

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, ArrowRight, ArrowLeft, Scan, Calendar } from 'lucide-react';

type ProjectType = 'new-hardwood' | 'refinishing' | 'luxury-vinyl' | 'kitchen-remodel' | '';
type QualityTier = 'economic' | 'standard' | 'premium' | '';
type Urgency = 'asap' | '1-2-weeks' | '1-month' | 'browsing' | '';

type FormData = {
  projectType: ProjectType;
  qualityTier: QualityTier;

  finishType: string;
  floorCondition: string;
  moveFurniture: string;

  woodSpecies: string;
  finishStyle: string;
  demoNeeded: string;

  cabinetsTop: string;
  cabinetsBottom: string;
  sinkPlumbing: string;
  lightingFixtures: string;
  countertops: string;
  backsplash: string;

  totalSqft: string;
  length: string;
  width: string;
  urgency: Urgency;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type WoodProfile = {
  id: string;
  sku?: string | null;
  name: string;
  image_url: string | null;
  wood_type: string | null;
  price_per_sqft: number | null;
  glb_url?: string | null;
  usdz_url?: string | null;
  poster_url?: string | null;
};

const PROJECT_TYPES = [
  { id: 'new-hardwood' as ProjectType, name: 'New Hardwood Install', description: 'Professional installation of brand new hardwood flooring' },
  { id: 'refinishing' as ProjectType, name: 'Refinishing Hardwood', description: 'Restore and refinish your existing hardwood floors' },
  { id: 'luxury-vinyl' as ProjectType, name: 'Luxury Vinyl', description: 'Durable, waterproof luxury vinyl plank installation' },
  { id: 'kitchen-remodel' as ProjectType, name: 'Kitchen Remodels', description: 'Complete kitchen renovation with flooring and more' },
];

const QUALITY_TIERS = [
  { id: 'economic' as QualityTier, name: 'Economic', priceMultiplier: 0.8 },
  { id: 'standard' as QualityTier, name: 'Standard', priceMultiplier: 1.0 },
  { id: 'premium' as QualityTier, name: 'Premium', priceMultiplier: 1.3 },
];

const skuMap: Record<string, string> = {
  'lvp-wood-look': 'LHF-A-047',
  'lvp-stone-look': 'LHF-STONE-001',
  'lvp-tile-look': 'LHF-TILE-001',
  oak: 'LHF-OAK-001',
  maple: 'LHF-MAPLE-001',
  walnut: 'LHF-WALNUT-001',
  cherry: 'LHF-CHERRY-001',
  hickory: 'LHF-HICKORY-001',
};

const TIMELINE: { id: Urgency; label: string; sub: string }[] = [
  { id: 'asap',      label: 'ASAP',            sub: 'Ready to start immediately' },
  { id: '1-2-weeks', label: '1–2 Weeks',       sub: 'Planning to start soon' },
  { id: '1-month',   label: 'Within a Month',  sub: 'Still in planning phase' },
  { id: 'browsing',  label: 'Just Browsing',   sub: 'Gathering information' },
];

// ✅ GHL Booking embed you gave me
const GHL_BOOKING_IFRAME_SRC =
  "https://links.leonshardwood.com/booking/leons-hardwood-eneeq09cng6/sv/6976f752d8c47cb870b0dd4e?heightMode=full&showHeader=true";

export default function CalculatorPage() {
  const router = useRouter();

  // Tracking script stays
  const TrackingScript = (
    <Script
      src="https://link.msgsndr.com/js/external-tracking.js"
      strategy="afterInteractive"
      data-tracking-id="tk_ce216c286042426bb3fc56a03673ebcb"
    />
  );

  const [mode, setMode] = useState<'flooring' | 'kitchen'>('flooring');

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePulse, setPricePulse] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    projectType: '',
    qualityTier: '',
    finishType: '',
    floorCondition: '',
    moveFurniture: '',
    woodSpecies: '',
    finishStyle: '',
    demoNeeded: '',
    cabinetsTop: '',
    cabinetsBottom: '',
    sinkPlumbing: '',
    lightingFixtures: '',
    countertops: '',
    backsplash: '',
    totalSqft: '',
    length: '',
    width: '',
    urgency: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const updateField = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ✅ Progressive capture: prevent spamming Wix on rapid clicks
  const lastSentRef = useRef<string>("");

  const buildLeadPayload = (event: string, extra?: Record<string, any>) => {
    const priceRange = calculatePriceRange();
    return {
      event,
      step: currentStep,
      mode,
      ts: Date.now(),
      lead: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        projectType: formData.projectType,
        qualityTier: formData.qualityTier,
        urgency: formData.urgency,
        totalSqft: formData.totalSqft,
        length: formData.length,
        width: formData.width,
        woodSpecies: formData.woodSpecies,
        finishStyle: formData.finishStyle,
        finishType: formData.finishType,
        floorCondition: formData.floorCondition,
        demoNeeded: formData.demoNeeded,
        moveFurniture: formData.moveFurniture,
      },
      estimate: priceRange,
      source: "quote.leonshardwood.com",
      ...extra,
    };
  };

  const sendToWix = async (event: string, extra?: Record<string, any>) => {
    try {
      const payload = buildLeadPayload(event, extra);

      // Simple dedupe key (prevents rapid duplicates)
      const key = `${event}|${payload.step}|${payload.lead.email}|${payload.lead.phone}|${payload.lead.projectType}|${payload.lead.totalSqft}`;
      if (lastSentRef.current === key) return;
      lastSentRef.current = key;

      await fetch("/api/wix-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // silent fail; we don't want UX blocked by webhook issues
    }
  };

  useEffect(() => {
    if (formData.length && formData.width) {
      const calc = (parseFloat(formData.length) * parseFloat(formData.width)).toFixed(0);
      setFormData((prev) => ({ ...prev, totalSqft: calc }));
    }
  }, [formData.length, formData.width]);

  const calculatePriceRange = () => {
    if (!formData.totalSqft || !formData.projectType || !formData.qualityTier) return null;
    const sqft = parseFloat(formData.totalSqft);
    let basePricePerSqft = 8.5;

    switch (formData.projectType) {
      case 'new-hardwood': basePricePerSqft = 12.0; break;
      case 'refinishing': basePricePerSqft = 5.5; break;
      case 'luxury-vinyl': basePricePerSqft = 8.0; break;
      case 'kitchen-remodel': basePricePerSqft = 15.0; break;
    }

    const tierMultiplier = QUALITY_TIERS.find(t => t.id === formData.qualityTier)?.priceMultiplier || 1.0;
    const adjusted = basePricePerSqft * tierMultiplier;

    return {
      min: (sqft * adjusted * 0.9).toFixed(0),
      max: (sqft * adjusted * 1.1).toFixed(0),
      avg: (sqft * adjusted).toFixed(0),
    };
  };

  const priceRange = useMemo(() => calculatePriceRange(), [
    formData.totalSqft,
    formData.projectType,
    formData.qualityTier,
  ]);

  useEffect(() => {
    if (!priceRange) return;
    setPricePulse(true);
    const t = setTimeout(() => setPricePulse(false), 700);
    return () => clearTimeout(t);
  }, [priceRange?.avg]);

  // Supabase product list (kept)
  const [profiles, setProfiles] = useState<WoodProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'flooring') return;
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
        setProfiles((data || []) as WoodProfile[]);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
  }, [mode]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.projectType && formData.qualityTier);
      case 2:
        if (formData.projectType === 'refinishing') return !!(formData.finishType && formData.floorCondition);
        if (formData.projectType === 'new-hardwood') return !!(formData.woodSpecies && formData.finishStyle && formData.demoNeeded);
        if (formData.projectType === 'luxury-vinyl') return !!(formData.woodSpecies && formData.demoNeeded);
        if (formData.projectType === 'kitchen-remodel') return !!(formData.cabinetsTop && formData.countertops);
        return true;
      case 3:
        return !!(formData.totalSqft && formData.urgency);
      case 4:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep >= totalSteps) return;
    if (!canProceed()) return;

    // ✅ store partial progress to Wix every time they complete a step
    await sendToWix("step_complete", { completedStep: currentStep });

    setCurrentStep((s) => s + 1);

    // keep your tracking
    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'calculator_step_complete', step: currentStep, data: formData }),
      });
    } catch {}
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      // ✅ send final to Wix first (so you never lose the lead)
      await sendToWix("lead_submitted", { completedStep: 4 });

      // ✅ optional: keep your existing submit API if you want
      // If this endpoint is flaky, we can remove it later.
      try {
        await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, priceRange, source: 'calculator' }),
        });
      } catch {}

      setCurrentStep(5);

      // track lead submitted
      try {
        await fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'lead_submitted',
            data: { email: formData.email, projectType: formData.projectType },
          }),
        });
      } catch {}

      // ✅ NO redirect. We embed the booking calendar right here.
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToCamera = () => {
    const pick = formData.woodSpecies?.trim();
    const sku = (pick && skuMap[pick]) || 'LHF-A-047';
    router.push(`/camera?sku=${encodeURIComponent(sku)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      {TrackingScript}

      {/* GHL embed script (needed for some calendars) */}
      <Script src="https://links.leonshardwood.com/js/form_embed.js" strategy="afterInteractive" />

      <div className="container mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setMode('flooring')}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              mode === 'flooring' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={mode === 'flooring'}
          >
            Flooring
          </button>
          <button
            onClick={() => setMode('kitchen')}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              mode === 'kitchen' ? 'border-primary bg-primary/10' : 'border-gray-50 hover:bg-gray-50'
            }`}
            aria-pressed={mode === 'kitchen'}
          >
            Kitchen Remodel
          </button>
        </div>

        {mode === 'kitchen' ? (
          <KitchenEstimator />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                  <span className="text-sm text-muted-foreground">{progress.toFixed(0)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <Card className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
                {/* Stepper bar */}
                <div className="mb-6">
                  <div className="relative h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="absolute left-0 top-0 h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Steps 1–4 are exactly your existing UI.
                    Keep your existing Step 1–4 blocks here unchanged.
                    (I’m not re-pasting all of them again to avoid a novel.) */}

                {/* ✅ STEP 5: Booking Calendar */}
                {currentStep === 5 && (
                  <div className="space-y-6 py-6">
                    <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">You’re in. Let’s lock the appointment.</h3>
                        <p className="text-sm text-muted-foreground">
                          Pick a time that works — we’ll confirm right away.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-2">
                      <iframe
                        src={GHL_BOOKING_IFRAME_SRC}
                        style={{ width: "100%", border: "none", overflow: "hidden" }}
                        scrolling="no"
                        height={900}
                        title="Leon’s Hardwood Booking"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button onClick={goToCamera} variant="outline" className="w-full">
                        <Scan className="mr-2 h-4 w-4" />
                        Try AR Visualizer
                      </Button>
                      <Button
                        onClick={() => window.open(GHL_BOOKING_IFRAME_SRC, "_blank")}
                        className="w-full"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Open Calendar Fullscreen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Nav buttons */}
                {currentStep < 5 && (
                  <div className="flex justify-between pt-6">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    {currentStep < 4 ? (
                      <Button onClick={handleNext} disabled={!canProceed()}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
                        {isSubmitting ? 'Submitting…' : 'Get My Quote'}
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Right column: keep your summary card; just remove ReviewsWidget usage */}
            <div className="space-y-4">
              <Card className="sticky top-20 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-sm text-gray-600">{currentStep} / {totalSteps}</p>
                </div>
                <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Leads are saved progressively — even if they bounce, you still capture them.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
