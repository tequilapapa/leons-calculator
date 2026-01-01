"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Ruler, DollarSign, ChevronRight, X, Check } from "lucide-react"

interface WoodProfile {
  id: string
  name: string
  description: string
  image_url: string
  price_per_sqft: number
  color: string
  wood_type: string
  finish: string
}

interface LeadFormData {
  name: string
  email: string
  phone: string
  address: string
  notes: string
}

export default function ARVisualizerPage() {
  const [woodProfiles, setWoodProfiles] = useState<WoodProfile[]>([])
  const [selectedWood, setSelectedWood] = useState<WoodProfile | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [measurements, setMeasurements] = useState({
    length: 0,
    width: 0,
    sqft: 0,
  })
  const [estimatedPrice, setEstimatedPrice] = useState(0)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadWoodProfiles()
  }, [])

  useEffect(() => {
    if (measurements.length && measurements.width) {
      const sqft = measurements.length * measurements.width
      setMeasurements((prev) => ({ ...prev, sqft }))

      if (selectedWood) {
        setEstimatedPrice(sqft * selectedWood.price_per_sqft)
      }
    }
  }, [measurements.length, measurements.width, selectedWood])

  const loadWoodProfiles = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("wood_profiles").select("*").order("created_at", { ascending: false })

    if (data && !error) {
      setWoodProfiles(data)
    }
  }

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Camera not supported in this browser.")
        return
      }
  
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      }
  
      let stream: MediaStream
  
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        console.warn("Environment camera failed – falling back:", err)
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
  
      if (!videoRef.current) return
  
      const video = videoRef.current
  
      video.srcObject = stream
  
      // Important for mobile / autoplay
      video.setAttribute("playsinline", "true")
      video.setAttribute("autoplay", "true")
      video.muted = true
  
      await video.play()
  
      console.log("Camera started successfully")
      setCameraActive(true)
    } catch (error: any) {
      console.error("Camera failed:", error?.name, error?.message || error)
      alert(`Camera failed: ${error?.name || "Unknown error"}`)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadFormData.name,
          email: leadFormData.email,
          phone: leadFormData.phone,
          address: leadFormData.address,
          projectType: "flooring",
          selectedWoodId: selectedWood?.id,
          estimatedSqft: measurements.sqft,
          estimatedPrice,
          roomMeasurements: measurements,
          arSessionData: {
            woodSelected: selectedWood?.name,
            timestamp: new Date().toISOString(),
          },
          notes: leadFormData.notes,
        }),
      })

      if (response.ok) {
        alert("Thank you! We'''ll contact you soon with a detailed quote.")
        setShowLeadForm(false)
        setLeadFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
        })
      } else {
        alert("Failed to submit. Please try again.")
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AR Wood Visualizer</h1>
              <p className="text-sm text-slate-400">Visualize and measure your space in real-time</p>
            </div>
            <Button
              onClick={() => (window.location.href = "/calculator")}
              variant="outline"
              className="border-orange-600/50 text-orange-500 hover:bg-orange-600/10"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Price Calculator
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4">
        {/* Camera View */}
        {!cameraActive ? (
          <Card className="mb-6 overflow-hidden border-slate-800 bg-slate-900">
            <div className="relative aspect-video w-full bg-slate-950">
              <div className="flex h-full items-center justify-center">
                <Button onClick={startCamera} size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <Camera className="h-5 w-5" />
                  Start AR Camera
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="mb-6 overflow-hidden border-slate-800 bg-slate-900">
            <div className="relative aspect-video w-full">
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

              {/* AR Overlay */}
              {selectedWood && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="rounded-lg bg-black/70 p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedWood.image_url || "/placeholder.svg"}
                        alt={selectedWood.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="flex-1 text-white">
                        <p className="font-semibold">{selectedWood.name}</p>
                        <p className="text-xs text-slate-300">${selectedWood.price_per_sqft}/sq ft</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={stopCamera} variant="destructive" size="icon" className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Wood Selection */}
          <div className="lg:col-span-2">
            <Card className="border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Select Wood Profile</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {woodProfiles.map((wood) => (
                  <button
                    key={wood.id}
                    onClick={() => setSelectedWood(wood)}
                    className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedWood?.id === wood.id
                        ? "border-orange-600 ring-2 ring-orange-600/50"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={wood.image_url || "/placeholder.svg"}
                        alt={wood.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="bg-slate-800/90 p-3 backdrop-blur-sm">
                      <p className="font-semibold text-white">{wood.name}</p>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-slate-400">{wood.wood_type}</span>
                        <span className="font-semibold text-orange-500">${wood.price_per_sqft}/sq ft</span>
                      </div>
                    </div>
                    {selectedWood?.id === wood.id && (
                      <div className="absolute right-2 top-2 rounded-full bg-orange-600 p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Measurements & Price */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-orange-600" />
                <h2 className="text-xl font-bold text-white">Measurements</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="length" className="text-slate-300">
                    Length (ft)
                  </Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={measurements.length || ""}
                    onChange={(e) =>
                      setMeasurements({
                        ...measurements,
                        length: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-slate-300">
                    Width (ft)
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={measurements.width || ""}
                    onChange={(e) =>
                      setMeasurements({
                        ...measurements,
                        width: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                {measurements.sqft > 0 && (
                  <div className="rounded-lg bg-slate-800 p-3">
                    <p className="text-sm text-slate-400">Total Area</p>
                    <p className="text-2xl font-bold text-white">{measurements.sqft.toFixed(1)} sq ft</p>
                  </div>
                )}
              </div>
            </Card>

            {selectedWood && measurements.sqft > 0 && (
              <Card className="border-orange-600/50 bg-slate-900 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <h2 className="text-xl font-bold text-white">Price Estimate</h2>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span className="font-semibold text-white">
                      ${(measurements.sqft * selectedWood.price_per_sqft).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-white">Estimated Total:</span>
                      <span className="font-bold text-orange-600">${estimatedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setShowLeadForm(true)} className="mt-4 w-full bg-orange-600 hover:bg-orange-700">
                  Get Detailed Quote
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h2 className="text-xl font-bold text-white">Get Your Detailed Quote</h2>
              <Button
                onClick={() => setShowLeadForm(false)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmitLead} className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lead-name" className="text-slate-300">
                    Full Name *
                  </Label>
                  <Input
                    id="lead-name"
                    value={leadFormData.name}
                    onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                    required
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-email" className="text-slate-300">
                    Email *
                  </Label>
                  <Input
                    id="lead-email"
                    type="email"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                    required
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-phone" className="text-slate-300">
                    Phone
                  </Label>
                  <Input
                    id="lead-phone"
                    type="tel"
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-address" className="text-slate-300">
                    Project Address
                  </Label>
                  <Input
                    id="lead-address"
                    value={leadFormData.address}
                    onChange={(e) =>
                      setLeadFormData({
                        ...leadFormData,
                        address: e.target.value,
                      })
                    }
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-notes" className="text-slate-300">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="lead-notes"
                    value={leadFormData.notes}
                    onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 hover:bg-orange-700">
                  {isSubmitting ? "Submitting..." : "Submit Quote Request"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
