"use client";

import { useState, useMemo } from "react";

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
];

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
];

function getPriceRange({ projectType, sqft }) {
  const area = Number(sqft);
  if (!projectType || !area || Number.isNaN(area)) return null;

  let lowPer = 8;
  let highPer = 18;

  switch (projectType) {
    case "refinish":
      lowPer = 4;
      highPer = 9;
      break;
    case "new-hardwood":
      lowPer = 9;
      highPer = 20;
      break;
    case "lvp":
      lowPer = 5;
      highPer = 12;
      break;
    case "kitchen-remodel":
      lowPer = 18;
      highPer = 35;
      break;
    default:
      break;
  }

  return {
    low: Math.round(area * lowPer),
    high: Math.round(area * highPer),
  };
}

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    projectType: "",
    sqft: "",
    timeline: "",
  });

  const totalSteps = 4;

  const priceRange = useMemo(
    () => getPriceRange({ projectType: form.projectType, sqft: form.sqft }),
    [form.projectType, form.sqft]
  );

  const canNext =
    (step === 1 && !!form.projectType) ||
    (step === 2 && !!form.sqft) ||
    (step === 3 && !!form.timeline) ||
    step === 4;

  function next() {
    if (step < totalSteps && canNext) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* Header */}
      <section className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Leon&apos;s Project Calculator
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto">
          Get a transparent, no-pressure price range for your flooring or
          kitchen project in just a few steps. No fake suspense, no spam — just
          real numbers and clear options.
        </p>
      </section>

      {/* Card */}
      <section className="w-full max-w-3xl bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Step {step}
          </p>
          <div className="flex-1 ml-4 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        {step === 1 && (
          <StepProjectType
            value={form.projectType}
            onChange={(v) => updateField("projectType", v)}
          />
        )}

        {step === 2 && (
          <StepSqft
            projectType={form.projectType}
            value={form.sqft}
            onChange={(v) => updateField("sqft", v)}
          />
        )}

        {step === 3 && (
          <StepTimeline
            value={form.timeline}
            onChange={(v) => updateField("timeline", v)}
          />
        )}

        {step === 4 && <StepSummary form={form} priceRange={priceRange} />}

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

            {step === totalSteps && (
              <button
                type="button"
                className="text-xs md:text-sm rounded-xl bg-emerald-500 px-5 py-2 font-medium text-slate-950 hover:bg-emerald-400 transition"
              >
                Save &amp; Continue With Leon&apos;s
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          This calculator is for ballpark ranges only. Final pricing is always
          verified on site so there are no surprises — ever.
        </p>
      </section>
    </main>
  );
}

function StepProjectType({ value, onChange }) {
  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">
        What kind of project are you working on?
      </h2>
      <p className="text-sm text-slate-300 mb-6">
        We&apos;ll use your answer to shape realistic price ranges and explain
        what&apos;s involved — so you understand the &quot;why&quot; behind the
        numbers.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {PROJECT_TYPES.map((option) => {
          const active = value === option.id;
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
              <span className="block text-xs text-slate-400">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepSqft({ projectType, value, onChange }) {
  const project =
    PROJECT_TYPES.find((p) => p.id === projectType)?.label || "your project";

  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">
        About how many square feet are we working with?
      </h2>
      <p className="text-sm text-slate-300 mb-6">
        It doesn&apos;t have to be perfect — a good guess lets us build a
        realistic range for {project}. You can use your listing, plans, or just
        rough room sizes.
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
            <span className="text-xs text-slate-400 whitespace-nowrap">
              sq ft
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Not sure? Start with your best guess — your estimator will verify
          measurements on site before anything is final.
        </p>
      </div>
    </>
  );
}

function StepTimeline({ value, onChange }) {
  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">
        When do you want this done?
      </h2>
      <p className="text-sm text-slate-300 mb-6">
        Whatever your timing, we&apos;ll work with you to build a plan that
        makes sense. Faster timelines are possible — they just book up first.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {TIMELINES.map((option) => {
          const active = value === option.id;
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
              <span className="block text-xs text-slate-400">
                {option.caption}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepSummary({ form, priceRange }) {
  return (
    <>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">
        Here&apos;s your ballpark range.
      </h2>
      <p className="text-sm text-slate-300 mb-6">
        This isn&apos;t a gimmick number — it&apos;s a realistic bracket based
        on the project type, approximate square footage, and the kind of work
        Leon&apos;s typically does in homes like yours.
      </p>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-emerald-500 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-2">
            ESTIMATED RANGE
          </p>
          {priceRange ? (
            <>
              <p className="text-2xl font-semibold mb-1">
                ${priceRange.low.toLocaleString()} – $
                {priceRange.high.toLocaleString()}
              </p>
              <p className="text-xs text-slate-300">
                Final price depends on details like subfloor, repairs, stairs,
                finish system, and design choices.{" "}
                <span className="text-emerald-300">
                  No surprises — all of that is explained before you ever sign.
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-300">
              Add a square footage estimate in the previous step to see your
              range.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
              PROJECT TYPE
            </p>
            <p className="text-slate-100">
              {PROJECT_TYPES.find((p) => p.id === form.projectType)?.label ??
                "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
              APPROX. SQUARE FOOTAGE
            </p>
            <p className="text-slate-100">
              {form.sqft ? `${form.sqft} sq ft` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
              TIMELINE
            </p>
            <p className="text-slate-100">
              {TIMELINES.find((t) => t.id === form.timeline)?.label ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-2">
        From here, the next step is simple: we verify measurements, confirm the
        exact scope, and lock in a written proposal so you know exactly what
        you&apos;re saying yes to.
      </p>
      <p className="text-[11px] text-slate-500">
        No pressure, no weird sales games — just clear numbers and a handcrafted
        plan for your home.
      </p>
    </>
  );
}
