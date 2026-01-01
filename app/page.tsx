'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Calculator, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
            Leon's Wood Calculator
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty">
            Calculate wood flooring costs instantly with AR visualization. See how different wood types look in your space before you buy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/calculator">
              <Button size="lg" className="w-full sm:w-auto">
                <Calculator className="mr-2 h-5 w-5" />
                Start Calculator
              </Button>
            </Link>
            <Link href="/visualizer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                <Camera className="mr-2 h-5 w-5" />
                Try AR Visualizer
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 md:mt-24">
          <Card>
            <CardHeader>
              <Calculator className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Accurate Calculations</CardTitle>
              <CardDescription>
                Get precise cost estimates for your wood flooring project
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Camera className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>AR Visualization</CardTitle>
              <CardDescription>
                See different wood types in your space using your camera
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Easy to Use</CardTitle>
              <CardDescription>
                Simple interface that works on all devices
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
