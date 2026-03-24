'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import KitchenEstimator from '@/components/kitchen-estimator';
import ReviewsWidget from '@/components/reviews-widget';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  ArrowLeft,
  Scan,
  Calendar,
  Check,
} from 'lucide-react';

type ProjectType =
  | 'new-hardwood'
  | 'refinishing'
  | 'luxury-vinyl'
  | 'kitchen-remodel'
  | '';

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
  {
    id: 'new-hardwood' as ProjectType,
    name: 'New Hardwood Install',
    description: 'Professional installation of brand new hardwood flooring',
  },
  {
    id: 'refinishing' as ProjectType,
    name: 'Refinishing Hardwood',
    description: 'Restore and refinish your existing hardwood floors',
  },
  {
    id: 'luxury-vinyl' as ProjectType,
    name: 'Luxury Vinyl',
    description: 'Durable, waterproof luxury vinyl plank installation',
  },
  {
    id: 'kitchen-remodel' as ProjectType,
    name: 'Kitchen Remodels',
    description: 'Complete kitchen renovation with flooring and more',
  },
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

export default function CalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4" />
      }
    >
      <CalculatorPageContent />
    </Suspense>
  );
}

function CalculatorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leadId, setLeadId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!searchParams) return;

    const incomingLeadId = searchParams.get('lead_id');
    const incomingEmail = searchParams.get('email');
    const incomingPhone = searchParams.get('phone');
    const incomingFirstName = searchParams.get('firstName');
    const incomingLastName = searchParams.get('lastName');

    if (incomingLeadId) {
      setLeadId(incomingLeadId);
    }

    setFormData((prev) => ({
      ...prev,
      email: prev.email || incomingEmail || '',
      phone: prev.phone || incomingPhone || '',
      firstName: prev.firstName || incomingFirstName || '',
      lastName: prev.lastName || incomingLastName || '',
    }));
  }, [searchParams]);

  useEffect(() => {
    if (formData.length && formData.width) {
      const calc = (
        parseFloat(formData.length) * parseFloat(formData.width)
      ).toFixed(0);

      if (!Number.isNaN(Number(calc))) {
        setFormData((prev) => ({ ...prev, totalSqft: calc }));
      }
    }
  }, [formData.length, formData.width]);

  const calculatePriceRange = () => {
    if (!formData.totalSqft || !formData.projectType || !formData.qualityTier) {
      return null;
    }

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
      QUALITY_TIERS.find((t) => t.id === formData.qualityTier)?.priceMultiplier || 1.0;

    const adjusted = basePricePerSqft * tierMultiplier;

    return {
      min: (sqft * adjusted * 0.9).toFixed(0),
      max: (sqft * adjusted * 1.1).toFixed(0),
      avg: (sqft * adjusted).toFixed(0),
      base: adjusted.toFixed(2),
    };
  };

  const priceRange = calculatePriceRange();

  useEffect(() => {
    if (!priceRange) return;
    setPricePulse(true);
    const t = setTimeout(() => setPricePulse(false), 700);
    return () => clearTimeout(t);
  }, [priceRange?.avg]);

  const [profiles, setProfiles] = useState<WoodProfile[]>([]);
  const [selected, setSelected] = useState<WoodProfile | null>(null);
  const [material, setMaterial] = useState<'hardwood' | 'vinyl' | 'engineered' | null>(null);
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

  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');

  const sqft = useMemo(() => {
    const L = typeof length === 'number' ? length : 0;
    const W = typeof width === 'number' ? width : 0;
    return L > 0 && W > 0 ? L * W : 0;
  }, [length, width]);

  const estMaterial = useMemo(() => {
    const p = selected?.price_per_sqft || 0;
    return sqft * p;
  }, [sqft, selected?.price_per_sqft]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.projectType && formData.qualityTier);
      case 2:
        if (formData.projectType === 'refinishing') {
          return !!(formData.finishType && formData.floorCondition);
        }
        if (formData.projectType === 'new-hardwood') {
          return !!(
            formData.woodSpecies &&
            formData.finishStyle &&
            formData.demoNeeded
          );
        }
        if (formData.projectType === 'luxury-vinyl') {
          return !!(formData.woodSpecies && formData.demoNeeded);
        }
        if (formData.projectType === 'kitchen-remodel') {
          return !!(formData.cabinetsTop && formData.countertops);
        }
        return true;
      case 3:
        return !!(formData.totalSqft && formData.urgency && priceRange);
      case 4:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone
        );
      default:
        return true;
    }
  };

  const saveCalculatorSession = async ({
    stepOverride,
    status = 'in_progress',
  }: {
    stepOverride?: number;
    status?: 'in_progress' | 'submitted';
  } = {}) => {
    try {
      const payload = {
        session_id: sessionId,
        lead_id: leadId,
        source: 'quote.leonshardwood.com',
        project_type: formData.projectType || null,
        pricing_style: 'range',
        selections: {
          qualityTier: formData.qualityTier,
          finishType: formData.finishType,
          floorCondition: formData.floorCondition,
          moveFurniture: formData.moveFurniture,
          woodSpecies: formData.woodSpecies,
          finishStyle: formData.finishStyle,
          demoNeeded: formData.demoNeeded,
          urgency: formData.urgency,
          cabinetsTop: formData.cabinetsTop,
          cabinetsBottom: formData.cabinetsBottom,
          sinkPlumbing: formData.sinkPlumbing,
          lightingFixtures: formData.lightingFixtures,
          countertops: formData.countertops,
          backsplash: formData.backsplash,
        },
        generated_prices: priceRange || {},
        step_data: {
          totalSqft: formData.totalSqft,
          length: formData.length,
          width: formData.width,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        last_completed_step: stepOverride ?? currentStep,
        status,
      };

      const res = await fetch('/api/calculator-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json?.session_id) {
        setSessionId(json.session_id);
      }
    } catch (err) {
      console.error('Failed to save calculator session:', err);
    }
  };

  const handleNext = async () => {
    if (!canProceed() || currentStep >= totalSteps) return;

    await saveCalculatorSession({
      stepOverride: currentStep,
      status: 'in_progress',
    });

    setCurrentStep((s) => s + 1);

    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'calculator_step_complete',
          step: currentStep,
          data: formData,
          leadId,
          sessionId,
        }),
      });
    } catch {}
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);

    try {
      await saveCalculatorSession({
        stepOverride: 4,
        status: 'submitted',
      });

      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          leadId,
          sessionId,
          priceRange,
          source: 'calculator',
        }),
      });

      if (response.ok) {
        setCurrentStep(5);

        try {
          await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'lead_submitted',
              data: {
                email: formData.email,
                projectType: formData.projectType,
                leadId,
                sessionId,
              },
            }),
          });
        } catch {}
      } else {
        console.error('Lead submission failed:', await response.text());
      }
    } catch (e) {
      console.error('Submission error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToCamera = () => {
    const pick = formData.woodSpecies?.trim();
    const sku = (pick && skuMap[pick]) || 'LHF-A-047';
    router.push(`/camera?sku=${encodeURIComponent(sku)}`);
  };

  const goToSchedule = () => {
    const url = new URL('https://www.leonshardwood.com/schedule');

    if (leadId) url.searchParams.set('lead_id', leadId);
    if (sessionId) url.searchParams.set('session_id', sessionId);
    if (formData.email) url.searchParams.set('email', formData.email);
    if (formData.phone) url.searchParams.set('phone', formData.phone);
    if (formData.firstName) url.searchParams.set('firstName', formData.firstName);
    if (formData.lastName) url.searchParams.set('lastName', formData.lastName);

    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setMode('flooring')}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              mode === 'flooring'
                ? 'border-primary bg-primary/10'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={mode === 'flooring'}
          >
            Flooring
          </button>
          <button
            onClick={() => setMode('kitchen')}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              mode === 'kitchen'
                ? 'border-primary bg-primary/10'
                : 'border-gray-300 hover:bg-gray-50'
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
              <div className="mb-4 rounded-lg border bg-primary/5 p-3 animate-in fade-in slide-in-from-top-2">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold">New:</span> Try our AR visualizer — see floors in your room.
                </span>
              </div>

              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {progress.toFixed(0)}% Complete
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <Card className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
                <div className="mb-6">
                  <div className="relative h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="absolute left-0 top-0 h-2 rounded-full bg-primary transition-all"
                      style={{
                        width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block text-base font-semibold">
                        Select Project Type
                      </Label>
                      <div className="grid gap-3">
                        {PROJECT_TYPES.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => updateField('projectType', p.id)}
                            className={`rounded-lg border-2 p-4 text-left transition-all hover:border-primary ${
                              formData.projectType === p.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                          >
                            <div className="font-semibold">{p.name}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {p.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.projectType && (
                      <div>
                        <Label className="mb-3 block text-base font-semibold">
                          Quality Level
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          {QUALITY_TIERS.map((tier) => (
                            <button
                              key={tier.id}
                              onClick={() => updateField('qualityTier', tier.id)}
                              className={`rounded-lg border-2 p-4 text-center transition-all hover:border-primary ${
                                formData.qualityTier === tier.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border'
                              }`}
                            >
                              <div className="font-semibold">{tier.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    {formData.projectType === 'refinishing' && (
                      <>
                        <SelectBlock
                          id="finishType"
                          label="Finish Type"
                          value={formData.finishType}
                          onChange={(v) => updateField('finishType', v)}
                          options={[
                            ['natural', 'Natural Finish'],
                            ['stained-light', 'Stained - Light'],
                            ['stained-dark', 'Stained - Dark'],
                            ['stained-darker', 'Stained - Darker'],
                            ['whitewashed', 'Whitewashed'],
                            ['custom-match', 'Custom Match Stain'],
                          ]}
                        />
                        <SelectBlock
                          id="floorCondition"
                          label="Floor Condition"
                          value={formData.floorCondition}
                          onChange={(v) => updateField('floorCondition', v)}
                          options={[
                            ['light-scratches', 'Light Scratches'],
                            ['moderate-wear', 'Moderate Wear'],
                            ['heavy-damage', 'Heavy Damage/Repairs Needed'],
                          ]}
                        />
                        <SelectBlock
                          id="moveFurniture"
                          label="Move Furniture?"
                          value={formData.moveFurniture}
                          onChange={(v) => updateField('moveFurniture', v)}
                          options={[
                            ['yes-need-help', 'Yes, Need Help Moving'],
                            ['no-already-empty', 'No, Room is Empty'],
                            ['minimal-furniture', 'Minimal Furniture'],
                          ]}
                        />
                      </>
                    )}

                    {(formData.projectType === 'new-hardwood' ||
                      formData.projectType === 'luxury-vinyl') && (
                      <>
                        <SelectBlock
                          id="woodSpecies"
                          label="Wood Species / Material"
                          value={formData.woodSpecies}
                          onChange={(v) => updateField('woodSpecies', v)}
                          options={
                            formData.projectType === 'new-hardwood'
                              ? [
                                  ['oak', 'Oak'],
                                  ['maple', 'Maple'],
                                  ['walnut', 'Walnut'],
                                  ['cherry', 'Cherry'],
                                  ['hickory', 'Hickory'],
                                ]
                              : [
                                  ['lvp-wood-look', 'LVP - Wood Look'],
                                  ['lvp-stone-look', 'LVP - Stone Look'],
                                  ['lvp-tile-look', 'LVP - Tile Look'],
                                ]
                          }
                        />

                        {formData.projectType === 'new-hardwood' && (
                          <SelectBlock
                            id="finishStyle"
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
                          id="demoNeeded"
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
                      <>
                        <SelectBlock
                          id="cabinetsTop"
                          label="Upper Cabinets"
                          value={formData.cabinetsTop}
                          onChange={(v) => updateField('cabinetsTop', v)}
                          options={[
                            ['keep-existing', 'Keep Existing'],
                            ['refacing', 'Refacing'],
                            ['new-cabinets', 'New Cabinets'],
                          ]}
                        />
                        <SelectBlock
                          id="cabinetsBottom"
                          label="Lower Cabinets"
                          value={formData.cabinetsBottom}
                          onChange={(v) => updateField('cabinetsBottom', v)}
                          options={[
                            ['keep-existing', 'Keep Existing'],
                            ['refacing', 'Refacing'],
                            ['new-cabinets', 'New Cabinets'],
                          ]}
                        />
                        <SelectBlock
                          id="countertops"
                          label="Countertops"
                          value={formData.countertops}
                          onChange={(v) => updateField('countertops', v)}
                          options={[
                            ['granite', 'Granite'],
                            ['quartz', 'Quartz'],
                            ['marble', 'Marble'],
                            ['laminate', 'Laminate'],
                          ]}
                        />
                        <SelectBlock
                          id="backsplash"
                          label="Backsplash"
                          value={formData.backsplash}
                          onChange={(v) => updateField('backsplash', v)}
                          options={[
                            ['tile', 'Tile'],
                            ['glass', 'Glass'],
                            ['stone', 'Stone'],
                            ['none', 'None'],
                          ]}
                        />
                        <SelectBlock
                          id="sinkPlumbing"
                          label="Sink & Plumbing"
                          value={formData.sinkPlumbing}
                          onChange={(v) => updateField('sinkPlumbing', v)}
                          options={[
                            ['keep-existing', 'Keep Existing'],
                            ['new-sink', 'New Sink'],
                            ['full-plumbing', 'Full Plumbing Update'],
                          ]}
                        />
                        <SelectBlock
                          id="lightingFixtures"
                          label="Lighting"
                          value={formData.lightingFixtures}
                          onChange={(v) => updateField('lightingFixtures', v)}
                          options={[
                            ['keep-existing', 'Keep Existing'],
                            ['update-fixtures', 'Update Fixtures'],
                            ['recessed-lighting', 'Add Recessed Lighting'],
                          ]}
                        />
                      </>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="length" className="text-sm">
                          Length (feet)
                        </Label>
                        <Input
                          id="length"
                          type="number"
                          placeholder="20"
                          value={formData.length}
                          onChange={(e) => updateField('length', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="width" className="text-sm">
                          Width (feet)
                        </Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="15"
                          value={formData.width}
                          onChange={(e) => updateField('width', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="totalSqft" className="text-sm">
                        Total Square Feet (editable)
                      </Label>
                      <Input
                        id="totalSqft"
                        type="number"
                        placeholder="300"
                        value={formData.totalSqft}
                        onChange={(e) => updateField('totalSqft', e.target.value)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Auto-calculated from L × W, but you can edit
                      </p>
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm">Timeline</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {TIMELINE.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => updateField('urgency', t.id)}
                            className={`rounded-xl border p-3 text-left transition ${
                              formData.urgency === t.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                          >
                            <div className="font-semibold">{t.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.sub}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {priceRange && (
                      <div
                        className={`rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 ${
                          pricePulse ? 'animate-pulse' : ''
                        }`}
                      >
                        <p className="mb-2 text-sm font-medium text-muted-foreground">
                          Your Estimated Price Range
                        </p>
                        <p className="mb-1 text-3xl font-bold">
                          ${priceRange.min} - ${priceRange.max}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Average: ${priceRange.avg} • Based on {formData.totalSqft} sq ft • ${priceRange.base}/sqft
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <TextField
                        id="firstName"
                        label="First Name"
                        value={formData.firstName}
                        onChange={(v) => updateField('firstName', v)}
                      />
                      <TextField
                        id="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(v) => updateField('lastName', v)}
                      />
                    </div>
                    <TextField
                      id="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(v) => updateField('email', v)}
                    />
                    <TextField
                      id="phone"
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(v) => updateField('phone', v)}
                    />
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6 py-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-2xl font-bold">
                        Thank You, {formData.firstName}!
                      </h3>
                      <p className="text-muted-foreground">
                        We&apos;ve received your information and will contact you shortly
                        with a detailed quote.
                      </p>
                    </div>

                    <div className="mx-auto max-w-md">
                      <ReviewsWidget
                        variant="inline"
                        title="Customers love Leon’s"
                      />
                    </div>

                    <div className="space-y-3 pt-4">
                      <Button onClick={goToCamera} size="lg" className="w-full">
                        <Scan className="mr-2 h-5 w-5" />
                        Try AR Visualizer
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full bg-transparent"
                        onClick={goToSchedule}
                      >
                        <Calendar className="mr-2 h-5 w-5" />
                        Schedule Free Consultation
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep < 5 && (
                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    {currentStep < 4 ? (
                      <Button onClick={handleNext} disabled={!canProceed()}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={!canProceed() || isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Get My Quote'}
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="sticky top-20 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-sm text-gray-600">
                    {currentStep} / {totalSteps}
                  </p>
                </div>

                <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                    }}
                  />
                </div>

                <div className="mt-2 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Project</span>
                    <span className="font-medium">
                      {PROJECT_TYPES.find((p) => p.id === formData.projectType)?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality</span>
                    <span className="font-medium capitalize">
                      {formData.qualityTier || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span className="font-medium">
                      {formData.totalSqft ? `${formData.totalSqft} sq ft` : '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    onClick={goToCamera}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    View in AR
                  </Button>
                  <Button
                    onClick={goToSchedule}
                    variant="outline"
                    className="border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </Card>

              <ReviewsWidget variant="inline" title="Customers love Leon’s" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectBlock({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
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

function TextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}