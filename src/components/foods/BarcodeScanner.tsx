import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, CameraOff, AlertCircle, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanAttempts, setScanAttempts] = useState(0)
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
        console.log('Scanner stop error (expected):', e)
      }
      try {
        scanner.clear()
      } catch (e) {
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
      setShowManualInput(false)
      setManualBarcode('')
      setScanAttempts(0)
      return
    }

    let cancelled = false
    let attemptCounter = 0

    const startScanner = async () => {
      await new Promise(resolve => setTimeout(resolve, 400))

      if (cancelled) return

      const container = document.getElementById(SCANNER_ID)
      if (!container) {
        console.error('Scanner container not found')
        return
      }

      await cleanup()

      if (cancelled) return

      setState('starting')
      setError(null)

      try {
        console.log('Creating scanner with formats:', BARCODE_FORMATS)

        const scanner = new Html5Qrcode(SCANNER_ID, {
          verbose: false,
          formatsToSupport: BARCODE_FORMATS,
        })
        scannerRef.current = scanner

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          disableFlip: false,
        }

        console.log('Starting scanner with config:', config)

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText, result) => {
            console.log('✅ Barcode detected:', decodedText, result)

            if (scannerRef.current) {
              const s = scannerRef.current
              scannerRef.current = null

              s.stop().then(() => {
                try { s.clear() } catch {}
              }).catch(() => {
                try { s.clear() } catch {}
              }).finally(() => {
                onScanRef.current(decodedText)
                onOpenChangeRef.current(false)
              })
            }
          },
          () => {
            // This is called frequently when no barcode is in view
            attemptCounter++
            if (attemptCounter % 50 === 0) {
              console.log(`Scanning... (${attemptCounter} frames checked)`)
              setScanAttempts(attemptCounter)
            }
          }
        )

        if (!cancelled && scannerRef.current) {
          console.log('✅ Scanner started successfully')
          setState('scanning')
        }
      } catch (err) {
        console.error('❌ Scanner error:', err)
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
    onOpenChange(false)
    setTimeout(() => onOpenChange(true), 200)
  }

  const handleClose = async () => {
    await cleanup()
    onOpenChange(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const barcode = manualBarcode.trim()
    if (barcode.length >= 8) {
      cleanup()
      onScan(barcode)
      onOpenChange(false)
    }
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
          {!showManualInput ? (
            <>
              {/* Scanner container */}
              <div
                className="relative overflow-hidden rounded-lg bg-gray-900"
                style={{ minHeight: '280px' }}
              >
                <div id={SCANNER_ID} style={{ width: '100%' }} />

                {/* Scanning indicator */}
                {state === 'scanning' && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white bg-black/50 rounded px-2 py-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Scanning...
                    </span>
                    <span>{scanAttempts} frames</span>
                  </div>
                )}

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
                    <Button variant="outline" size="sm" onClick={handleRetry}>
                      Try Again
                    </Button>
                  </div>
                )}
              </div>

              {/* Manual input toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  EAN-13, UPC-A, EAN-8, UPC-E
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualInput(true)}
                  className="text-xs"
                >
                  <Keyboard className="h-3 w-3 mr-1" />
                  Enter manually
                </Button>
              </div>
            </>
          ) : (
            /* Manual barcode input */
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter barcode number
                  </label>
                  <Input
                    id="barcode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g., 5901234123457"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 8-13 digit number below the barcode
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualInput(false)}
                    className="flex-1"
                  >
                    Back to camera
                  </Button>
                  <Button
                    type="submit"
                    disabled={manualBarcode.length < 8}
                    className="flex-1"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
