"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"

type Profile = {
  id: string
  name: string
  description: string
  wood_type: string
  finish: string
  color: string
  price_per_sqft: number
  image_url: string | null
  texture_url: string | null
}

const BOOKING_URL = "https://calendar.leonshardwood.com/widget/booking/4UHrntvfTwqklVXXfarP"

export default function CameraVisualizerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [streamActive, setStreamActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Contact form state
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  // Load profiles from Supabase
  useEffect(() => {
    async function loadProfiles() {
      try {
        const { data, error } = await supabase
          .from("wood_profiles")
          .select("*")
          .order("created_at", { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          setProfiles(data)
          setSelectedProfile(data[0])
        }
      } catch (err) {
        console.error("Error loading profiles:", err)
        setError("Failed to load wood profiles")
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!name && !contact) {
      alert("Before you go, what is your name? We'd like to know your project idea 🤭")
      return
    }

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: contact.includes("@") ? contact : null,
          phone: !contact.includes("@") ? contact : null,
          notes,
          projectType: "ar-camera-visualizer",
          selected_wood_id: selectedProfile?.id ?? null,
          source: "ar-camera",
        }),
      })

      setSubmitted(true)

      if (typeof window !== "undefined") {
        window.open(BOOKING_URL, "_blank")
      }
    } catch (err) {
      console.error("Error sending lead:", err)
    }
  }

  // Camera setup
  useEffect(() => {
    let currentStream: MediaStream | null = null

    async function startCamera() {
      try {
        setError(null)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        currentStream = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStreamActive(true)
      } catch (err: any) {
        console.error("Camera error", err)
        setError("We couldn't access your camera. Check browser permissions or try on your phone.")
        setStreamActive(false)
      }
    }

    startCamera()

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading wood profiles...</p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center flex-col gap-4 px-4">
        <p className="text-neutral-400">No wood profiles available yet.</p>
        <a
          href="/admin/wood-profiles"
          className="px-4 py-2 bg-emerald-500 text-emerald-950 rounded-lg font-semibold hover:bg-emerald-400 transition"
        >
          Add Wood Profiles
        </a>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col md:flex-row">
      {/* Left: camera */}
      <div className="flex-1 flex flex-col border-b border-neutral-800 md:border-b-0 md:border-r md:min-h-screen">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Leon&apos;s • Camera Floor Preview</h1>
            <p className="text-[11px] text-neutral-400">
              Point at your room and switch between floor profiles in real time.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-200">
            Beta Visualizer
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {!streamActive && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-neutral-400">Initializing camera…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-4">
              <p className="text-xs text-red-300 text-center max-w-xs">{error}</p>
            </div>
          )}

          {/* Subtle overlay frame */}
          <div className="pointer-events-none absolute inset-6 border border-white/10 rounded-2xl" />

          {/* AR texture overlay placeholder */}
          {selectedProfile?.texture_url && (
            <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay">
              <img
                src={selectedProfile.texture_url || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between gap-2">
          <a href="/" className="text-[11px] text-neutral-400 hover:text-neutral-200">
            ← Back to calculator
          </a>
        </div>
      </div>

      {/* Right: profile picker */}
      <aside className="w-full md:w-80 bg-neutral-900/90 border-t border-neutral-800 md:border-t-0 md:border-l flex flex-col max-h-[60vh] md:max-h-none">
        <div className="px-4 py-3 border-b border-neutral-800">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Floor profiles</p>
          <p className="text-xs text-neutral-300">Tap through wood options while you point the camera at your space.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfile(profile)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                selectedProfile?.id === profile.id
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-50"
                  : "border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-500"
              }`}
            >
              <div className="font-medium">{profile.name}</div>
              <div className="text-[10px] text-neutral-400">
                {profile.wood_type} • {profile.finish}
              </div>
            </button>
          ))}
        </div>

        {selectedProfile && (
          <div className="border-t border-neutral-800 px-4 py-3 text-[11px] space-y-1">
            <p className="text-neutral-400">Selected profile</p>
            <p className="text-sm font-semibold text-neutral-50">{selectedProfile.name}</p>
            <p className="text-neutral-300">
              <span className="text-neutral-400">Wood Type:</span> {selectedProfile.wood_type}
            </p>
            <p className="text-neutral-300">
              <span className="text-neutral-400">Finish:</span> {selectedProfile.finish}
            </p>
            <p className="text-neutral-300">
              <span className="text-neutral-400">Color:</span> {selectedProfile.color}
            </p>
            <p className="text-neutral-300 mb-2">{selectedProfile.description}</p>
            <p className="text-emerald-300 font-medium">Est. ${selectedProfile.price_per_sqft}/sq ft installed</p>
            <p className="text-[10px] text-neutral-500 pt-1">
              For exact pricing, schedule a site visit. A formal written proposal will then be prepared for you to
              review.
            </p>
          </div>
        )}

        {/* Contact form */}
        <div className="border-t border-neutral-800 px-4 py-3">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <p className="text-[11px] text-neutral-400 mb-2">Love this profile? Let&apos;s connect:</p>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100"
              />
              <input
                type="text"
                placeholder="Email or phone"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100"
              />
              <textarea
                placeholder="Any notes or questions?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100"
              />
              <button
                type="submit"
                className="w-full py-2 bg-emerald-500 text-emerald-950 rounded-lg text-xs font-semibold hover:bg-emerald-400 transition"
              >
                Schedule Site Visit
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-emerald-400 mb-2">Thanks! We&apos;ll be in touch soon.</p>
            </div>
          )}
        </div>
      </aside>
    </main>
  )
}
