// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
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

  // base price per sq ft ranges (LA luxury-friendly, tweak to taste)
  let baseMin = 0;
  let baseMax = 0;

  switch (projectType) {
    case "refinish":
      baseMin = 5; // light refinish
      baseMax = 9; // heavy repairs / color work
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
      baseMin = 80; // per stair step rough
      baseMax = 150;
      break;
  }

  // condition multipliers
  let conditionBump = 1;
  if (condition === "average") conditionBump = 1.1;
  if (condition === "heavy") conditionBump = 1.25;

  // extra toggles as flat percentages
  let extrasMultiplier = 1;
  if (includeBaseboards) extrasMultiplier += 0.1;
  if (includeFurniture) extrasMultiplier += 0.1;
  if (includeStairs && projectType !== "stairs-only") extrasMultiplier += 0.15;

  if (projectType === "stairs-only") {
    const totalMin = baseMin * sqft * extrasMultiplier; // here sqft = number of steps
    const totalMax = baseMax * sqft * extrasMultiplier;
    return { min: totalMin, max: totalMax };
  }

  const totalMin = sqft * baseMin * conditionBump * extrasMultiplier;
  const totalMax = sqft * baseMax * conditionBump * extrasMultiplier;
  return { min: totalMin, max: totalMax };
}

export default function Home() {
  const [projectType, setProjectType] = useState<ProjectType>("refinish");
  const [sqft, setSqft] = useState<string>("");
  const [condition, setCondition] = useState<Condition>("average");
  const [includeBaseboards, setIncludeBaseboards] = useState(false);
  const [includeFurniture, setIncludeFurniture] = useState(false);
  const [includeStairs, setIncludeStairs] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numSqft = parseFloat(sqft);
    const quote = calculateQuote(
      projectType,
      isNaN(numSqft) ? 0 : numSqft,
      condition,
      includeBaseboards,
      includeFurniture,
      includeStairs
    );
    setResult(quote);
    setSubmitted(true);
  };

  const isValidSqft =
    sqft.trim() !== "" && !isNaN(parseFloat(sqft)) && parseFloat(sqft) > 0;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-xl shadow-black/40 backdrop-blur">
        <div className="border-b border-neutral-800 px-6 py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-wide">
              Leon&apos;s Hardwood • Smart Floor Estimator
            </h1>
            <p className="text-xs text-neutral-400">
              Transparent price ranges before you ever book a visit.
            </p>
          </div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Beta • For ballpark budgeting only
          </span>
        </div>

        <div className="grid gap-0 border-neutral-800 md:grid-cols-[3fr,2fr] md:divide-x md:divide-neutral-800">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 px-6 py-5 md:py-6"
          >
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
                  placeholder={projectType === "stairs-only" ? "e.g. 14" : "e.g. 850"}
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
                  <option value="light">Light wear (mostly cosmetic)</option>
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
              type="submit"
              disabled={!isValidSqft}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:shadow-none"
            >
              See my ballpark range
            </button>

            {!isValidSqft && submitted && (
              <p className="text-[11px] text-red-400">
                Please enter a valid square footage or stair count.
              </p>
            )}

            <p className="pt-1 text-[10px] leading-snug text-neutral-500">
              This tool gives a **rough range** based on typical Los Angeles
              projects. Final pricing depends on on-site inspection, design
              decisions and written proposal.
            </p>
          </form>

          {/* Results */}
          <div className="border-t border-neutral-800 bg-neutral-950/60 px-6 py-5 md:border-l md:border-t-0 md:py-6">
            <h2 className="text-sm font-semibold text-neutral-100">
              Your ballpark investment
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              We update this live as you tweak the sliders and options.
            </p>

            <div className="mt-4 rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-4">
              {result && result.min > 0 ? (
                <>
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
                </>
              ) : (
                <p className="text-sm text-neutral-400">
                  Start by telling us your square footage (or stair count),
                  and we&apos;ll show you a realistic range most of our clients
                  land in.
                </p>
              )}

              <div className="mt-4 space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                  Next step: lock in a real quote
                </p>
                <p className="text-[11px] text-neutral-400">
                  If this range feels right, send it to our team and we&apos;ll
                  follow up with a{" "}
                  <span className="font-semibold text-neutral-100">
                    detailed, written proposal
                  </span>{" "}
                  after a site visit.
                </p>
                <a
                  href="https://www.leonshardwood.com/quote" // or your GHL booking link
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-neutral-700 bg-neutral-50/95 px-3 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-white"
                >
                  Share my estimate &amp; request a visit
                </a>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                Want to actually see it on your floors?
              </p>
              <p className="text-[11px] text-amber-100">
                Use our experimental <span className="font-semibold">camera floor visualizer</span> to layer a few of our favorite
                profiles over your real room and get a feel for tone, pattern and vibe before we ever bring samples out.
              </p>
              <a
                href="/camera"
                className="inline-flex w-full items-center justify-center rounded-lg border border-amber-400/60 bg-amber-300/90 px-3 py-2 text-[11px] font-semibold text-amber-950 transition hover:bg-amber-200"
              >
                Open camera visualizer (beta)
              </a>
              <p className="text-[10px] text-amber-200/80">
                Works best on a recent iPhone or Android in good lighting. This is just a visual toy – we still confirm everything in
                person with real samples.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}