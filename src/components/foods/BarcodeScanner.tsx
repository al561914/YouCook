import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, AlertCircle } from 'lucide-react'
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

const SCANNER_ID = 'barcode-scanner-reader'

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [state, setState] = useState<ScannerState>('idle')
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!open) {
      // Clean up when dialog closes
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
        scannerRef.current = null
      }
      setState('idle')
      setError(null)
      return
    }

    // Start scanner when dialog opens
    const startScanner = async () => {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 300))

      if (!mountedRef.current || !open) return

      // Clean up any existing scanner first
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
          scannerRef.current.clear()
        } catch {
          // Ignore cleanup errors
        }
        scannerRef.current = null
      }

      setState('starting')
      setError(null)

      try {
        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false })
        scannerRef.current = scanner

        // Use facingMode for better iOS compatibility
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Responsive scanning box
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
              const boxSize = Math.floor(minEdge * 0.7)
              return {
                width: Math.min(boxSize, 250),
                height: Math.min(Math.floor(boxSize * 0.6), 150),
              }
            },
          },
          (decodedText) => {
            // Success - barcode detected
            if (mountedRef.current) {
              // Stop scanner immediately to prevent multiple reads
              if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {})
                scannerRef.current.clear()
                scannerRef.current = null
              }
              onScan(decodedText)
              onOpenChange(false)
            }
          },
          () => {
            // Scan error - ignore (called when no barcode in view)
          }
        )

        if (mountedRef.current) {
          setState('scanning')
        }
      } catch (err) {
        console.error('Scanner error:', err)
        if (!mountedRef.current) return

        const errorMessage = err instanceof Error ? err.message : 'Failed to start camera'

        if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
          setError('Camera permission denied. Please allow camera access in your browser settings.')
        } else if (errorMessage.includes('NotFound') || errorMessage.includes('No cameras') || errorMessage.includes('Requested device not found')) {
          setError('No camera found. Make sure your device has a camera.')
        } else if (errorMessage.includes('NotReadable') || errorMessage.includes('in use') || errorMessage.includes('Could not start')) {
          setError('Camera is in use by another app. Please close other apps using the camera.')
        } else {
          setError(errorMessage)
        }

        setState('error')
      }
    }

    startScanner()

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [open, onScan, onOpenChange])

  const handleRetry = async () => {
    setState('idle')
    setError(null)
    // Trigger re-mount by toggling open state
    onOpenChange(false)
    setTimeout(() => onOpenChange(true), 100)
  }

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
            className="relative overflow-hidden rounded-lg bg-gray-900"
            style={{ minHeight: '280px' }}
          >
            {/* The scanner library will render into this div */}
            <div
              id={SCANNER_ID}
              style={{ width: '100%' }}
            />

            {/* Loading state overlay */}
            {state === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
                <Camera className="h-12 w-12 animate-pulse mb-3" />
                <p className="text-sm">Starting camera...</p>
              </div>
            )}

            {/* Idle state overlay */}
            {state === 'idle' && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
                <CameraOff className="h-12 w-12 mb-3 text-gray-500" />
                <p className="text-sm text-gray-400">Camera not active</p>
              </div>
            )}

            {/* Error state overlay */}
            {state === 'error' && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 z-10">
                <AlertCircle className="h-12 w-12 mb-3 text-red-400" />
                <p className="text-sm text-center text-red-300 mb-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center">
            Supports EAN-13, UPC-A, EAN-8, UPC-E barcodes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
