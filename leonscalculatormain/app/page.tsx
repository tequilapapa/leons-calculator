"use client"

import { useState, useMemo } from "react"

const PROJECT_TYPES = [
  {
    id: "refinish",
    label: "Refinishing existing hardwood",
    description: "Keep your current wood, upgrade the look.",
  },
  {
    id: "new-hardwood",
    label: "New hardwood installation",
    description: "Fresh install — new layout, new vibe.",
  },
  {
    id: "lvp",
    label: "Luxury vinyl / waterproof options",
    description: "Budget-friendly, durable, kid- and dog-proof.",
  },
  {
    id: "kitchen-remodel",
    label: "Kitchen or full remodel",
    description: "Floors + cabinets + layout — full transformation.",
  },
]

const TIMELINES = [
  { id: "asap", label: "ASAP", caption: "Something urgent going on." },
  {
    id: "2-4-weeks",
    label: "Within 2–4 weeks",
    caption: "Perfect for most projects.",
  },
  {
    id: "1-2-months",
    label: "Within 1–2 months",
    caption: "Plenty of time to plan.",
  },
  {
    id: "2-plus-months",
    label: "2+ months out",
    caption: "No rush, just exploring options.",
  },
]

const APPOINTMENT_TYPES = [
  { id: "info-call", label: "Just an informational call" },
  { id: "virtual", label: "Virtual consult" },
  { id: "in-person", label: "On-site visit / measurement" },
  { id: "undecided", label: "Not sure yet, just exploring" },
]

function getPriceRange({ projectType, sqft }: { projectType: string; sqft: string }) {
  const area = Number(sqft)
  if (!projectType || !area || Number.isNaN(area)) return null

  let lowPer = 8
  let highPer = 18

  switch (projectType) {
    case "refinish":
      lowPer = 4
      highPer = 9
      break
    case "new-hardwood":
      lowPer = 9
      highPer = 20
      break
    case "lvp":
      lowPer = 5
      highPer = 12
      break
    case "kitchen-remodel":
      lowPer = 18
      highPer = 35
      break
    default:
      break
  }

  return {
    low: Math.round(area * lowPer),
    high: Math.round(area * highPer),
  }
}

interface FormState {
  projectType: string
  sqft: string
  timeline: string
}

interface ContactState {
  name: string
  email: string
  phone: string
  zip: string
  appointmentType: string
  preferredDate: string
  preferredTime: string
  notes: string
}

export default function CalculatorPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    projectType: "",
    sqft: "",
    timeline: "",
  })

  const [contact, setContact] = useState<ContactState>({
    name: "",
    email: "",
    phone: "",
    zip: "",
    appointmentType: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<null | "ok" | "error">(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const totalSteps = 4

  const priceRange = useMemo(
    () => getPriceRange({ projectType: form.projectType, sqft: form.sqft }),
    [form.projectType, form.sqft],
  )

  const canNext =
    (step === 1 && !!form.projectType) || (step === 2 && !!form.sqft) || (step === 3 && !!form.timeline) || step === 4

  function next() {
    if (step < totalSteps && canNext) setStep(step + 1)
  }

  function back() {
    if (step > 1) setStep(step - 1)
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateContact(field: keyof ContactState, value: string) {
    setContact((prev) => ({ ...prev, [field]: value }))
  }

  const canSubmit = !!priceRange && !!contact.name && (!!contact.phone || !!contact.email) && !!contact.appointmentType

  async function handleSubmit() {
    if (!priceRange) return

    setSubmitting(true)
    setSubmitted(null)
    setSubmitError(null)

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectType: form.projectType,
          size: Number(form.sqft),
          extras: {
            timeline: form.timeline,
            appointmentType: contact.appointmentType,
            preferredDate: contact.preferredDate || null,
            preferredTime: contact.preferredTime || null,
            notes: contact.notes || null,
          },
          zip: contact.zip || null,
          estimateRange: priceRange,
          contact: {
            name: contact.name,
            email: contact.email || null,
            phone: contact.phone || null,
          },
          meta: {
            source: "leons-calculator",
            createdAt: new Date().toISOString(),
            // You can add more meta later (utm, pageUrl, etc.)
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Submission failed")
      }

      setSubmitted("ok")
    } catch (err: any) {
      console.error("Lead submit error:", err)
      setSubmitError(err?.message || "Something went wrong submitting your details.")
      setSubmitted("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* Header */}
      <section className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Leon&apos;s Project Calculator</h1>
        <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto">
          Get a transparent, no-pressure price range for your flooring or kitchen project in just a few steps. No fake
          suspense, no spam — just real numbers and clear options.
        </p>
        <a
          href="/camera"
          className="inline-flex items-center gap-2 mt-4 text-xs text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>📷</span>
          <span>Try our AR Camera Visualizer — see floors in your actual space</span>
        </a>
      </section>

      {/* Card */}
      <section className="w-full max-w-3xl bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step {step}</p>
          <div className="flex-1 ml-4 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>

        {/* Step content */}
        {step === 1 && <StepProjectType value={form.projectType} onChange={(v) => updateField("projectType", v)} />}

        {step === 2 && (
          <StepSqft projectType={form.projectType} value={form.sqft} onChange={(v) => updateField("sqft", v)} />
        )}

        {step === 3 && <StepTimeline value={form.timeline} onChange={(v) => updateField("timeline", v)} />}

        {step === 4 && (
          <StepSummary
            form={form}
            priceRange={priceRange}
            contact={contact}
            onContactChange={updateContact}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            submitting={submitting}
            submitted={submitted}
            submitError={submitError}
          />
        )}

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={back}
            disabled={step === 1}
            className="text-xs md:text-sm rounded-xl border border-slate-700 px-4 py-2 text-slate-200 disabled:opacity-40 disabled:cursor-default hover:border-slate-500 transition"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            {step < totalSteps && (
              <button
                onClick={next}
                disabled={!canNext}
                className="text-xs md:text-sm rounded-xl bg-emerald-500 px-5 py-2 font-medium text-slate-950 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-emerald-400 transition"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          This calculator is for ballpark ranges only. Final pricing is always verified on site so there are no
          surprises — ever.
        </p>
        <div className="mt-6 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
          <p className="text-xs text-emerald-300 mb-2 font-medium">Want to see these floors in your actual space?</p>
          <a
            href="/camera"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-emerald-950 rounded-lg text-xs font-semibold hover:bg-emerald-400 transition"
          >
            <span>📷</span>
            <span>Open AR Camera Visualizer</span>
          </a>
        </div>
      </section>
    </main>
  )
}

function StepProjectType({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">What kind of project are you working on?</h2>
      <p className="text-sm text-slate-300 mb-6">
        We&apos;ll use your answer to shape realistic price ranges and explain what&apos;s involved — so you understand
        the &quot;why&quot; behind the numbers.
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
                  ? "border-emerald-400 bg-slate-900/90"
                  : "border-slate-700 bg-slate-900 hover:border-emerald-400 hover:bg-slate-900/80"
              }`}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="block text-xs text-slate-400">{option.description}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function StepSqft({
  projectType,
  value,
  onChange,
}: {
  projectType: string
  value: string
  onChange: (v: string) => void
}) {
  const project = PROJECT_TYPES.find((p) => p.id === projectType)?.label || "your project"

  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">About how many square feet are we working with?</h2>
      <p className="text-sm text-slate-300 mb-6">
        It doesn&apos;t have to be perfect — a good guess lets us build a realistic range for {project}. You can use
        your listing, plans, or just rough room sizes.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
            APPROXIMATE SQUARE FOOTAGE
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="100"
              step="10"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. 800, 1200, 2500…"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">sq ft</span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Not sure? Start with your best guess — your estimator will verify measurements on site before anything is
          final.
        </p>
      </div>
    </>
  )
}

function StepTimeline({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">When do you want this done?</h2>
      <p className="text-sm text-slate-300 mb-6">
        Whatever your timing, we&apos;ll work with you to build a plan that makes sense. Faster timelines are possible —
        they just book up first.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {TIMELINES.map((option) => {
          const active = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-emerald-400 bg-slate-900/90"
                  : "border-slate-700 bg-slate-900 hover:border-emerald-400 hover:bg-slate-900/80"
              }`}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="block text-xs text-slate-400">{option.caption}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function StepSummary({
  form,
  priceRange,
  contact,
  onContactChange,
  onSubmit,
  canSubmit,
  submitting,
  submitted,
  submitError,
}: {
  form: FormState
  priceRange: { low: number; high: number } | null
  contact: ContactState
  onContactChange: (field: keyof ContactState, value: string) => void
  onSubmit: () => void
  canSubmit: boolean
  submitting: boolean
  submitted: null | "ok" | "error"
  submitError: string | null
}) {
  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">Here&apos;s your ballpark range.</h2>
      <p className="text-sm text-slate-300 mb-6">
        This isn&apos;t a gimmick number — it&apos;s a realistic bracket based on the project type, approximate square
        footage, and the kind of work Leon&apos;s typically does in homes like yours.
      </p>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-emerald-500 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-2">ESTIMATED RANGE</p>
          {priceRange ? (
            <>
              <p className="text-2xl font-semibold mb-1">
                ${priceRange.low.toLocaleString()} – ${priceRange.high.toLocaleString()}
              </p>
              <p className="text-xs text-slate-300">
                Final price depends on details like subfloor, repairs, stairs, finish system, and design choices.{" "}
                <span className="text-emerald-300">No surprises — all of that is explained before you ever sign.</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-300">
              Add a square footage estimate in the previous step to see your range.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">PROJECT TYPE</p>
            <p className="text-slate-100">{PROJECT_TYPES.find((p) => p.id === form.projectType)?.label ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">APPROX. SQUARE FOOTAGE</p>
            <p className="text-slate-100">{form.sqft ? `${form.sqft} sq ft` : "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">TIMELINE</p>
            <p className="text-slate-100">{TIMELINES.find((t) => t.id === form.timeline)?.label ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Contact + appointment options */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/70 p-5 space-y-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-100">
          Want to save this estimate and talk through next steps?
        </h3>
        <p className="text-xs text-slate-300">
          Share a bit of contact info and how you&apos;d like to connect.{" "}
          <span className="text-emerald-300">No hard sales, no spam — just a real person from Leon&apos;s.</span>
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">NAME</label>
            <input
              type="text"
              value={contact.name}
              onChange={(e) => onContactChange("name", e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />

            <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400 mt-3">EMAIL</label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) => onContactChange("email", e.target.value)}
              placeholder="Optional, but helpful"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />

            <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400 mt-3">PHONE</label>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => onContactChange("phone", e.target.value)}
              placeholder="Best number to reach you"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">CITY / ZIP</label>
            <input
              type="text"
              value={contact.zip}
              onChange={(e) => onContactChange("zip", e.target.value)}
              placeholder="e.g. 90026"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />

            <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400 mt-3">
              HOW WOULD YOU LIKE TO CONNECT?
            </label>
            <select
              value={contact.appointmentType}
              onChange={(e) => onContactChange("appointmentType", e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
            >
              <option value="">Pick an option</option>
              {APPOINTMENT_TYPES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                  PREFERRED DATE
                </label>
                <input
                  type="date"
                  value={contact.preferredDate}
                  onChange={(e) => onContactChange("preferredDate", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                  PREFERRED TIME
                </label>
                <input
                  type="time"
                  value={contact.preferredTime}
                  onChange={(e) => onContactChange("preferredTime", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1 mt-3">
            ANYTHING ELSE WE SHOULD KNOW?
          </label>
          <textarea
            rows={3}
            value={contact.notes}
            onChange={(e) => onContactChange("notes", e.target.value)}
            placeholder="Pets, building rules, special requests, or anything you want us to keep in mind."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="text-xs md:text-sm rounded-xl bg-emerald-500 px-5 py-2 font-medium text-slate-950 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-emerald-400 transition"
        >
          {submitting
            ? "Saving your estimate…"
            : submitted === "ok"
              ? "Saved — we’ll follow up shortly"
              : "Save this estimate & continue with Leon's"}
        </button>

        {submitted === "ok" && (
          <p className="text-[11px] text-emerald-300">
            Got it — your estimate and project details are on file. A Leon&apos;s estimator will reach out using the
            contact info you provided.
          </p>
        )}

        {submitted === "error" && submitError && (
          <p className="text-[11px] text-red-400">Something went wrong saving your details: {submitError}</p>
        )}

        {submitted === null && (
          <p className="text-[11px] text-slate-500">
            Name + one way to reach you (phone or email) and how you&apos;d like to connect are required. Everything
            else just helps us be more prepared.
          </p>
        )}
      </div>

      <p className="text-[11px] text-slate-500 mt-4">
        No spam, ever. Your info stays between you and Leon&apos;s, and you can always tell us if you prefer text, call,
        or email.
      </p>
    </>
  )
}
