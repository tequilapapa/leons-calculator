'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, Calculator } from 'lucide-react'
import Link from 'next/link'

export default function CalculatorPage() {
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [woodType, setWoodType] = useState('')
  const [totalCost, setTotalCost] = useState<number | null>(null)

  const woodPrices = {
    oak: 8.50,
    maple: 7.25,
    cherry: 9.75,
    walnut: 12.00,
    pine: 5.50,
  }

  const calculateCost = () => {
    const area = parseFloat(length) * parseFloat(width)
    if (area && woodType && woodType in woodPrices) {
      const price = woodPrices[woodType as keyof typeof woodPrices]
      const cost = area * price
      setTotalCost(cost)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Wood Flooring Calculator
            </h1>
            <p className="text-muted-foreground">
              Calculate your flooring costs and visualize with AR
            </p>
          </div>

          {/* Calculator Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculate Cost
              </CardTitle>
              <CardDescription>
                Enter your room dimensions and select wood type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length (ft)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="12"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width (ft)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="10"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wood-type">Wood Type</Label>
                <Select value={woodType} onValueChange={setWoodType}>
                  <SelectTrigger id="wood-type">
                    <SelectValue placeholder="Select wood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oak">Oak - $8.50/sq ft</SelectItem>
                    <SelectItem value="maple">Maple - $7.25/sq ft</SelectItem>
                    <SelectItem value="cherry">Cherry - $9.75/sq ft</SelectItem>
                    <SelectItem value="walnut">Walnut - $12.00/sq ft</SelectItem>
                    <SelectItem value="pine">Pine - $5.50/sq ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={calculateCost} className="w-full" size="lg">
                Calculate Cost
              </Button>

              {totalCost !== null && (
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Total Cost</p>
                  <p className="text-3xl font-bold text-primary">
                    ${totalCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {(parseFloat(length) * parseFloat(width)).toFixed(2)} sq ft
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Link href="/visualizer">
                  <Button variant="outline" className="w-full bg-transparent" size="lg">
                    <Camera className="mr-2 h-5 w-5" />
                    Visualize with AR Camera
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
