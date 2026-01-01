"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { put } from "@vercel/blob"

type WoodProfile = {
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

export default function AdminWoodProfilesPage() {
  const [profiles, setProfiles] = useState<WoodProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    wood_type: "",
    finish: "",
    color: "",
    price_per_sqft: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [textureFile, setTextureFile] = useState<File | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    try {
      const { data, error } = await supabase.from("wood_profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      console.error("Error loading profiles:", err)
      alert("Failed to load wood profiles")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)

    try {
      let imageUrl = null
      let textureUrl = null

      // Upload image to Vercel Blob
      if (imageFile) {
        const blob = await put(`wood-profiles/${Date.now()}-${imageFile.name}`, imageFile, { access: "public" })
        imageUrl = blob.url
      }

      // Upload texture to Vercel Blob
      if (textureFile) {
        const blob = await put(`wood-textures/${Date.now()}-${textureFile.name}`, textureFile, { access: "public" })
        textureUrl = blob.url
      }

      // Insert into Supabase
      const { error } = await supabase.from("wood_profiles").insert({
        name: formData.name,
        description: formData.description,
        wood_type: formData.wood_type,
        finish: formData.finish,
        color: formData.color,
        price_per_sqft: Number.parseFloat(formData.price_per_sqft),
        image_url: imageUrl,
        texture_url: textureUrl,
      })

      if (error) throw error

      // Reset form
      setFormData({
        name: "",
        description: "",
        wood_type: "",
        finish: "",
        color: "",
        price_per_sqft: "",
      })
      setImageFile(null)
      setTextureFile(null)
      setShowForm(false)

      // Reload profiles
      await loadProfiles()
      alert("Wood profile added successfully!")
    } catch (err) {
      console.error("Error adding profile:", err)
      alert("Failed to add wood profile")
    } finally {
      setUploading(false)
    }
  }

  async function deleteProfile(id: string) {
    if (!confirm("Are you sure you want to delete this profile?")) return

    try {
      const { error } = await supabase.from("wood_profiles").delete().eq("id", id)

      if (error) throw error

      await loadProfiles()
      alert("Profile deleted successfully")
    } catch (err) {
      console.error("Error deleting profile:", err)
      alert("Failed to delete profile")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center">
        <p>Loading wood profiles...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Wood Profile Management</h1>
            <p className="text-sm text-neutral-400">Upload and manage wood profiles for the AR visualizer</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-500 text-emerald-950 rounded-lg font-semibold hover:bg-emerald-400 transition"
          >
            {showForm ? "Cancel" : "+ Add New Profile"}
          </button>
        </div>

        {showForm && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Wood Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">Profile Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Versailles • Walnut"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">Wood Type *</label>
                  <input
                    type="text"
                    required
                    value={formData.wood_type}
                    onChange={(e) => setFormData({ ...formData, wood_type: e.target.value })}
                    placeholder="e.g., American Walnut"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">Finish *</label>
                  <input
                    type="text"
                    required
                    value={formData.finish}
                    onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                    placeholder="e.g., Matte, Satin, Gloss"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">Color *</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Rich brown, Natural"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">
                    Price per sq ft *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price_per_sqft}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_per_sqft: e.target.value,
                      })
                    }
                    placeholder="e.g., 35.00"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of this wood profile..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-emerald-500 file:text-emerald-950 hover:file:bg-emerald-400"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Display image for profile selection</p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">
                    Texture Image (for AR)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTextureFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-emerald-500 file:text-emerald-950 hover:file:bg-emerald-400"
                  />
                  <p className="text-xs text-neutral-500 mt-1">High-res texture for AR overlay</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-emerald-500 text-emerald-950 rounded-lg font-semibold hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Add Wood Profile"}
              </button>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {profile.image_url && (
                <img
                  src={profile.image_url || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{profile.name}</h3>
                <p className="text-xs text-neutral-400 mb-3">{profile.description}</p>
                <div className="space-y-1 text-xs mb-4">
                  <p>
                    <span className="text-neutral-500">Wood:</span> {profile.wood_type}
                  </p>
                  <p>
                    <span className="text-neutral-500">Finish:</span> {profile.finish}
                  </p>
                  <p>
                    <span className="text-neutral-500">Color:</span> {profile.color}
                  </p>
                  <p className="text-emerald-400 font-semibold">${profile.price_per_sqft}/sq ft</p>
                </div>
                <button
                  onClick={() => deleteProfile(profile.id)}
                  className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p>No wood profiles yet. Add your first one above!</p>
          </div>
        )}
      </div>
    </main>
  )
}
