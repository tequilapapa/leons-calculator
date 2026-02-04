'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

type ProjectType = 'new-hardwood' | 'refinishing' | 'luxury-vinyl' | 'kitchen-remodel' | '';
type QualityTier = 'economic' | 'standard' | 'premium' | '';
type Urgency = 'asap' | '1-2-weeks' | '1-month' | 'browsing' | '';

type FormData = {
  projectType: ProjectType;
  qualityTier: QualityTier;

  woodSpecies: string;
  finishStyle: string;
  demoNeeded: string;
  finishType: string;
  floorCondition: string;

  length: string;
  width: string;
  totalSqft: string;
  urgency: Urgency;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const PROJECT_TYPES = [
  { id: 'new-hardwood' as ProjectType, name: 'New Hardwood Install' },
  { id: 'refinishing' as ProjectType, name: 'Refinishing Hardwood' },
  { id: 'luxury-vinyl' as ProjectType, name: 'Luxury Vinyl' },
  { id: 'kitchen-remodel' as ProjectType, name: 'Kitchen Remodels' },
];

const QUALITY_TIERS = [
  { id: 'economic' as QualityTier, name: 'Economic', priceMultiplier: 0.8 },
  { id: 'standard' as QualityTier, name: 'Standard', priceMultiplier: 1.0 },
  { id: 'premium' as QualityTier, name: 'Premium', priceMultiplier: 1.3 },
];

const TIMELINE: { id: Urgency; label: string; sub: string }[] = [
  { id: 'asap', label: 'ASAP', sub: 'Ready to start immediately' },
  { id: '1-2-weeks', label: '1–2 Weeks', sub: 'Planning to start soon' },
  { id: '1-month', label: 'Within a Month', sub: 'Still in planning phase' },
  { id: 'browsing', label: 'Just Browsing', sub: 'Gathering info' },
];

const GHL_BOOKING_IFRAME_SRC =
  'https://links.leonshardwood.com/booking/leons-hardwood-eneeq09cng6/sv/6976f752d8c47cb870b0dd4e?heightMode=full&showHeader=true';

export default function Page() {
  const totalSteps = 5;
  const [currentStep, setCurrentStep] = useState(1);
  const progress = (currentStep / totalSteps) * 100;

  const [leadKey] = useState(() => {
    if (typeof window === 'undefined') return `lead_${Date.now()}`;
    const existing = localStorage.getItem('leons_lead_key');
    if (existing) return existing;
    const fresh = `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('leons_lead_key', fresh);
    return fresh;
  });

  const [formData, setFormData] = useState<FormData>({
    projectType: '',
    qualityTier: '',

    woodSpecies: '',
    finishStyle: '',
    demoNeeded: '',
    finishType: '',
    floorCondition: '',

    length: '',
    width: '',
    totalSqft: '',
    urgency: '',

    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const updateField = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Auto-calc sqft from L x W (still editable)
  useEffect(() => {
    if (!formData.length || !formData.width) return;
    const L = parseFloat(formData.length);
    const W = parseFloat(formData.width);
    if (Number.isFinite(L) && Number.isFinite(W)) {
      const sqft = (L * W).toFixed(0);
      setFormData((prev) => ({ ...prev, totalSqft: sqft }));
    }
  }, [formData.length, formData.width]);

  const priceRange = useMemo(() => {
    if (!formData.totalSqft || !formData.projectType || !formData.qualityTier) return null;

    const sqft = parseFloat(formData.totalSqft);
    if (!Number.isFinite(sqft) || sqft <= 0) return null;

    let basePricePerSqft = 8.5;
    switch (formData.projectType) {
      case 'new-hardwood':
        basePricePerSqft = 12.0;
        break;
      case 'refinishing':
        basePricePerSqft = 5.5;
        break;
      case 'luxury-vinyl':
        basePricePerSqft = 8.0;
        break;
      case 'kitchen-remodel':
        basePricePerSqft = 15.0;
        break;
    }

    const tierMultiplier =
      QUALITY_TIERS.find((t) => t.id === formData.qualityTier)?.priceMultiplier ?? 1.0;

    const adjusted = basePricePerSqft * tierMultiplier;

    return {
      min: Math.round(sqft * adjusted * 0.9),
      max: Math.round(sqft * adjusted * 1.1),
      avg: Math.round(sqft * adjusted),
      base: adjusted,
    };
  }, [formData.totalSqft, formData.projectType, formData.qualityTier]);

  // Progressive capture (Next clicks + final submit)
  const capture = async (event: string) => {
    try {
      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          step: currentStep,
          leadKey,
          data: formData,
          priceRange,
          ts: Date.now(),
          source: 'quote.leonshardwood.com',
        }),
      });
    } catch {
      // never block UI
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.projectType && formData.qualityTier);
      case 2:
        if (formData.projectType === 'refinishing') return !!(formData.finishType && formData.floorCondition);
        if (formData.projectType === 'new-hardwood') return !!(formData.woodSpecies && formData.finishStyle && formData.demoNeeded);
        if (formData.projectType === 'luxury-vinyl') return !!(formData.woodSpecies && formData.demoNeeded);
        return true; // kitchen
      case 3:
        return !!(formData.totalSqft && formData.urgency && priceRange);
      case 4:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    await capture('step_complete');
    setCurrentStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!canProceed()) return;
    await capture('lead_submitted');
    setCurrentStep(5);
  };

  return (
    <div className="min-h-screen bg-muted py-10 px-4">
      <Script src="https://link.msgsndr.com/js/external-tracking.js" strategy="afterInteractive" />

      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <Progress value={progress} className="h-2 mb-6" />

        <Card className="rounded-2xl p-6">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Select Project Type</Label>
                <div className="grid gap-3">
                  {PROJECT_TYPES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateField('projectType', p.id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        formData.projectType === p.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-semibold">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Quality Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {QUALITY_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => updateField('qualityTier', tier.id)}
                      className={`rounded-xl border p-4 text-center transition ${
                        formData.qualityTier === tier.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-semibold">{tier.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {formData.projectType === 'refinishing' && (
                <>
                  <SelectBlock
                    label="Finish Type"
                    value={formData.finishType}
                    onChange={(v) => updateField('finishType', v)}
                    options={[
                      ['natural', 'Natural'],
                      ['stained-light', 'Stained - Light'],
                      ['stained-dark', 'Stained - Dark'],
                      ['custom-match', 'Custom Match'],
                    ]}
                  />
                  <SelectBlock
                    label="Floor Condition"
                    value={formData.floorCondition}
                    onChange={(v) => updateField('floorCondition', v)}
                    options={[
                      ['light', 'Light Scratches'],
                      ['moderate', 'Moderate Wear'],
                      ['heavy', 'Heavy Damage'],
                    ]}
                  />
                </>
              )}

              {(formData.projectType === 'new-hardwood' || formData.projectType === 'luxury-vinyl') && (
                <>
                  <SelectBlock
                    label="Material"
                    value={formData.woodSpecies}
                    onChange={(v) => updateField('woodSpecies', v)}
                    options={
                      formData.projectType === 'new-hardwood'
                        ? [['oak','Oak'],['maple','Maple'],['walnut','Walnut'],['cherry','Cherry'],['hickory','Hickory']]
                        : [['lvp-wood','LVP - Wood Look'],['lvp-stone','LVP - Stone Look'],['lvp-tile','LVP - Tile Look']]
                    }
                  />
                  {formData.projectType === 'new-hardwood' && (
                    <SelectBlock
                      label="Finish Style"
                      value={formData.finishStyle}
                      onChange={(v) => updateField('finishStyle', v)}
                      options={[
                        ['prefinished', 'Prefinished'],
                        ['unfinished', 'Unfinished (site-finished)'],
                      ]}
                    />
                  )}
                  <SelectBlock
                    label="Existing Floor Removal"
                    value={formData.demoNeeded}
                    onChange={(v) => updateField('demoNeeded', v)}
                    options={[
                      ['already-demo', 'Already Removed'],
                      ['include-demo', 'Include Demo/Removal'],
                      ['new-construction', 'New Construction'],
                    ]}
                  />
                </>
              )}

              {formData.projectType === 'kitchen-remodel' && (
                <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                  Kitchen mode can route to your KitchenEstimator later — keeping step 2 simple for now.
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Length (ft)</Label>
                  <Input
                    type="number"
                    value={formData.length}
                    onChange={(e) => updateField('length', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Width (ft)</Label>
                  <Input
                    type="number"
                    value={formData.width}
                    onChange={(e) => updateField('width', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Total Sq Ft (editable)</Label>
                <Input
                  type="number"
                  value={formData.totalSqft}
                  onChange={(e) => updateField('totalSqft', e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Auto-calculated from L × W, but you can edit.</p>
              </div>

              <div>
                <Label className="mb-2 block">Timeline</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TIMELINE.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateField('urgency', t.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        formData.urgency === t.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-semibold">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {priceRange && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <div className="text-sm text-muted-foreground">Estimated Price Range</div>
                  <div className="mt-1 text-3xl font-bold">
                    ${priceRange.min.toLocaleString()} – ${priceRange.max.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Avg: ${priceRange.avg.toLocaleString()} • {formData.totalSqft} sq ft • ${priceRange.base.toFixed(2)}/sqft
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 5 (Luxury + Bigger Booking Widget) */}
          {currentStep === 5 && (
            <div className="mx-auto max-w-5xl space-y-6 py-8">
              <div className="rounded-3xl border bg-white/80 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 px-6 py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 border">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold leading-tight">
                      You’re in, {formData.firstName || "—"}.
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Next: pick a time for your free consultation. We’ll confirm details by text/email.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-muted/30">✦</span>
                        <span>Transparent pricing — no pressure</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-muted/30">✦</span>
                        <span>Professional timeline + scope review</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-muted/30">✦</span>
                        <span>Best-fit materials + finish guidance</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-muted/30">✦</span>
                        <span>Optional on-site measure</span>
                      </div>
                    </div>

                    <p className="mt-5 text-xs text-muted-foreground">
                      🛡️ No spam. Your info is only used to confirm your appointment and follow up about your project.
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
              </div>

              <div className="rounded-3xl border bg-white shadow-xl overflow-hidden">
                <div className="px-6 py-5 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Schedule your consultation</div>
                    <div className="text-xs text-muted-foreground">Takes ~30 seconds</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Limited slots weekly — lock yours in now.</span>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden">
                    <iframe
                      src={GHL_BOOKING_IFRAME_SRC}
                      title="Leon’s Hardwood Booking"
                      className="w-full"
                      style={{
                        border: 'none',
                        height: '1200'
                          typeof window !== 'undefined' && window.innerWidth < 640
                            ? '1800px'
                            : '1400px',
                      }}
                      scrolling="no"
                    />
                  </div>

                  <div className="mt-5">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full bg-transparent"
                      onClick={() => setCurrentStep(4)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Edit my details
                    </Button>

                    <p className="mt-3 text-xs text-muted-foreground">
                      After booking, you’ll get a confirmation message — reply with photos or notes to speed up your estimate.
                    </p>
                  </div>
                </div>
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
                <Button onClick={handleSubmit} disabled={!canProceed()}>
                  Get My Quote
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SelectBlock({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}


