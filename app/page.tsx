'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, Check, Calendar } from 'lucide-react';

/* ---------------- TYPES ---------------- */

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
  totalSqft: string;
  urgency: Urgency;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

/* ---------------- CONSTANTS ---------------- */

const PROJECT_TYPES = [
  { id: 'new-hardwood', label: 'New Hardwood Install' },
  { id: 'refinishing', label: 'Refinishing Hardwood' },
  { id: 'luxury-vinyl', label: 'Luxury Vinyl' },
  { id: 'kitchen-remodel', label: 'Kitchen Remodels' },
];

const QUALITY_TIERS = [
  { id: 'economic', label: 'Economic' },
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: 'Premium' },
];

const TIMELINE = [
  { id: 'asap', label: 'ASAP' },
  { id: '1-2-weeks', label: '1–2 Weeks' },
  { id: '1-month', label: 'Within a Month' },
  { id: 'browsing', label: 'Just Browsing' },
];

/* ---------------- PAGE ---------------- */

export default function CalculatorPage() {
  const totalSteps = 5;
  const [step, setStep] = useState(1);
  const progress = (step / totalSteps) * 100;

  const [leadKey] = useState(() => {
    const existing = typeof window !== 'undefined'
      ? localStorage.getItem('leons_lead_key')
      : null;

    if (existing) return existing;

    const fresh = `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('leons_lead_key', fresh);
    }
    return fresh;
  });

  const [form, setForm] = useState<FormData>({
    projectType: '',
    qualityTier: '',
    totalSqft: '',
    urgency: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const update = (k: keyof FormData, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  /* ---------------- PROGRESSIVE CAPTURE ---------------- */

  const capture = async (event: string) => {
    try {
      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          step,
          leadKey,
          data: form,
          ts: Date.now(),
          source: 'quote.leonshardwood.com',
        }),
      });
    } catch {
      // never block UX
    }
  };

  /* ---------------- STEP VALIDATION ---------------- */

  const canNext = () => {
    switch (step) {
      case 1:
        return !!(form.projectType && form.qualityTier);
      case 2:
        return !!(form.totalSqft && form.urgency);
      case 3:
        return !!(form.firstName && form.lastName && form.email && form.phone);
      default:
        return true;
    }
  };

  const next = async () => {
    if (!canNext()) return;
    await capture('step_complete');
    setStep(s => s + 1);
  };

  const back = () => setStep(s => Math.max(1, s - 1));

  const submit = async () => {
    await capture('lead_submitted');
    setStep(5);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="min-h-screen bg-muted px-4 py-12">
      <Script
        src="https://link.msgsndr.com/js/external-tracking.js"
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Step {step} of {totalSteps}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="p-6">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>Project Type</Label>
              {PROJECT_TYPES.map(p => (
                <Button
                  key={p.id}
                  variant={form.projectType === p.id ? 'default' : 'outline'}
                  onClick={() => update('projectType', p.id)}
                  className="w-full justify-start"
                >
                  {p.label}
                </Button>
              ))}

              <Label>Quality</Label>
              {QUALITY_TIERS.map(q => (
                <Button
                  key={q.id}
                  variant={form.qualityTier === q.id ? 'default' : 'outline'}
                  onClick={() => update('qualityTier', q.id)}
                  className="w-full justify-start"
                >
                  {q.label}
                </Button>
              ))}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Total Square Feet</Label>
              <Input
                value={form.totalSqft}
                onChange={e => update('totalSqft', e.target.value)}
                type="number"
              />

              <Label>Timeline</Label>
              {TIMELINE.map(t => (
                <Button
                  key={t.id}
                  variant={form.urgency === t.id ? 'default' : 'outline'}
                  onClick={() => update('urgency', t.id)}
                  className="w-full justify-start"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <Input placeholder="First Name" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
              <Input placeholder="Last Name" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
              <Input placeholder="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              <Input placeholder="Phone" value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
          )}

          {/* STEP 5 – BOOKING */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <Check className="mx-auto h-10 w-10 text-green-600" />
              <h2 className="text-2xl font-bold">Book Your Free Consultation</h2>

              <iframe
                src="https://links.leonshardwood.com/booking/leons-hardwood-eneeq09cng6/sv/6976f752d8c47cb870b0dd4e?heightMode=full&showHeader=true"
                style={{ width: '100%', border: 'none' }}
                scrolling="no"
              />

              <Script
                src="https://links.leonshardwood.com/js/form_embed.js"
                strategy="afterInteractive"
              />
            </div>
          )}

          {/* NAV */}
          {step < 5 && (
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={back} disabled={step === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              {step < 3 ? (
                <Button onClick={next} disabled={!canNext()}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={!canNext()}>
                  Get My Quote <Calendar className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}

