'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Camera, Calculator, Calendar, ArrowRight, ShieldCheck, Star, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'

export default function LandingLikePage() {
  const router = useRouter()

  const goCalculator = () => router.push('/calculator')
  const goCamera = () => router.push('/camera?sku=LHF-A-047') // set a default SKU; adjust as needed
  const goBook = () => {
    window.open('https://www.leonshardwood.com/quote', '_blank', 'noopener,noreferrer')
  }

  // Little flourish for hero stats
  const stats = useMemo(
    () => [
      { label: 'Projects Completed', value: '1,500+' },
      { label: 'Avg. Rating', value: '4.9/5' },
      { label: 'Response Time', value: '< 5 min' }
    ],
    []
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* HERO */}
      <section className="px-4 pt-16 pb-10">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Licensed • Insured • Local pros
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            See your new floors in <span className="text-emerald-400">AR</span>.  
            Get an <span className="text-orange-400">instant estimate</span>.  
            Book in minutes.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Pick a path below — we’ll guide you. No pressure, just clear numbers and a realistic preview in your space.
          </p>

          {/* Primary CTAs */}
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
            <button
              onClick={goCalculator}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:border-orange-500 hover:bg-slate-900"
            >
              <div className="mb-3 inline-flex rounded-xl bg-orange-500/15 p-2">
                <Calculator className="h-5 w-5 text-orange-400" />
              </div>
              <div className="font-semibold">Calculator</div>
              <div className="mt-1 text-sm text-slate-300">Ballpark price in under 60 seconds</div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm text-orange-300">
                Start now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </button>

            <button
              onClick={goCamera}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:border-emerald-500 hover:bg-slate-900"
            >
              <div className="mb-3 inline-flex rounded-xl bg-emerald-500/15 p-2">
                <Camera className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="font-semibold">AR Camera</div>
              <div className="mt-1 text-sm text-slate-300">Place floors in your room (iOS/Android)</div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm text-emerald-300">
                Try AR <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </button>

            <button
              onClick={goBook}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:border-sky-500 hover:bg-slate-900"
            >
              <div className="mb-3 inline-flex rounded-xl bg-sky-500/15 p-2">
                <Calendar className="h-5 w-5 text-sky-400" />
              </div>
              <div className="font-semibold">Book Appointment</div>
              <div className="mt-1 text-sm text-slate-300">Free in-home consultation</div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm text-sky-300">
                Pick a time <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>

          {/* Trust / social proof */}
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-3 gap-4 text-center text-sm text-slate-300">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          <Benefit
            icon={<Star className="h-5 w-5" />}
            title="Transparent Pricing"
            desc="No games — see the numbers before we step inside."
          />
          <Benefit
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Same-Day Starts"
            desc="Tight timeline? We’ll make it happen with a proven crew."
          />
          <Benefit
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Licensed & Insured"
            desc="Quality work backed by real accountability."
          />
        </div>
      </section>

      {/* STICKY BOTTOM BAR (keeps users anchored) */}
      <div className="fixed inset-x-0 bottom-3 z-40 mx-auto w-[min(960px,95%)] rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl backdrop-blur">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button onClick={goCalculator} className="w-full bg-orange-600 hover:bg-orange-700">
            <Calculator className="mr-2 h-4 w-4" /> Get Instant Estimate
          </Button>
          <Button onClick={goCamera} variant="outline" className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
            <Camera className="mr-2 h-4 w-4" /> Try AR in Your Room
          </Button>
          <Button onClick={goBook} variant="outline" className="w-full border-sky-500/40 text-sky-400 hover:bg-sky-500/10">
            <Calendar className="mr-2 h-4 w-4" /> Book Appointment
          </Button>
        </div>
      </div>

      <footer className="px-4 pb-28 pt-6 text-center text-xs text-slate-400">
        No pressure. No surprise fees. Just clean installs and happy floors.
      </footer>
    </main>
  )
}

function Benefit({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-2 inline-flex rounded-lg bg-slate-800/70 p-2 text-slate-300">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-slate-300">{desc}</div>
    </div>
  )
}