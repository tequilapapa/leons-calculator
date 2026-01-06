'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DollarSign, Hammer, Layout, Ruler, Building2, Clock } from 'lucide-react';

/**
 * LA-tuned allowances (adjust to your market).
 * We separate MATERIAL vs LABOR so we can tax only materials.
 */
type CabinetGrade = 'stock' | 'semi' | 'custom';
type CounterMat = 'laminate' | 'butcher' | 'quartz' | 'granite' | 'porcelain';
type Scope = 'keep' | 'minor' | 'full';
type Appliances = 'none' | 'basic' | 'mid' | 'pro';
type Property = 'sfh' | 'townhome' | 'condo';
type Schedule = 'standard' | 'rush';

const PRICING = {
  // --- MATERIALS ---
  cabinetsMatPerLF: { stock: 350, semi: 450, custom: 700 }, // $/lf
  countersMatPerSF: { laminate: 45, butcher: 75, quartz: 110, granite: 95, porcelain: 130 }, // $/sf
  backsplashMatPerSF: 14,  // $/sf
  flooringMatPerSF: 9,   // optional add-on

  appliancesAllowance: { none: 0, basic: 4000, mid: 6000, pro:9000 }, // treated as materials (taxed)

  // --- LABOR ---
  cabinetInstallPerLF: 170,      // $/lf
  counterInstallPerSF: 29,       // $/sf
  backsplashInstallPerSF: 17,    // $/sf
  flooringLaborPerSF: 11,       // optional add-on

  plumbing: { keep: 0, minor: 1500, full: 3000 },
  electrical: { keep: 0, minor: 1500, full: 3500 },

  demo: { light: 800, standard: 1300, heavy: 2500 },

  permitsFlat: 1100,
  paintFlat: 1200,

  // --- FACTORS & FEES ---
  waste: { counters: 0.12, backsplash: 0.10, flooring: 0.08 },
  localTaxPct: 0.095,   // 9.5% (Los Angeles—change for your locale)
  overheadPct: 0.18,    // supervision, insurance, vehicles, etc.
  profitPct: 0.17,      // target net profit
  contingencyPct: 0.10, // unknowns
  marketFactor: 1.10,   // LA premium factor

  minJobTotal: 18000,   // minimum viable project
  islandAdderLabor: 1600, // extra framing/electrical for island
} as const;

export default function KitchenEstimator() {
  // --- INPUTS ---
  const [cabGrade, setCabGrade] = useState<CabinetGrade>('semi');
  const [cabLF, setCabLF] = useState(24);
  const [hasIsland, setHasIsland] = useState(true);

  const [counterMat, setCounterMat] = useState<CounterMat>('quartz');
  const [counterSF, setCounterSF] = useState(55);

  const [splashSF, setSplashSF] = useState(40);

  const [includeFlooring, setIncludeFlooring] = useState(false);
  const [flooringSF, setFlooringSF] = useState(180);

  const [appliances, setAppliances] = useState<Appliances>('mid');
  const [plumbing, setPlumbing] = useState<Scope>('minor');
  const [electrical, setElectrical] = useState<Scope>('minor');
  const [demo, setDemo] = useState<'light' | 'standard' | 'heavy'>('standard');

  const [includePermits, setIncludePermits] = useState(true);
  const [includePaint, setIncludePaint] = useState(true);

  // New: context multipliers that materially affect cost
  const [property, setProperty] = useState<Property>('sfh');        // single family / townhome / condo
  const [schedule, setSchedule] = useState<Schedule>('standard');   // rush increases cost
  const [premiumFinishes, setPremiumFinishes] = useState(true);     // tighter reveals, panel-ready, etc.
  const [pre1978, setPre1978] = useState(false);                    // older home complexity

  // --- COMPUTATION ---
  const breakdown = useMemo(() => {
    // materials (taxable)
    const cabsMat = PRICING.cabinetsMatPerLF[cabGrade] * cabLF;
    const countersMat = PRICING.countersMatPerSF[counterMat] * counterSF * (1 + PRICING.waste.counters);
    const splashMat = PRICING.backsplashMatPerSF * splashSF * (1 + PRICING.waste.backsplash);
    const floorMat = includeFlooring ? PRICING.flooringMatPerSF * flooringSF * (1 + PRICING.waste.flooring) : 0;
    const applMat = PRICING.appliancesAllowance[appliances];

    const materials = cabsMat + countersMat + splashMat + floorMat + applMat;

    // labor (non-taxable)
    const cabsLab = PRICING.cabinetInstallPerLF * cabLF + (hasIsland ? PRICING.islandAdderLabor : 0);
    const countersLab = PRICING.counterInstallPerSF * counterSF;
    const splashLab = PRICING.backsplashInstallPerSF * splashSF;
    const floorLab = includeFlooring ? PRICING.flooringLaborPerSF * flooringSF : 0;
    const mepLab = PRICING.plumbing[plumbing] + PRICING.electrical[electrical];
    const demoLab = PRICING.demo[demo];
    const paintLab = includePaint ? PRICING.paintFlat : 0;
    const permits = includePermits ? PRICING.permitsFlat : 0;

    let labor = cabsLab + countersLab + splashLab + floorLab + mepLab + demoLab + paintLab;

    // base direct cost (pre-burdens)
    const salesTax = materials * PRICING.localTaxPct;
    let direct = materials + salesTax + labor + permits;

    // context multipliers
    const propertyMult = property === 'sfh' ? 1.1 : property === 'townhome' ? 1.2 : 2.12; // condo/high-rise = 1.22
    const scheduleMult = schedule === 'standard' ? 1.0 : 1.15; // rush
    const premiumMult = premiumFinishes ? 1.28 : 1.12;        // reveals, panels, matching grain
    const ageMult = pre1978 ? 1.07 : 1.0;                    // plaster, lead-safe, unknowns

    const contextMult = propertyMult * scheduleMult * premiumMult * ageMult;

    // add overhead & profit, contingency, market factor
    const overhead = direct * PRICING.overheadPct;
    const burdened = direct + overhead;
    const profit = burdened * PRICING.profitPct;
    const withProfit = burdened + profit;
    const contingency = withProfit * PRICING.contingencyPct;

    let total = (withProfit + contingency) * PRICING.marketFactor * contextMult;

    // enforce minimum job total
    if (total < PRICING.minJobTotal) {
      total = PRICING.minJobTotal;
    }

    // expose line items for UI
    return {
      parts: {
        Materials: Math.round(materials),
        'Sales Tax': Math.round(salesTax),
        Labor: Math.round(labor),
        Permits: Math.round(permits),
        Overhead: Math.round(overhead),
        Profit: Math.round(profit),
        Contingency: Math.round(contingency),
      },
      totals: {
        direct: Math.round(direct),
        total: Math.round(total),
      },
      multipliers: { propertyMult, scheduleMult, premiumMult, ageMult },
    };
  }, [
    cabGrade, cabLF, hasIsland,
    counterMat, counterSF, splashSF,
    includeFlooring, flooringSF,
    appliances, plumbing, electrical, demo,
    includePermits, includePaint,
    property, schedule, premiumFinishes, pre1978,
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT: Inputs */}
      <div className="lg:col-span-2 space-y-6">
        {/* Context */}
        <Card className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Project Context</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Property type">
              <Select value={property} onChange={v => setProperty(v as Property)}>
                <option value="sfh">Single-family</option>
                <option value="townhome">Townhome</option>
                <option value="condo">Condo / High-rise</option>
              </Select>
            </Field>
            <Field label="Schedule">
              <Select value={schedule} onChange={v => setSchedule(v as Schedule)}>
                <option value="standard">Standard</option>
                <option value="rush">Rush (expedited)</option>
              </Select>
            </Field>
            <Field label="Premium finishes">
              <Toggle value={premiumFinishes} onChange={setPremiumFinishes} onLabel="Yes" offLabel="No" />
            </Field>
            <Field label="Home built pre-1978">
              <Toggle value={pre1978} onChange={setPre1978} onLabel="Yes" offLabel="No" />
            </Field>
          </div>
        </Card>

        {/* Cabinetry */}
        <Card className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Hammer className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Cabinetry</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Cabinet grade">
              <Select value={cabGrade} onChange={v => setCabGrade(v as CabinetGrade)}>
                <option value="stock">Stock (value)</option>
                <option value="semi">Semi-custom (most common)</option>
                <option value="custom">Custom</option>
              </Select>
            </Field>
            <Field label="Linear feet">
              <RangeNumber value={cabLF} onChange={setCabLF} min={10} max={70} step={1} suffix="lf" />
            </Field>
            <Field label="Kitchen island">
              <Toggle value={hasIsland} onChange={setHasIsland} onLabel="Yes" offLabel="No" />
            </Field>
          </div>
        </Card>

        {/* Counters & Backsplash */}
        <Card className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Counters & Backsplash</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Counter material">
              <Select value={counterMat} onChange={v => setCounterMat(v as CounterMat)}>
                <option value="laminate">Laminate</option>
                <option value="butcher">Butcher Block</option>
                <option value="quartz">Quartz</option>
                <option value="granite">Granite</option>
                <option value="porcelain">Porcelain/Sintered</option>
              </Select>
            </Field>
            <Field label="Counter area (sq ft)">
              <RangeNumber value={counterSF} onChange={setCounterSF} min={15} max={220} step={1} suffix="sf" />
            </Field>
            <Field label="Backsplash area (sq ft)">
              <RangeNumber value={splashSF} onChange={setSplashSF} min={0} max={240} step={1} suffix="sf" />
            </Field>
          </div>
        </Card>

        {/* Scope */}
        <Card className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Scope & Options</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Appliances">
              <Select value={appliances} onChange={v => setAppliances(v as Appliances)}>
                <option value="none">None</option>
                <option value="basic">Basic package</option>
                <option value="mid">Mid-grade</option>
                <option value="pro">Pro</option>
              </Select>
            </Field>

            <Field label="Plumbing scope">
              <Select value={plumbing} onChange={v => setPlumbing(v as Scope)}>
                <option value="keep">Keep existing</option>
                <option value="minor">Minor changes</option>
                <option value="full">New layout</option>
              </Select>
            </Field>

            <Field label="Electrical scope">
              <Select value={electrical} onChange={v => setElectrical(v as Scope)}>
                <option value="keep">Keep existing</option>
                <option value="minor">Minor changes</option>
                <option value="full">New circuits/lights</option>
              </Select>
            </Field>

            <Field label="Demo & disposal">
              <Select value={demo} onChange={v => setDemo(v as any)}>
                <option value="light">Light</option>
                <option value="standard">Standard</option>
                <option value="heavy">Heavy</option>
              </Select>
            </Field>

            <Field label="Include permits">
              <Toggle value={includePermits} onChange={setIncludePermits} onLabel="Yes" offLabel="No" />
            </Field>

            <Field label="Include paint">
              <Toggle value={includePaint} onChange={setIncludePaint} onLabel="Yes" offLabel="No" />
            </Field>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="Include flooring">
              <Toggle value={includeFlooring} onChange={setIncludeFlooring} onLabel="Yes" offLabel="No" />
            </Field>
            {includeFlooring && (
              <Field label="Flooring area (sq ft)">
                <RangeNumber value={flooringSF} onChange={setFlooringSF} min={60} max={800} step={10} suffix="sf" />
              </Field>
            )}
          </div>
        </Card>
      </div>

      {/* RIGHT: Summary */}
      <div className="space-y-6">
        <Card className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Estimate</h2>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            {Object.entries(breakdown.parts).map(([k, v]) => (
              <Row key={k} label={k} value={v} />
            ))}

            <div className="my-2 border-t border-gray-200" />
            <Row label="Direct Cost" value={breakdown.totals.direct} strong />
            <div className="border-t border-gray-200" />
            <Row label="Estimated Total" value={breakdown.totals.total} strong big />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => (window.location.href = 'https://www.leonshardwood.com/quote')}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              Book Appointment
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Save & Review
            </Button>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            * Materials taxed, labor not. Includes waste, overhead, profit, and contingency. Minimum job applied.
          </p>
        </Card>

        {/* Quick chips to show multipliers (optional) */}
        <Card className="rounded-2xl border border-gray-200 bg-white/70 p-4 text-xs text-gray-600">
          <div className="flex flex-wrap gap-2">
            <Chip label="Property" value={breakdown.multipliers.propertyMult.toFixed(2)} />
            <Chip label="Schedule" value={breakdown.multipliers.scheduleMult.toFixed(2)} />
            <Chip label="Finish" value={breakdown.multipliers.premiumMult.toFixed(2)} />
            <Chip label="Age" value={breakdown.multipliers.ageMult.toFixed(2)} />
            <Chip label="Market" value="1.20" />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Small UI helpers (modern + native, zero new deps) ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-600">{label}</Label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none ring-primary/30 transition focus:ring-2"
    >
      {children}
    </select>
  );
}

function Toggle({
  value,
  onChange,
  onLabel = 'On',
  offLabel = 'Off',
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
        value
          ? 'border-primary/40 bg-primary/10 text-gray-900'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span>{value ? onLabel : offLabel}</span>
      <span className={`inline-block h-5 w-10 rounded-full transition ${value ? 'bg-primary' : 'bg-gray-300'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${value ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

function RangeNumber({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 flex-1 appearance-none rounded bg-gray-200 accent-primary"
      />
      <div className="relative w-28">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="pr-10"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong, big }: { label: string; value: number; strong?: boolean; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${big ? 'text-base' : 'text-sm'} ${strong ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`${big ? 'text-xl' : 'text-sm'} ${strong ? 'font-semibold' : ''}`}>${value.toLocaleString()}</span>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
      <span className="text-[11px] uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800">{value}</span>
    </span>
  );
}