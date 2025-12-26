import * as pdfjsLib from 'pdfjs-dist'
// Import worker as URL - Vite will handle bundling
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Configure PDF.js worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const MAX_PAGES = 10
const RENDER_SCALE = 2 // 2x for better OCR quality

export interface PDFPageImage {
  pageNumber: number
  imageBase64: string
  width: number
  height: number
}

export interface PDFExtractionResult {
  pages: PDFPageImage[]
  textContent: string
  pageCount: number
}

/**
 * Renders PDF pages to base64 images for OCR processing
 * Limits to first 10 pages, scales at 2x for quality
 */
export async function renderPDFPages(file: File): Promise<PDFPageImage[]> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    const numPages = Math.min(pdf.numPages, MAX_PAGES)
    const pages: PDFPageImage[] = []

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)

      // Get viewport at 2x scale for better quality
      const viewport = page.getViewport({ scale: RENDER_SCALE })

      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      canvas.width = viewport.width
      canvas.height = viewport.height

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }

      await page.render(renderContext).promise

      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1]

      pages.push({
        pageNumber: pageNum,
        imageBase64,
        width: viewport.width,
        height: viewport.height,
      })
    }

    return pages
  } catch (error) {
    console.error('Error rendering PDF pages:', error)
    throw new Error(`Failed to render PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Attempts to extract text directly from PDF (for searchable PDFs)
 * Returns empty string if text extraction fails or yields minimal content
 */
export async function extractPDFText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    const numPages = Math.min(pdf.numPages, MAX_PAGES)
    let fullText = ''

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Extract text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return ''
  }
}

/**
 * Complete PDF extraction - attempts text extraction first,
 * falls back to rendering pages for OCR
 */
export async function extractPDF(file: File): Promise<PDFExtractionResult> {
  try {
    // Get page count
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const pageCount = pdf.numPages

    // Try text extraction first
    const textContent = await extractPDFText(file)

    // Render pages for visual processing
    const pages = await renderPDFPages(file)

    return {
      pages,
      textContent,
      pageCount,
    }
  } catch (error) {
    console.error('Error extracting PDF:', error)
    throw new Error(`Failed to extract PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates PDF file before processing
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  if (!file.type.includes('pdf')) {
    return { valid: false, error: 'File must be a PDF' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'PDF must be smaller than 10MB' }
  }

  return { valid: true }
}
