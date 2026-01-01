"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"

export default function AdminUploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerSqft: "",
    color: "",
    woodType: "",
    finish: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) return

    setIsUploading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("image", imageFile)
      formDataToSend.append("name", formData.name)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("pricePerSqft", formData.pricePerSqft)
      formDataToSend.append("color", formData.color)
      formDataToSend.append("woodType", formData.woodType)
      formDataToSend.append("finish", formData.finish)

      const response = await fetch("/api/upload-wood-profile", {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        alert("Wood profile uploaded successfully!")
        // Reset form
        setFormData({
          name: "",
          description: "",
          pricePerSqft: "",
          color: "",
          woodType: "",
          finish: "",
        })
        setImageFile(null)
        setPreviewUrl("")
      } else {
        alert("Upload failed. Please try again.")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Upload Wood Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Wood Profile Image</Label>
                <div className="flex flex-col gap-4">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} required />
                  {previewUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Wood Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Oak Hardwood"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerSqft">Price per Sq Ft ($)</Label>
                  <Input
                    id="pricePerSqft"
                    type="number"
                    step="0.01"
                    value={formData.pricePerSqft}
                    onChange={(e) => setFormData({ ...formData, pricePerSqft: e.target.value })}
                    placeholder="8.99"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beautiful natural oak with rich grain patterns..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="woodType">Wood Type</Label>
                  <Select
                    value={formData.woodType}
                    onValueChange={(value) => setFormData({ ...formData, woodType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hardwood">Hardwood</SelectItem>
                      <SelectItem value="laminate">Laminate</SelectItem>
                      <SelectItem value="vinyl">Vinyl</SelectItem>
                      <SelectItem value="engineered">Engineered</SelectItem>
                      <SelectItem value="bamboo">Bamboo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Natural Oak"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finish">Finish</Label>
                  <Select
                    value={formData.finish}
                    onValueChange={(value) => setFormData({ ...formData, finish: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select finish" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matte">Matte</SelectItem>
                      <SelectItem value="satin">Satin</SelectItem>
                      <SelectItem value="gloss">Gloss</SelectItem>
                      <SelectItem value="textured">Textured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isUploading || !imageFile}>
                {isUploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Wood Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
