'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, ArrowLeft, Camera, Check, Calendar, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ProjectType = 'new-hardwood' | 'refinishing' | 'luxury-vinyl' | 'kitchen-remodel' | ''
type QualityTier = 'economic' | 'standard' | 'premium' | ''
type Urgency = 'asap' | '1-2-weeks' | '1-month' | 'browsing' | ''

type FormData = {
  // Step 1: Project Type & Quality
  projectType: ProjectType
  qualityTier: QualityTier
  
  // Step 2: Project-Specific (conditional)
  // Refinishing specific
  finishType: string
  floorCondition: string
  moveFurniture: string
  
  // New Install specific
  woodSpecies: string
  finishStyle: string
  demoNeeded: string
  
  // Kitchen Remodel specific
  cabinetsTop: string
  cabinetsBottom: string
  sinkPlumbing: string
  lightingFixtures: string
  countertops: string
  backsplash: string
  
  // Step 3: Square Footage & Urgency
  totalSqft: string
  length: string
  width: string
  urgency: Urgency
  
  // Step 4: Contact Info
  firstName: string
  lastName: string
  email: string
  phone: string
}

const PROJECT_TYPES = [
  {
    id: 'new-hardwood' as ProjectType,
    name: 'New Hardwood Install',
    description: 'Professional installation of brand new hardwood flooring'
  },
  {
    id: 'refinishing' as ProjectType,
    name: 'Refinishing Hardwood',
    description: 'Restore and refinish your existing hardwood floors'
  },
  {
    id: 'luxury-vinyl' as ProjectType,
    name: 'Luxury Vinyl',
    description: 'Durable, waterproof luxury vinyl plank installation'
  },
  {
    id: 'kitchen-remodel' as ProjectType,
    name: 'Kitchen Remodels',
    description: 'Complete kitchen renovation with flooring and more'
  }
]

const QUALITY_TIERS = [
  { id: 'economic' as QualityTier, name: 'Economic', priceMultiplier: 0.8 },
  { id: 'standard' as QualityTier, name: 'Standard', priceMultiplier: 1.0 },
  { id: 'premium' as QualityTier, name: 'Premium', priceMultiplier: 1.3 }
]

export default function CalculatorPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    projectType: '',
    qualityTier: '',
    finishType: '',
    floorCondition: '',
    moveFurniture: '',
    woodSpecies: '',
    finishStyle: '',
    demoNeeded: '',
    cabinetsTop: '',
    cabinetsBottom: '',
    sinkPlumbing: '',
    lightingFixtures: '',
    countertops: '',
    backsplash: '',
    totalSqft: '',
    length: '',
    width: '',
    urgency: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (formData.length && formData.width) {
      const calculated = (parseFloat(formData.length) * parseFloat(formData.width)).toFixed(0)
      setFormData(prev => ({ ...prev, totalSqft: calculated }))
    }
  }, [formData.length, formData.width])

  const calculatePriceRange = () => {
    if (!formData.totalSqft || !formData.projectType || !formData.qualityTier) {
      return null
    }

    const sqft = parseFloat(formData.totalSqft)
    let basePricePerSqft = 8.5

    // Adjust base price by project type
    switch (formData.projectType) {
      case 'new-hardwood':
        basePricePerSqft = 12.0
        break
      case 'refinishing':
        basePricePerSqft = 5.5
        break
      case 'luxury-vinyl':
        basePricePerSqft = 8.0
        break
      case 'kitchen-remodel':
        basePricePerSqft = 15.0
        break
    }

    // Apply quality tier multiplier
    const tierMultiplier = QUALITY_TIERS.find(t => t.id === formData.qualityTier)?.priceMultiplier || 1.0
    const adjustedPrice = basePricePerSqft * tierMultiplier

    const minPrice = (sqft * adjustedPrice * 0.9).toFixed(0)
    const maxPrice = (sqft * adjustedPrice * 1.1).toFixed(0)

    return { min: minPrice, max: maxPrice, avg: (sqft * adjustedPrice).toFixed(0) }
  }

  const priceRange = calculatePriceRange()

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.projectType && formData.qualityTier
      case 2:
        if (formData.projectType === 'refinishing') {
          return formData.finishType && formData.floorCondition
        } else if (formData.projectType === 'new-hardwood' || formData.projectType === 'luxury-vinyl') {
          return formData.woodSpecies && formData.finishStyle && formData.demoNeeded
        } else if (formData.projectType === 'kitchen-remodel') {
          return formData.cabinetsTop && formData.countertops
        }
        return true
      case 3:
        return formData.totalSqft && formData.urgency
      case 4:
        return formData.firstName && formData.lastName && formData.email && formData.phone
      default:
        return true
    }
  }

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      
      // Track progression
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'calculator_step_complete',
          step: currentStep,
          data: formData
        })
      })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priceRange,
          source: 'calculator'
        })
      })

      if (response.ok) {
        setCurrentStep(5) // Success screen
        
        await fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'lead_submitted',
            data: { email: formData.email, projectType: formData.projectType }
          })
        })
      }
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{progress.toFixed(0)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Project Type & Quality'}
              {currentStep === 2 && 'Project Details'}
              {currentStep === 3 && 'Size & Timeline'}
              {currentStep === 4 && 'Your Information'}
              {currentStep === 5 && 'All Set!'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'What type of project are you planning?'}
              {currentStep === 2 && 'Tell us more about your specific needs'}
              {currentStep === 3 && 'Help us understand your space and timeline'}
              {currentStep === 4 && 'Get your personalized quote'}
              {currentStep === 5 && 'We\'ll be in touch soon'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Project Type & Quality */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Project Type</Label>
                  <div className="grid gap-3">
                    {PROJECT_TYPES.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => updateField('projectType', project.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary ${
                          formData.projectType === project.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="font-semibold">{project.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">{project.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.projectType && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Quality Level</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {QUALITY_TIERS.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => updateField('qualityTier', tier.id)}
                          className={`p-4 rounded-lg border-2 text-center transition-all hover:border-primary ${
                            formData.qualityTier === tier.id ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="font-semibold">{tier.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Project-Specific Questions (Conditional) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Refinishing Questions */}
                {formData.projectType === 'refinishing' && (
                  <>
                    <div>
                      <Label htmlFor="finishType">Finish Type</Label>
                      <select
                        id="finishType"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.finishType}
                        onChange={(e) => updateField('finishType', e.target.value)}
                      >
                        <option value="">Select finish</option>
                        <option value="natural">Natural Finish</option>
                        <option value="stained-light">Stained - Light</option>
                        <option value="stained-dark">Stained - Dark</option>
                        <option value="stained-darker">Stained - Darker</option>
                        <option value="whitewashed">Whitewashed</option>
                        <option value="custom-match">Custom Match Stain</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="floorCondition">Floor Condition</Label>
                      <select
                        id="floorCondition"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.floorCondition}
                        onChange={(e) => updateField('floorCondition', e.target.value)}
                      >
                        <option value="">Select condition</option>
                        <option value="light-scratches">Light Scratches</option>
                        <option value="moderate-wear">Moderate Wear</option>
                        <option value="heavy-damage">Heavy Damage/Repairs Needed</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="moveFurniture">Move Furniture?</Label>
                      <select
                        id="moveFurniture"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.moveFurniture}
                        onChange={(e) => updateField('moveFurniture', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="yes-need-help">Yes, Need Help Moving</option>
                        <option value="no-already-empty">No, Room is Empty</option>
                        <option value="minimal-furniture">Minimal Furniture</option>
                      </select>
                    </div>
                  </>
                )}

                {/* New Install Questions (Hardwood or Vinyl) */}
                {(formData.projectType === 'new-hardwood' || formData.projectType === 'luxury-vinyl') && (
                  <>
                    <div>
                      <Label htmlFor="woodSpecies">Wood Species / Material</Label>
                      <select
                        id="woodSpecies"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.woodSpecies}
                        onChange={(e) => updateField('woodSpecies', e.target.value)}
                      >
                        <option value="">Select type</option>
                        {formData.projectType === 'new-hardwood' ? (
                          <>
                            <option value="oak">Oak</option>
                            <option value="maple">Maple</option>
                            <option value="walnut">Walnut</option>
                            <option value="cherry">Cherry</option>
                            <option value="hickory">Hickory</option>
                          </>
                        ) : (
                          <>
                            <option value="lvp-wood-look">LVP - Wood Look</option>
                            <option value="lvp-stone-look">LVP - Stone Look</option>
                            <option value="lvp-tile-look">LVP - Tile Look</option>
                          </>
                        )}
                      </select>
                    </div>
                    {formData.projectType === 'new-hardwood' && (
                      <div>
                        <Label htmlFor="finishStyle">Finish Style</Label>
                        <select
                          id="finishStyle"
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={formData.finishStyle}
                          onChange={(e) => updateField('finishStyle', e.target.value)}
                        >
                          <option value="">Select finish</option>
                          <option value="prefinished">Prefinished</option>
                          <option value="unfinished">Unfinished (site-finished)</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="demoNeeded">Existing Floor Removal</Label>
                      <select
                        id="demoNeeded"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.demoNeeded}
                        onChange={(e) => updateField('demoNeeded', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="already-demo">Already Removed</option>
                        <option value="include-demo">Include Demo/Removal</option>
                        <option value="new-construction">New Construction</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Kitchen Remodel Questions */}
                {formData.projectType === 'kitchen-remodel' && (
                  <>
                    <div>
                      <Label htmlFor="cabinetsTop">Upper Cabinets</Label>
                      <select
                        id="cabinetsTop"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.cabinetsTop}
                        onChange={(e) => updateField('cabinetsTop', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="keep-existing">Keep Existing</option>
                        <option value="refacing">Refacing</option>
                        <option value="new-cabinets">New Cabinets</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="cabinetsBottom">Lower Cabinets</Label>
                      <select
                        id="cabinetsBottom"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.cabinetsBottom}
                        onChange={(e) => updateField('cabinetsBottom', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="keep-existing">Keep Existing</option>
                        <option value="refacing">Refacing</option>
                        <option value="new-cabinets">New Cabinets</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="countertops">Countertops</Label>
                      <select
                        id="countertops"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.countertops}
                        onChange={(e) => updateField('countertops', e.target.value)}
                      >
                        <option value="">Select material</option>
                        <option value="granite">Granite</option>
                        <option value="quartz">Quartz</option>
                        <option value="marble">Marble</option>
                        <option value="laminate">Laminate</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="backsplash">Backsplash</Label>
                      <select
                        id="backsplash"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.backsplash}
                        onChange={(e) => updateField('backsplash', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="tile">Tile</option>
                        <option value="glass">Glass</option>
                        <option value="stone">Stone</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="sinkPlumbing">Sink & Plumbing Updates</Label>
                      <select
                        id="sinkPlumbing"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.sinkPlumbing}
                        onChange={(e) => updateField('sinkPlumbing', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="keep-existing">Keep Existing</option>
                        <option value="new-sink">New Sink</option>
                        <option value="full-plumbing">Full Plumbing Update</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="lightingFixtures">Lighting Fixtures</Label>
                      <select
                        id="lightingFixtures"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.lightingFixtures}
                        onChange={(e) => updateField('lightingFixtures', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="keep-existing">Keep Existing</option>
                        <option value="update-fixtures">Update Fixtures</option>
                        <option value="recessed-lighting">Add Recessed Lighting</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Square Footage & Urgency */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Project Size</Label>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <Label htmlFor="length" className="text-sm">Length (feet)</Label>
                      <Input
                        id="length"
                        type="number"
                        placeholder="20"
                        value={formData.length}
                        onChange={(e) => updateField('length', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="width" className="text-sm">Width (feet)</Label>
                      <Input
                        id="width"
                        type="number"
                        placeholder="15"
                        value={formData.width}
                        onChange={(e) => updateField('width', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="totalSqft" className="text-sm">Total Square Feet (editable)</Label>
                    <Input
                      id="totalSqft"
                      type="number"
                      placeholder="300"
                      value={formData.totalSqft}
                      onChange={(e) => updateField('totalSqft', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-calculated from L × W, but you can edit it
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Project Timeline</Label>
                  <div className="grid gap-3">
                    <button
                      onClick={() => updateField('urgency', 'asap')}
                      className={`p-3 rounded-lg border-2 text-left transition-all hover:border-primary ${
                        formData.urgency === 'asap' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-semibold">ASAP</div>
                      <div className="text-sm text-muted-foreground">Ready to start immediately</div>
                    </button>
                    <button
                      onClick={() => updateField('urgency', '1-2-weeks')}
                      className={`p-3 rounded-lg border-2 text-left transition-all hover:border-primary ${
                        formData.urgency === '1-2-weeks' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-semibold">1-2 Weeks</div>
                      <div className="text-sm text-muted-foreground">Planning to start soon</div>
                    </button>
                    <button
                      onClick={() => updateField('urgency', '1-month')}
                      className={`p-3 rounded-lg border-2 text-left transition-all hover:border-primary ${
                        formData.urgency === '1-month' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-semibold">Within a Month</div>
                      <div className="text-sm text-muted-foreground">Still in planning phase</div>
                    </button>
                    <button
                      onClick={() => updateField('urgency', 'browsing')}
                      className={`p-3 rounded-lg border-2 text-left transition-all hover:border-primary ${
                        formData.urgency === 'browsing' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-semibold">Just Browsing</div>
                      <div className="text-sm text-muted-foreground">Gathering information</div>
                    </button>
                  </div>
                </div>

                {/* Live Price Range */}
                {priceRange && (
                  <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Your Estimated Price Range</p>
                    <p className="text-3xl font-bold mb-1">
                      ${priceRange.min} - ${priceRange.max}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Average: ${priceRange.avg} • Based on {formData.totalSqft} sq ft
                    </p>
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        {formData.projectType === 'refinishing' && 'Refinishing project'}
                        {formData.projectType === 'new-hardwood' && 'New hardwood installation'}
                        {formData.projectType === 'luxury-vinyl' && 'Luxury vinyl installation'}
                        {formData.projectType === 'kitchen-remodel' && 'Kitchen remodel project'}
                        {' • '}
                        {formData.qualityTier === 'economic' && 'Economic quality'}
                        {formData.qualityTier === 'standard' && 'Standard quality'}
                        {formData.qualityTier === 'premium' && 'Premium quality'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Contact Info */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>

                {/* Quote Summary */}
                {priceRange && (
                  <div className="p-6 bg-muted rounded-lg space-y-3">
                    <p className="font-semibold text-lg">Your Quote Summary</p>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="font-medium">
                          {PROJECT_TYPES.find(p => p.id === formData.projectType)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quality:</span>
                        <span className="font-medium capitalize">{formData.qualityTier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{formData.totalSqft} sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timeline:</span>
                        <span className="font-medium capitalize">{formData.urgency.replace('-', ' ')}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                        <span className="text-muted-foreground">Estimated Price:</span>
                        <span className="text-xl font-bold text-primary">
                          ${priceRange.min} - ${priceRange.max}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Success */}
            {currentStep === 5 && (
              <div className="text-center space-y-6 py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Thank You, {formData.firstName}!</h3>
                  <p className="text-muted-foreground">
                    We've received your information and will contact you shortly with a detailed quote.
                  </p>
                  {priceRange && (
                    <div className="mt-4 p-4 bg-muted rounded-lg inline-block">
                      <p className="text-sm text-muted-foreground">Your estimated range</p>
                      <p className="text-2xl font-bold">${priceRange.min} - ${priceRange.max}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 space-y-3">
                  <Button 
                    onClick={() => router.push('/visualizer')} 
                    size="lg" 
                    className="w-full"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Try AR Visualizer with Your Options
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full bg-transparent"
                    onClick={() => window.open('https://www.leonshardwood.com/booking-calendar/flooring-consultation?referral=service_list_widget', '_blank')}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Free Consultation
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <p className="text-sm text-muted-foreground pt-2">
                    Schedule an in-home consultation to see samples and get exact pricing
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {currentStep < 4 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Get My Quote'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
