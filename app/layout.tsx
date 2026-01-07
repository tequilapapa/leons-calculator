// app/layout.tsx
import './globals.css'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { sans, serif } from './fonts'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  title: "Leon’s Hardwood",
  description: "Visualizer & Instant Estimate",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`h-full ${sans.variable} ${serif.variable}`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {/* soft pastel glow on light */}
        <div className="pointer-events-none fixed inset-0 opacity-70 [background:radial-gradient(1100px_550px_at_80%_-20%,rgba(255,149,0,.10),transparent_60%),radial-gradient(800px_400px_at_10%_-20%,rgba(56,189,248,.08),transparent_60%)]" />
        <div className="pointer-events-none fixed inset-0 [mask-image:radial-gradient(1200px_700px_at_50%_0%,black,transparent)]" />

        <Header />

        <main className="mx-auto w-full max-w-7xl px-4 py-6">
          {children}
        </main>

        <Footer />

        <SpeedInsights />
      </body>
    </html>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3" aria-label="Leon’s Hardwood home">
          <Image
            src="https://static.wixstatic.com/media/6fb62d_10d44cb7ec61469bbd11b8d926c66db0~mv2.png"
            alt="Leon’s Hardwood"
            width={180}
            height={52}
            priority
            className="h-12 w-auto"
          />
          <span className="hidden text-xs text-gray-500 sm:inline">LIC#1090071</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/calculator"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-50"
          >
            Calculator
          </Link>
          <Link
            href="/camera"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-50"
          >
            See Floors
          </Link>
          <Link
            href="https://www.leonshardwood.com/quote"
            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground transition hover:opacity-90"
          >
            Book
          </Link>
        </nav>

        {/* Mobile nav (no JS) */}
        <details className="group relative md:hidden">
          <summary
            className="list-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-50"
            aria-label="Open menu"
          >
            Menu
          </summary>
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur">
            <Link href="/calculator" className="block rounded px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-50">
              Calculator
            </Link>
            <Link href="/camera" className="block rounded px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-50">
              See Floors
            </Link>
            <a
              href="https://www.leonshardwood.com/quote"
              className="mt-1 block rounded bg-primary px-3 py-2 text-center text-sm text-primary-foreground transition hover:opacity-90"
            >
              Book
            </a>
          </div>
        </details>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200/80 bg-white/70 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3">
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()} Leon’s Hardwood<br />
          Visualize. Estimate. Book.
        </div>
        <div className="text-sm text-gray-600">
          LIC#1090071 • Los Angeles, CA
        </div>
        <div className="flex items-center justify-start gap-2 sm:justify-end">
          <a
            href="tel:+12133048596"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-50"
            aria-label="Call Leon’s Hardwood (213) 304-8596"
          >
            (213) 304-8596
          </a>
          <a
            href="mailto:noe@leonshardwood.com"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition hover:bg-gray-50"
            aria-label="Email Leon’s Hardwood"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  )
}