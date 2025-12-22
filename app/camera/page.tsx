// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";

type Profile = {
  id: string;
  label: string;
  brand: string;
  pattern: string;
  species: string;
  tone: string;
  bestFor: string;
  estRange: string;
};

const PROFILES: Profile[] = [
  {
    id: "versailles-walnut",
    label: "Versailles • Walnut",
    brand: "Rode Bros (parquet-inspired)",
    pattern: "Versailles",
    species: "American / European Walnut",
    tone: "Rich, warm, luxury traditional",
    bestFor: "Formal living rooms, libraries, dining, Beverly Hills / Hancock Park vibes",
    estRange: "$35–$55 / sq ft installed (high design, high labor)",
  },
  {
    id: "chevron-oak-natural",
    label: "Chevron • Natural Oak",
    brand: "Rode-style Chevron",
    pattern: "Chevron",
    species: "European Oak",
    tone: "Light, airy, modern, gallery feel",
    bestFor: "Open concept living, modern builds, staging-friendly properties",
    estRange: "$22–$38 / sq ft installed",
  },
  {
    id: "herringbone-oak-smoked",
    label: "Herringbone • Smoked Oak",
    brand: "Rode-style Herringbone",
    pattern: "Herringbone",
    species: "Smoked / fumed Oak",
    tone: "Moody, architectural, dramatic",
    bestFor: "Entry halls, great rooms, moody condos, design-forward clients",
    estRange: "$24–$42 / sq ft installed",
  },
  {
    id: "marie-antoinette-walnut",
    label: "Marie Antoinette • Walnut Inlay",
    brand: "High-detail parquet",
    pattern: "Marie Antoinette",
    species: "Walnut with inlays",
    tone: "Ultra-lux, detailed, Old World palace energy",
    bestFor: "Signature rooms only, statements, legacy projects",
    estRange: "$45–$80+ / sq ft installed",
  },
];

export default function CameraVisualizerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile>(PROFILES[0]);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStreamActive(true);
      } catch (err: any) {
        console.error("Camera error", err);
        setError(
          "We couldn’t access your camera. Check browser permissions or try on your phone."
        );
        setStreamActive(false);
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col md:flex-row">
      {/* Left: camera */}
      <div className="flex-1 flex flex-col border-b border-neutral-800 md:border-b-0 md:border-r md:min-h-screen">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div>
            <h1 className="text-sm font-semibold tracking-wide">
              Leon&apos;s • Camera Floor Preview
            </h1>
            <p className="text-[11px] text-neutral-400">
              Point at your room and switch between floor profiles in real time.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-200">
            Beta Visualizer
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!streamActive && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-neutral-400">
                Initializing camera…
              </p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-4">
              <p className="text-xs text-red-300 text-center max-w-xs">
                {error}
              </p>
            </div>
          )}

          {/* Subtle overlay frame */}
          <div className="pointer-events-none absolute inset-6 border border-white/10 rounded-2xl" />
        </div>

        <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between gap-2">
          <a
            href="/"
            className="text-[11px] text-neutral-400 hover:text-neutral-200"
          >
            ← Back to calculator
          </a>
          <a
            href="https://www.leonshardwood.com/quote"
            className="text-[11px] font-semibold rounded-full border border-emerald-400 bg-emerald-500/10 px-3 py-1 hover:bg-emerald-400 hover:text-emerald-950 transition"
          >
            Lock in a real quote
          </a>
        </div>
      </div>

      {/* Right: profile picker */}
      <aside className="w-full md:w-80 bg-neutral-900/90 border-t border-neutral-800 md:border-t-0 md:border-l flex flex-col max-h-[60vh] md:max-h-none">
        <div className="px-4 py-3 border-b border-neutral-800">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">
            Floor profiles
          </p>
          <p className="text-xs text-neutral-300">
            Tap through Rode-inspired parquet and chevron options while you
            point the camera at your space.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs">
          {PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfile(profile)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                selectedProfile.id === profile.id
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-50"
                  : "border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-500"
              }`}
            >
              <div className="font-medium">{profile.label}</div>
              <div className="text-[10px] text-neutral-400">
                {profile.pattern} • {profile.species}
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-neutral-800 px-4 py-3 text-[11px] space-y-1">
          <p className="text-neutral-400">Selected profile</p>
          <p className="text-sm font-semibold text-neutral-50">
            {selectedProfile.label}
          </p>
          <p className="text-neutral-300">
            <span className="text-neutral-400">Pattern:</span>{" "}
            {selectedProfile.pattern}
          </p>
          <p className="text-neutral-300">
            <span className="text-neutral-400">Species:</span>{" "}
            {selectedProfile.species}
          </p>
          <p className="text-neutral-300">
            <span className="text-neutral-400">Tone:</span>{" "}
            {selectedProfile.tone}
          </p>
          <p className="text-neutral-300">
            <span className="text-neutral-400">Best for:</span>{" "}
            {selectedProfile.bestFor}
          </p>
          <p className="text-emerald-300 font-medium">
            Est. fully installed: {selectedProfile.estRange}
          </p>
          <p className="text-[10px] text-neutral-500 pt-1">
            For exact pricing, we still do a site visit and a written proposal.
          </p>
        </div>
      </aside>
    </main>
  );
}
