"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronRight, ChevronLeft, Camera } from "lucide-react"
import { useRouter } from "next/navigation"

const PROJECT_TYPES = [
  {
    id: "refinish",
    label: "Refinishing existing hardwood",
    description: "Keep your current wood, upgrade the look.",
  },
  {
    id: "new_hardwood",
    label: "New hardwood installation",
    description: "Fresh install — new layout, new vibe.",
  },
  {
    id: "luxury_vinyl",
    label: "Luxury vinyl / waterproof options",
    description: "Budget-friendly, durable, kid- and dog-proof.",
  },
  {
    id: "kitchen_remodel",
    label: "Kitchen or full remodel",
    description: "Floors + cabinets + layout — full transformation.",
  },
]

const QUALITY_LEVELS = [
  { id: "economy", label: "Economy", multiplier: 0.9 },
  { id: "standard", label: "Standard", multiplier: 1 },
  { id: "premium", label: "Premium", multiplier: 1.25 },
]

const LOCATION_TIERS = [
  { id: "low", label: "Lower Cost Area", multiplier: 0.9 },
  { id: "medium", label: "Average Cost Area", multiplier: 1 },
  { id: "high", label: "High Cost Area (LA, NYC, SF)", multiplier: 1.2 },
]

const TIMELINES = [
  { id: "asap", label: "ASAP", caption: "Something urgent going on." },
  { id: "2-4-weeks", label: "Within 2–4 weeks", caption: "Perfect for most projects." },
  { id: "1-2-months", label: "Within 1–2 months", caption: "Plenty of time to plan." },
  { id: "2-plus-months", label: "2+ months out", caption: "No rush, just exploring options." },
]

interface CalculatorForm {
  projectType: string
  squareFeet: string
  quality: string
  locationCostTier: string
  hasStairs: boolean
  stairCount: string
  needsDemo: boolean
  needsSubfloorPrep: boolean
  moveFurniture: boolean
  haulAwayDebris: boolean
  rushJob: boolean
  timeline: string
  name: string
  email: string
  phone: string
  address: string
  notes: string
}

export default function CalculatorPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CalculatorForm>({
    projectType: "",
    squareFeet: "",
    quality: "standard",
    locationCostTier: "medium",
    hasStairs: false,
    stairCount: "",
    needsDemo: false,
    needsSubfloorPrep: false,
    moveFurniture: false,
    haulAwayDebris: false,
    rushJob: false,
    timeline: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  const totalSteps = 5

  const priceEstimate = useMemo(() => {
    if (!form.projectType || !form.squareFeet) return null

    const sqft = Number.parseFloat(form.squareFeet)
    if (sqft <= 0 || Number.isNaN(sqft)) return null

    // Base rates per sq ft
    const baseRates: Record<string, [number, number]> = {
      refinish: [3.5, 5.5],
      new_hardwood: [6, 11],
      luxury_vinyl: [3, 6.5],
      kitchen_remodel: [7, 12],
    }

    let [minRate, maxRate] = baseRates[form.projectType] || [5, 10]

    // Quality multiplier
    const qualityMult = QUALITY_LEVELS.find((q) => q.id === form.quality)?.multiplier || 1
    minRate *= qualityMult
    maxRate *= qualityMult

    // Location multiplier
    const locationMult = LOCATION_TIERS.find((l) => l.id === form.locationCostTier)?.multiplier || 1
    minRate *= locationMult
    maxRate *= locationMult

    // Small job minimum
    const effectiveSqFt = sqft < 600 ? 600 : sqft
    const baseMin = minRate * effectiveSqFt
    const baseMax = maxRate * effectiveSqFt

    let addMin = 0
    let addMax = 0

    // Stairs
    if (form.hasStairs && form.stairCount) {
      const stairs = Number.parseInt(form.stairCount)
      if (stairs > 0) {
        addMin += 80 * locationMult * stairs
        addMax += 130 * locationMult * stairs
      }
    }

    // Demo
    if (form.needsDemo) {
      addMin += 0.75 * locationMult * sqft
      addMax += 1.5 * locationMult * sqft
    }

    // Subfloor prep
    if (form.needsSubfloorPrep) {
      addMin += 0.75 * locationMult * sqft
      addMax += 1.5 * locationMult * sqft
    }

    // Furniture moving
    if (form.moveFurniture) {
      addMin += 250 * locationMult
      addMax += 550 * locationMult
    }

    // Haul away
    if (form.haulAwayDebris) {
      addMin += 150 * locationMult
      addMax += 350 * locationMult
    }

    // Kitchen add-on
    if (form.projectType === "kitchen_remodel") {
      addMin += 15000 * locationMult
      addMax += 35000 * locationMult
    }

    const totalMin = baseMin + addMin
    const totalMax = baseMax + addMax

    // Rush job
    if (form.rushJob) {
      const rushMin = totalMin * 0.1
      const rushMax = totalMax * 0.25
      return {
        min: Math.round((totalMin + rushMin) / 25) * 25,
        max: Math.round((totalMax + rushMax) / 25) * 25,
      }
    }

    return {
      min: Math.round(totalMin / 25) * 25,
      max: Math.round(totalMax / 25) * 25,
    }
  }, [form])

  const canNext =
    (step === 1 && !!form.projectType) ||
    (step === 2 && !!form.squareFeet) ||
    (step === 3 && !!form.timeline) ||
    step === 4 ||
    step === 5

  function next() {
    if (step < totalSteps && canNext) setStep(step + 1)
  }

  function back() {
    if (step > 1) setStep(step - 1)
  }

  function updateField(field: keyof CalculatorForm, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const response = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          projectType: form.projectType,
          estimatedSqft: Number.parseFloat(form.squareFeet),
          estimatedPrice: priceEstimate ? (priceEstimate.min + priceEstimate.max) / 2 : 0,
          roomMeasurements: {
            sqft: Number.parseFloat(form.squareFeet),
            quality: form.quality,
            locationTier: form.locationCostTier,
          },
          arSessionData: {
            timeline: form.timeline,
            hasStairs: form.hasStairs,
            stairCount: form.stairCount,
            needsDemo: form.needsDemo,
            needsSubfloorPrep: form.needsSubfloorPrep,
            moveFurniture: form.moveFurniture,
            haulAwayDebris: form.haulAwayDebris,
            rushJob: form.rushJob,
            timestamp: new Date().toISOString(),
          },
          notes: form.notes,
        }),
      })

      if (response.ok) {
        alert("Thank you! We'll contact you soon with a detailed quote.")
        router.push("/")
      } else {
        alert("Failed to submit. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Submit error:", error)
      alert("Failed to submit. Please try again.")
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      {/* Header */}
      <section className="mx-auto mb-8 w-full max-w-3xl text-center">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Project Calculator</h1>
        <p className="mx-auto max-w-xl text-sm text-slate-300 md:text-base">
          Get a transparent, no-pressure price range for your flooring or kitchen project in just a few steps.
        </p>
      </section>

      {/* Card */}
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl md:p-8">
        {/* Progress */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Step {step} of {totalSteps}
          </p>
          <div className="ml-4 h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-orange-500 transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>

        {/* Step content */}
        {step === 1 && <StepProjectType value={form.projectType} onChange={(v) => updateField("projectType", v)} />}
        {step === 2 && (
          <StepDetails
            projectType={form.projectType}
            squareFeet={form.squareFeet}
            quality={form.quality}
            locationTier={form.locationCostTier}
            hasStairs={form.hasStairs}
            stairCount={form.stairCount}
            needsDemo={form.needsDemo}
            needsSubfloorPrep={form.needsSubfloorPrep}
            moveFurniture={form.moveFurniture}
            haulAwayDebris={form.haulAwayDebris}
            onChange={updateField}
          />
        )}
        {step === 3 && <StepTimeline value={form.timeline} rushJob={form.rushJob} onChange={updateField} />}
        {step === 4 && <StepSummary form={form} priceEstimate={priceEstimate} />}
        {step === 5 && <StepContact form={form} onChange={updateField} onSubmit={handleSubmit} />}

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            onClick={back}
            disabled={step === 1}
            variant="outline"
            className="border-slate-700 text-slate-200 hover:border-slate-500 disabled:cursor-default disabled:opacity-40 bg-transparent"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {step < totalSteps && (
              <Button onClick={next} disabled={!canNext} className="bg-orange-600 hover:bg-orange-700">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* AR Camera Link */}
        <div className="mt-6 border-t border-slate-800 pt-6">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-orange-600/50 text-orange-500 hover:bg-orange-600/10"
          >
            <Camera className="mr-2 h-4 w-4" />
            Or use AR Camera to visualize & measure
          </Button>
        </div>

        <p className="mt-4 text-[11px] text-slate-500">
          This calculator provides ballpark ranges only. Final pricing is always verified on site.
        </p>
      </section>
    </main>
  )
}

function StepProjectType({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <h2 className="mb-3 text-xl font-semibold text-white md:text-2xl">What kind of project are you working on?</h2>
      <p className="mb-6 text-sm text-slate-300">
        We'll use your answer to shape realistic price ranges and explain what's involved.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {PROJECT_TYPES.map((option) => {
          const active = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-orange-500 bg-slate-900/90 ring-2 ring-orange-500/50"
                  : "border-slate-700 bg-slate-900 hover:border-orange-400 hover:bg-slate-900/80"
              }`}
            >
              <span className="block font-medium text-white">{option.label}</span>
              <span className="block text-xs text-slate-400">{option.description}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function StepDetails({
  projectType,
  squareFeet,
  quality,
  locationTier,
  hasStairs,
  stairCount,
  needsDemo,
  needsSubfloorPrep,
  moveFurniture,
  haulAwayDebris,
  onChange,
}: {
  projectType: string
  squareFeet: string
  quality: string
  locationTier: string
  hasStairs: boolean
  stairCount: string
  needsDemo: boolean
  needsSubfloorPrep: boolean
  moveFurniture: boolean
  haulAwayDebris: boolean
  onChange: (field: string, value: any) => void
}) {
  const project = PROJECT_TYPES.find((p) => p.id === projectType)?.label || "your project"

  return (
    <>
      <h2 className="mb-3 text-xl font-semibold text-white md:text-2xl">Project details</h2>
      <p className="mb-6 text-sm text-slate-300">Help us estimate costs accurately for {project}.</p>

      <div className="space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-[0.2em] text-slate-400">Square Footage *</Label>
          <div className="mt-2 flex items-center gap-3">
            <Input
              type="number"
              min="100"
              step="10"
              value={squareFeet}
              onChange={(e) => onChange("squareFeet", e.target.value)}
              placeholder="e.g. 800, 1200, 2500…"
              className="flex-1 border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
            />
            <span className="whitespace-nowrap text-xs text-slate-400">sq ft</span>
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-[0.2em] text-slate-400">Quality Level</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {QUALITY_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => onChange("quality", level.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  quality === level.id
                    ? "border-orange-500 bg-orange-600/20 text-orange-500"
                    : "border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-[0.2em] text-slate-400">Location Cost Tier</Label>
          <div className="mt-2 grid gap-2">
            {LOCATION_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => onChange("locationCostTier", tier.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  locationTier === tier.id
                    ? "border-orange-500 bg-orange-600/20 text-orange-500"
                    : "border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-white">Additional Requirements</h3>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={hasStairs}
              onChange={(e) => onChange("hasStairs", e.target.checked)}
              className="mt-1"
            />
            <span className="flex-1 text-sm text-slate-300">Stairs to refinish/install</span>
          </label>

          {hasStairs && (
            <div className="ml-6">
              <Input
                type="number"
                min="1"
                value={stairCount}
                onChange={(e) => onChange("stairCount", e.target.value)}
                placeholder="Number of stairs"
                className="border-slate-700 bg-slate-900 text-white"
              />
            </div>
          )}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={needsDemo}
              onChange={(e) => onChange("needsDemo", e.target.checked)}
              className="mt-1"
            />
            <span className="flex-1 text-sm text-slate-300">Remove existing flooring</span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={needsSubfloorPrep}
              onChange={(e) => onChange("needsSubfloorPrep", e.target.checked)}
              className="mt-1"
            />
            <span className="flex-1 text-sm text-slate-300">Subfloor prep/leveling needed</span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={moveFurniture}
              onChange={(e) => onChange("moveFurniture", e.target.checked)}
              className="mt-1"
            />
            <span className="flex-1 text-sm text-slate-300">Move & reset furniture</span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={haulAwayDebris}
              onChange={(e) => onChange("haulAwayDebris", e.target.checked)}
              className="mt-1"
            />
            <span className="flex-1 text-sm text-slate-300">Jobsite cleanup & debris haul-away</span>
          </label>
        </div>
      </div>
    </>
  )
}

function StepTimeline({
  value,
  rushJob,
  onChange,
}: {
  value: string
  rushJob: boolean
  onChange: (field: string, value: any) => void
}) {
  return (
    <>
      <h2 className="mb-3 text-xl font-semibold text-white md:text-2xl">When do you want this done?</h2>
      <p className="mb-6 text-sm text-slate-300">
        Whatever your timing, we'll work with you to build a plan that makes sense.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {TIMELINES.map((option) => {
          const active = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange("timeline", option.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-orange-500 bg-slate-900/90 ring-2 ring-orange-500/50"
                  : "border-slate-700 bg-slate-900 hover:border-orange-400 hover:bg-slate-900/80"
              }`}
            >
              <span className="block font-medium text-white">{option.label}</span>
              <span className="block text-xs text-slate-400">{option.caption}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-lg border border-orange-600/30 bg-orange-600/10 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={rushJob}
            onChange={(e) => onChange("rushJob", e.target.checked)}
            className="mt-1"
          />
          <div className="flex-1">
            <span className="block text-sm font-medium text-orange-400">Rush job (10-25% premium)</span>
            <span className="block text-xs text-slate-400">Faster scheduling with overtime allowance</span>
          </div>
        </label>
      </div>
    </>
  )
}

function StepSummary({
  form,
  priceEstimate,
}: {
  form: CalculatorForm
  priceEstimate: { min: number; max: number } | null
}) {
  return (
    <>
      <h2 className="mb-3 text-xl font-semibold text-white md:text-2xl">Here's your ballpark range</h2>
      <p className="mb-6 text-sm text-slate-300">
        This is a realistic bracket based on your project type, square footage, and typical work requirements.
      </p>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-orange-500 bg-slate-900/80 p-5">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-orange-300">Estimated Range</p>
          {priceEstimate ? (
            <>
              <p className="mb-1 text-2xl font-semibold text-white">
                ${priceEstimate.min.toLocaleString()} – ${priceEstimate.max.toLocaleString()}
              </p>
              <p className="text-xs text-slate-300">
                Final price depends on details like subfloor condition, repairs, and design choices.{" "}
                <span className="text-orange-300">No surprises — all details explained before you sign.</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-300">Add square footage to see your range.</p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">Project Type</p>
            <p className="text-slate-100">{PROJECT_TYPES.find((p) => p.id === form.projectType)?.label ?? "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">Square Footage</p>
            <p className="text-slate-100">{form.squareFeet ? `${form.squareFeet} sq ft` : "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">Timeline</p>
            <p className="text-slate-100">{TIMELINES.find((t) => t.id === form.timeline)?.label ?? "—"}</p>
          </div>
        </div>
      </div>

      <p className="mb-2 text-xs text-slate-300">
        From here, we verify measurements, confirm the exact scope, and lock in a written proposal.
      </p>
      <p className="text-[11px] text-slate-500">No pressure, no weird sales games — just clear numbers.</p>
    </>
  )
}

function StepContact({
  form,
  onChange,
  onSubmit,
}: {
  form: CalculatorForm
  onChange: (field: string, value: any) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <>
      <h2 className="mb-3 text-xl font-semibold text-white md:text-2xl">Get your detailed quote</h2>
      <p className="mb-6 text-sm text-slate-300">
        We'll reach out to verify details and schedule an on-site consultation.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-slate-300">
            Full Name *
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            className="mt-1 border-slate-700 bg-slate-800 text-white"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-slate-300">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            required
            className="mt-1 border-slate-700 bg-slate-800 text-white"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-slate-300">
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="mt-1 border-slate-700 bg-slate-800 text-white"
          />
        </div>
        <div>
          <Label htmlFor="address" className="text-slate-300">
            Project Address
          </Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
            className="mt-1 border-slate-700 bg-slate-800 text-white"
          />
        </div>
        <div>
          <Label htmlFor="notes" className="text-slate-300">
            Additional Notes
          </Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            rows={3}
            className="mt-1 border-slate-700 bg-slate-800 text-white"
          />
        </div>
        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
          Submit Quote Request
        </Button>
      </form>
    </>
  )
}
