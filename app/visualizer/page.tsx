'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, X, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function VisualizerPage() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [woodType, setWoodType] = useState('oak')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const woodColors = {
    oak: '#B8956A',
    maple: '#C9A66B',
    cherry: '#8B4513',
    walnut: '#5C4033',
    pine: '#E3C16F',
  }

  const startCamera = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('[v0] Requesting camera access...')
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      // Request camera with specific constraints for better mobile compatibility
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      console.log('[v0] Camera access granted, stream:', mediaStream)
      
      setStream(mediaStream)
      
      // Wait for video element to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // Wait for the video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          console.log('[v0] Video metadata loaded')
          videoRef.current?.play().then(() => {
            console.log('[v0] Video playing')
            setIsCameraActive(true)
            setIsLoading(false)
            startDrawing()
          }).catch((playError) => {
            console.error('[v0] Video play error:', playError)
            setError('Failed to start video playback')
            setIsLoading(false)
          })
        }
      }
    } catch (err: any) {
      console.error('[v0] Camera error:', err)
      setIsLoading(false)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.')
      } else {
        setError(err.message || 'Failed to access camera. Please try again.')
      }
    }
  }

  const stopCamera = () => {
    console.log('[v0] Stopping camera...')
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('[v0] Track stopped:', track.kind)
      })
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsCameraActive(false)
    setError(null)
  }

  const startDrawing = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!isCameraActive) return

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Apply wood floor overlay effect
      const overlayHeight = Math.floor(canvas.height * 0.6)
      const gradient = ctx.createLinearGradient(0, canvas.height - overlayHeight, 0, canvas.height)
      
      const woodColor = woodColors[woodType as keyof typeof woodColors]
      gradient.addColorStop(0, `${woodColor}00`)
      gradient.addColorStop(0.5, `${woodColor}80`)
      gradient.addColorStop(1, `${woodColor}CC`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight)

      requestAnimationFrame(draw)
    }

    draw()
  }

  useEffect(() => {
    if (isCameraActive && stream) {
      startDrawing()
    }
  }, [woodType, isCameraActive])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                AR Wood Visualizer
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                See how different wood floors look in your space
              </p>
            </div>
            <Link href="/calculator">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Camera View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Camera View</CardTitle>
                  <CardDescription>
                    {isCameraActive ? 'Viewing live camera feed' : 'Start camera to visualize wood floors'}
                  </CardDescription>
                </div>
                {isCameraActive && (
                  <Button onClick={stopCamera} variant="destructive" size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Feed */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {!isCameraActive && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Camera className="h-16 w-16 text-muted-foreground" />
                    <Button onClick={startCamera} size="lg">
                      <Camera className="mr-2 h-5 w-5" />
                      Start Camera
                    </Button>
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Starting camera...</p>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: isCameraActive ? 'none' : 'none' }}
                />
                
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: isCameraActive ? 'block' : 'none' }}
                />
              </div>

              {/* Wood Type Selector */}
              {isCameraActive && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Wood Type</Label>
                  <Select value={woodType} onValueChange={setWoodType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oak">Oak</SelectItem>
                      <SelectItem value="maple">Maple</SelectItem>
                      <SelectItem value="cherry">Cherry</SelectItem>
                      <SelectItem value="walnut">Walnut</SelectItem>
                      <SelectItem value="pine">Pine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          {!isCameraActive && !error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Click "Start Camera" to activate your device camera</p>
                <p>2. Allow camera permissions when prompted</p>
                <p>3. Point your camera at the floor area</p>
                <p>4. Select different wood types to see how they look</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Label({ children, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
      {children}
    </label>
  )
}
