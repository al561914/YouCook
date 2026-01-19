import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
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

// Barcode formats to scan for
const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
]

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [state, setState] = useState<ScannerState>('idle')
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isCleaningUpRef = useRef(false)

  // Use refs to avoid stale closures in callbacks
  const onScanRef = useRef(onScan)
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onScanRef.current = onScan
    onOpenChangeRef.current = onOpenChange
  }, [onScan, onOpenChange])

  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return
    isCleaningUpRef.current = true

    const scanner = scannerRef.current
    if (scanner) {
      scannerRef.current = null
      try {
        const isScanning = scanner.isScanning
        if (isScanning) {
          await scanner.stop()
        }
      } catch (e) {
        // Ignore stop errors
        console.log('Scanner stop error (expected):', e)
      }
      try {
        scanner.clear()
      } catch (e) {
        // Ignore clear errors
        console.log('Scanner clear error (expected):', e)
      }
    }

    isCleaningUpRef.current = false
  }, [])

  useEffect(() => {
    if (!open) {
      cleanup()
      setState('idle')
      setError(null)
      return
    }

    let cancelled = false

    const startScanner = async () => {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 400))

      if (cancelled) return

      // Make sure container exists
      const container = document.getElementById(SCANNER_ID)
      if (!container) {
        console.error('Scanner container not found')
        return
      }

      // Clean up any existing scanner
      await cleanup()

      if (cancelled) return

      setState('starting')
      setError(null)

      try {
        const scanner = new Html5Qrcode(SCANNER_ID, {
          verbose: false,
          formatsToSupport: BARCODE_FORMATS,
        })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            // Success - barcode detected
            console.log('Barcode detected:', decodedText)

            // Prevent multiple callbacks
            if (scannerRef.current) {
              const s = scannerRef.current
              scannerRef.current = null

              s.stop().then(() => {
                s.clear()
              }).catch(() => {
                try { s.clear() } catch {}
              }).finally(() => {
                onScanRef.current(decodedText)
                onOpenChangeRef.current(false)
              })
            }
          },
          () => {
            // No barcode found in frame - this is called frequently, ignore
          }
        )

        if (!cancelled && scannerRef.current) {
          setState('scanning')
        }
      } catch (err) {
        console.error('Scanner error:', err)
        if (cancelled) return

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

    return () => {
      cancelled = true
      cleanup()
    }
  }, [open, cleanup])

  const handleRetry = () => {
    setError(null)
    setState('idle')
    // Close and reopen to restart
    onOpenChange(false)
    setTimeout(() => onOpenChange(true), 200)
  }

  const handleClose = async () => {
    await cleanup()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner container */}
          <div
            className="relative overflow-hidden rounded-lg bg-gray-900"
            style={{ minHeight: '300px' }}
          >
            {/* The scanner library renders into this div */}
            <div id={SCANNER_ID} style={{ width: '100%' }} />

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
            Supports EAN-13, UPC-A, EAN-8, UPC-E, Code 128, Code 39
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
