import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, AlertCircle, SwitchCamera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (barcode: string) => void
}

type ScannerState = 'idle' | 'starting' | 'scanning' | 'error'

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [state, setState] = useState<ScannerState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const isScanning = scannerRef.current.isScanning
        if (isScanning) {
          await scannerRef.current.stop()
        }
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
      scannerRef.current = null
    }
    setState('idle')
  }, [])

  const startScanner = useCallback(async (cameraId?: string) => {
    if (!containerRef.current) return

    setState('starting')
    setError(null)

    try {
      // Get available cameras if we haven't yet
      if (cameras.length === 0) {
        const devices = await Html5Qrcode.getCameras()
        if (devices.length === 0) {
          throw new Error('No cameras found on this device')
        }
        setCameras(devices)
        // Prefer back camera on mobile
        const backCameraIndex = devices.findIndex(
          (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
        )
        if (backCameraIndex !== -1) {
          setCurrentCameraIndex(backCameraIndex)
          cameraId = devices[backCameraIndex].id
        } else {
          cameraId = devices[0].id
        }
      }

      const scanner = new Html5Qrcode('barcode-scanner-container')
      scannerRef.current = scanner

      const targetCameraId = cameraId || cameras[currentCameraIndex]?.id

      await scanner.start(
        targetCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback - barcode detected
          onScan(decodedText)
          stopScanner()
          onOpenChange(false)
        },
        () => {
          // Error callback - called frequently when no barcode detected
          // We don't need to handle this
        }
      )

      setState('scanning')
    } catch (err) {
      console.error('Scanner error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera'

      if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
        setError('Camera permission denied. Please allow camera access and try again.')
      } else if (errorMessage.includes('NotFound') || errorMessage.includes('No cameras')) {
        setError('No camera found on this device.')
      } else if (errorMessage.includes('NotReadable') || errorMessage.includes('in use')) {
        setError('Camera is in use by another application.')
      } else {
        setError(errorMessage)
      }

      setState('error')
    }
  }, [cameras, currentCameraIndex, onScan, onOpenChange, stopScanner])

  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return

    await stopScanner()
    const nextIndex = (currentCameraIndex + 1) % cameras.length
    setCurrentCameraIndex(nextIndex)
    startScanner(cameras[nextIndex].id)
  }, [cameras, currentCameraIndex, stopScanner, startScanner])

  // Start scanner when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      stopScanner()
    }
  }, [open, startScanner, stopScanner])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode (EAN, UPC)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner container */}
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg bg-gray-900"
            style={{ minHeight: '280px' }}
          >
            <div id="barcode-scanner-container" className="w-full" />

            {/* Loading state */}
            {state === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                <Camera className="h-12 w-12 animate-pulse mb-3" />
                <p className="text-sm">Starting camera...</p>
              </div>
            )}

            {/* Idle state */}
            {state === 'idle' && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                <CameraOff className="h-12 w-12 mb-3 text-gray-500" />
                <p className="text-sm text-gray-400">Camera not active</p>
              </div>
            )}

            {/* Error state */}
            {state === 'error' && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                <AlertCircle className="h-12 w-12 mb-3 text-red-400" />
                <p className="text-sm text-center text-red-300">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => startScanner()}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Supports EAN-13, UPC-A, EAN-8, UPC-E
            </p>
            {cameras.length > 1 && state === 'scanning' && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                className="gap-1"
              >
                <SwitchCamera className="h-4 w-4" />
                Switch
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
