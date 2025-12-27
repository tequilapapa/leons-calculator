"use client";

import { useState } from "react";

type ProjectType =
  | "refinish"
  | "new-hardwood"
  | "luxury-vinyl"
  | "engineered"
  | "stairs-only";

type Condition = "light" | "average" | "heavy";

interface QuoteResult {
  min: number;
  max: number;
}

const currency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

function calculateQuote(
  projectType: ProjectType,
  sqft: number,
  condition: Condition,
  includeBaseboards: boolean,
  includeFurniture: boolean,
  includeStairs: boolean
): QuoteResult {
  if (!sqft || sqft <= 0) {
    return { min: 0, max: 0 };
  }

  let baseMin = 0;
  let baseMax = 0;

  switch (projectType) {
    case "refinish":
      baseMin = 5;
      baseMax = 9;
      break;
    case "new-hardwood":
      baseMin = 9;
      baseMax = 16;
      break;
    case "luxury-vinyl":
      baseMin = 5;
      baseMax = 9;
      break;
    case "engineered":
      baseMin = 7;
      baseMax = 12;
      break;
    case "stairs-only":
      baseMin = 80; // per step
      baseMax = 150;
      break;
  }

  let conditionBump = 1;
  if (condition === "average") conditionBump = 1.1;
  if (condition === "heavy") conditionBump = 1.25;

  let extrasMultiplier = 1;
  if (includeBaseboards) extrasMultiplier += 0.1;
  if (includeFurniture) extrasMultiplier += 0.1;
  if (includeStairs && projectType !== "stairs-only") extrasMultiplier += 0.15;

  if (projectType === "stairs-only") {
    const totalMin = baseMin * sqft * extrasMultiplier;
    const totalMax = baseMax * sqft * extrasMultiplier;
    return { min: totalMin, max: totalMax };
  }

  const totalMin = sqft * baseMin * conditionBump * extrasMultiplier;
  const totalMax = sqft * baseMax * conditionBump * extrasMultiplier;
  return { min: totalMin, max: totalMax };
}

type Step = 1 | 2 | 3;

interface ContactState {
  name: string;
  email: string;
  phone: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);

  // existing calculator state
  const [projectType, setProjectType] = useState<ProjectType>("refinish");
  const [sqft, setSqft] = useState<string>("");
  const [condition, setCondition] = useState<Condition>("average");
  const [includeBaseboards, setIncludeBaseboards] = useState(false);
  const [includeFurniture, setIncludeFurniture] = useState(false);
  const [includeStairs, setIncludeStairs] = useState(false);

  // contact + result
  const [contact, setContact] = useState<ContactState>({
    name: "",
    email: "",
    phone: "",
  });
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidSqft =
    sqft.trim() !== "" && !isNaN(parseFloat(sqft)) && parseFloat(sqft) > 0;

  function handleContactChange<K extends keyof ContactState>(
    key: K,
    value: ContactState[K]
  ) {
    setContact((prev) => ({ ...prev, [key]: value }));
  }

  async function handleViewEstimate() {
    setSubmitted(true);

    const numSqft = parseFloat(sqft);
    const parsedSqft = isNaN(numSqft) ? 0 : numSqft;

    const quote = calculateQuote(
      projectType,
      parsedSqft,
      condition,
      includeBaseboards,
      includeFurniture,
      includeStairs
    );
    setResult(quote);

    if (!parsedSqft || parsedSqft <= 0) {
      return;
    }

    // go to results “page”
    setStep(3);

    // scroll into view on mobile
    setTimeout(() => {
      const el = document.getElementById("results-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);

    // send to Wix / GHL via your existing API route
    try {
      setIsSubmitting(true);
      const payload = {
        type: "LEON_CALCULATOR_LEAD",
        projectType,
        sqft: parsedSqft,
        condition,
        includeBaseboards,
        includeFurniture,
        includeStairs,
        estimateMin: quote.min,
        estimateMax: quote.max,
        contact,
        source: "calculator-funnel",
        submittedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/wix-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to send to Wix");
      }
    } catch (err) {
      console.error("Error calling Wix webhook", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-xl shadow-black/40 backdrop-blur">
        {/* Header */}
        <div className="border-b border-neutral-800 px-6 py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-wide">
              Leon&apos;s Hardwood • Smart Floor Estimator
            </h1>
            <p className="text-xs text-neutral-400">
              Step-by-step ballpark, then a real visit when you&apos;re ready.
            </p>
          </div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Beta • Ballpark only
          </span>
        </div>

        <div className="grid gap-0 border-neutral-800 md:grid-cols-[3fr,2fr] md:divide-x md:divide-neutral-800">
          {/* LEFT SIDE: STEP CONTENT */}
          <div className="px-6 py-5 md:py-6 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Step {step} of 3
            </div>

            {step === 1 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Let&apos;s get a feel for your project
                </h2>
                <p className="text-xs text-neutral-400">
                  Answer a few quick questions so we can calculate a realistic
                  investment range.
                </p>

                {/* Project type */}
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Project type
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    {[
                      { id: "refinish", label: "Refinishing" },
                      { id: "new-hardwood", label: "New Hardwood" },
                      { id: "luxury-vinyl", label: "Luxury Vinyl" },
                      { id: "engineered", label: "Engineered / Prefinished" },
                      { id: "stairs-only", label: "Stairs Only" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setProjectType(option.id as ProjectType)
                        }
                        className={`rounded-lg border px-2.5 py-2 text-left transition ${
                          projectType === option.id
                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                            : "border-neutral-700 bg-neutral-900/60 text-neutral-300 hover:border-neutral-500"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* sqft + condition */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      {projectType === "stairs-only"
                        ? "Number of stair steps"
                        : "Approximate square footage"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      placeholder={
                        projectType === "stairs-only" ? "e.g. 14" : "e.g. 850"
                      }
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none ring-emerald-500/60 focus:border-emerald-400 focus:ring-1"
                    />
                    <p className="text-[11px] text-neutral-500">
                      Ballpark is fine — we’ll measure precisely on site.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      Existing floor condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) =>
                        setCondition(e.target.value as Condition)
                      }
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none ring-emerald-500/60 focus:border-emerald-400 focus:ring-1"
                    >
                      <option value="light">
                        Light wear (mostly cosmetic)
                      </option>
                      <option value="average">
                        Average (scratches, light fading)
                      </option>
                      <option value="heavy">
                        Heavy (sun damage, water marks, repairs)
                      </option>
                    </select>
                    <p className="text-[11px] text-neutral-500">
                      This just helps widen or tighten the range.
                    </p>
                  </div>
                </div>

                {/* Extras */}
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Extras you&apos;d like us to handle
                  </span>
                  <div className="grid gap-2 text-xs sm:grid-cols-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 hover:border-neutral-500">
                      <input
                        type="checkbox"
                        checked={includeBaseboards}
                        onChange={(e) =>
                          setIncludeBaseboards(e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900 text-emerald-500"
                      />
                      New baseboards / shoe
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 hover:border-neutral-500">
                      <input
                        type="checkbox"
                        checked={includeFurniture}
                        onChange={(e) =>
                          setIncludeFurniture(e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900 text-emerald-500"
                      />
                      Furniture move-out / back
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 hover:border-neutral-500">
                      <input
                        type="checkbox"
                        checked={includeStairs}
                        onChange={(e) =>
                          setIncludeStairs(e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900 text-emerald-500"
                      />
                      Include stairs in this scope
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!isValidSqft}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:shadow-none"
                >
                  Next: where should we send your range?
                </button>

                {!isValidSqft && submitted && (
                  <p className="text-[11px] text-red-400">
                    Please enter a valid square footage or stair count.
                  </p>
                )}
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Where should we send your estimate?
                </h2>
                <p className="text-xs text-neutral-400">
                  We&apos;ll text and email your ballpark range so you don&apos;t
                  lose it. No spam, no pressure.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1 text-neutral-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) =>
                        handleContactChange("name", e.target.value)
                      }
                      placeholder="First & last name"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 ring-emerald-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-neutral-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) =>
                        handleContactChange("email", e.target.value)
                      }
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 ring-emerald-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-neutral-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) =>
                        handleContactChange("phone", e.target.value)
                      }
                      placeholder="(###) ###-####"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 ring-emerald-500/60"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 rounded-full border border-neutral-700 text-xs sm:text-sm py-2"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleViewEstimate}
                    disabled={isSubmitting}
                    className="w-2/3 rounded-full bg-[#FFD44A] text-black text-xs sm:text-sm font-semibold py-2.5 disabled:opacity-60"
                  >
                    {isSubmitting
                      ? "Calculating..."
                      : "View my ballpark price range"}
                  </button>
                </div>

                <p className="pt-1 text-[10px] leading-snug text-neutral-500">
                  This tool gives a rough range based on typical Los Angeles
                  projects. Final pricing depends on on-site inspection, design
                  decisions and a written proposal.
                </p>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-4" id="results-section">
                <h2 className="text-xl font-semibold">
                  Your ballpark investment range
                </h2>
                <p className="text-xs text-neutral-400">
                  This is a rough range based on what you shared. A quick
                  in-person look lets us tighten these numbers and spot savings
                  or hidden repairs.
                </p>

                {result && result.min > 0 ? (
                  <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-400">
                      Estimated range
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-300">
                      {currency(result.min)} – {currency(result.max)}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Based on{" "}
                      <span className="font-medium text-neutral-200">
                        {projectType === "stairs-only"
                          ? `${sqft || "?"} stair steps`
                          : `${sqft || "?"} sq ft`}
                      </span>{" "}
                      and the options you selected.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">
                    Something went off with the numbers. Go back a step and try
                    again.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    (window.location.href =
                      // 👉 change this URL to GoHighLevel calendar when you’re ready
                      "https://www.leonshardwood.com/schedule")
                  }
                  className="w-full rounded-full bg-white text-black text-sm font-semibold py-3 mb-3"
                >
                  Book a flooring consultation
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full rounded-full border border-neutral-700 text-xs sm:text-sm py-2"
                >
                  Start over / tweak answers
                </button>
              </section>
            )}
          </div>

          {/* RIGHT SIDE: PITCH / VISUALIZER CTA */}
          <div className="border-t border-neutral-800 bg-neutral-950/60 px-6 py-5 md:border-l md:border-t-0 md:py-6">
            <h2 className="text-sm font-semibold text-neutral-100">
              What happens next?
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              We use this range as a starting point, then dial it in with a site
              visit, design choices and a written proposal.
            </p>

            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                Want to see it on your floors?
              </p>
              <p className="text-[11px] text-amber-100">
                Use our experimental{" "}
                <span className="font-semibold">camera floor visualizer</span>{" "}
                to layer a few profiles over your real room and feel the tone
                before we bring samples.
              </p>
              <a
                href="/camera"
                className="inline-flex w-full items-center justify-center rounded-lg border border-amber-400/60 bg-amber-300/90 px-3 py-2 text-[11px] font-semibold text-amber-950 transition hover:bg-amber-200"
              >
                Open camera visualizer (beta)
              </a>
              <p className="text-[10px] text-amber-200/80">
                Works best on a recent iPhone or Android in good lighting. Just
                a visual toy — we still confirm everything in person.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
