export interface PhotoImage {
  imageBase64: string
  width: number
  height: number
  fileName: string
  fileSize: number
  mimeType: string
}

export interface PhotoExtractionResult {
  image: PhotoImage
  fileName: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']

/**
 * Validates photo file before processing
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'File must be an image (JPG, PNG, WebP, or HEIC)' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Image must be smaller than 10MB' }
  }

  return { valid: true }
}

/**
 * Reads image file and converts to base64 with dimensions
 */
export async function extractPhoto(file: File): Promise<PhotoExtractionResult> {
  try {
    // Validate file
    const validation = validatePhotoFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Read file as data URL
    const dataUrl = await readFileAsDataURL(file)

    // Get image dimensions
    const { width, height } = await getImageDimensions(dataUrl)

    // Extract base64 (remove data:image/...;base64, prefix)
    const base64 = dataUrl.split(',')[1]

    return {
      image: {
        imageBase64: base64,
        width,
        height,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
      fileName: file.name,
    }
  } catch (error) {
    console.error('Error extracting photo:', error)
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper: Read file as Data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Helper: Get image dimensions from data URL
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}
