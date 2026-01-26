import { useState, useEffect } from 'react'
import { Instagram, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { detectPlatform, validateSocialUrl, type SocialPlatform } from '@/services/import/socialExtractor'

interface SocialInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string | null
}

export function SocialInput({ value, onChange, disabled, error: externalError }: SocialInputProps) {
  const [internalError, setInternalError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<SocialPlatform | null>(null)

  useEffect(() => {
    if (!value) {
      setPlatform(null)
      setInternalError(null)
      return
    }

    const detected = detectPlatform(value)
    setPlatform(detected.name !== 'unknown' ? detected.name : null)

    // Only show validation error if URL looks complete (has a path)
    try {
      const url = new URL(value)
      if (url.pathname && url.pathname !== '/') {
        const validation = validateSocialUrl(value)
        if (!validation.valid && detected.name === 'unknown') {
          setInternalError(validation.error || null)
        } else {
          setInternalError(null)
        }
      } else {
        setInternalError(null)
      }
    } catch {
      // Not a valid URL yet, don't show error
      setInternalError(null)
    }
  }, [value])

  const displayError = externalError || internalError

  return (
    <div className="space-y-2">
      <label htmlFor="social-url" className="block text-sm font-medium text-gray-700">
        Paste Instagram URL
      </label>
      <div className="relative">
        <Input
          id="social-url"
          type="url"
          placeholder="https://instagram.com/reel/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`pr-12 ${displayError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
        />
        {platform === 'instagram' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              <Instagram className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Supports posts and reels from Instagram
      </p>
    </div>
  )
}
