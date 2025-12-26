import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validatePhotoFile } from '@/services/import'

interface PhotoDropzoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function PhotoDropzone({ onFileSelect, disabled = false }: PhotoDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      // Validate file
      const validation = validatePhotoFile(file)
      if (!validation.valid) {
        setError(validation.error || 'Invalid file')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files[0]) {
        handleFile(files[0])
      }
    },
    [disabled, handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      if (disabled) return

      const files = e.target.files
      if (files && files[0]) {
        handleFile(files[0])
      }
    },
    [disabled, handleFile]
  )

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
  }, [])

  if (selectedFile && preview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden">
          <img
            src={preview}
            alt="Selected recipe"
            className="w-full h-auto max-h-96 object-contain bg-gray-50"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-medium">{selectedFile.name}</p>
          <p className="text-gray-500">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
          disabled={disabled}
        />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">
          Drop an image here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supports JPG, PNG, WebP, HEIC (max 10MB)
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
