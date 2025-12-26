// Unit conversion utilities

const VOLUME_CONVERSIONS: Record<string, number> = {
  // All relative to ml
  ml: 1,
  L: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  'fl oz': 29.5735,
}

const WEIGHT_CONVERSIONS: Record<string, number> = {
  // All relative to g
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
}

export function convertVolume(
  value: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = VOLUME_CONVERSIONS[fromUnit]
  const to = VOLUME_CONVERSIONS[toUnit]

  if (!from || !to) return null

  const inMl = value * from
  return inMl / to
}

export function convertWeight(
  value: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = WEIGHT_CONVERSIONS[fromUnit]
  const to = WEIGHT_CONVERSIONS[toUnit]

  if (!from || !to) return null

  const inGrams = value * from
  return inGrams / to
}

export function isVolumeUnit(unit: string): boolean {
  return unit in VOLUME_CONVERSIONS
}

export function isWeightUnit(unit: string): boolean {
  return unit in WEIGHT_CONVERSIONS
}

export function formatQuantity(quantity: number | null): string {
  if (quantity === null) return ''

  // Handle common fractions
  const fractions: [number, string][] = [
    [0.25, '1/4'],
    [0.33, '1/3'],
    [0.5, '1/2'],
    [0.66, '2/3'],
    [0.75, '3/4'],
  ]

  const decimal = quantity % 1

  for (const [value, display] of fractions) {
    if (Math.abs(decimal - value) < 0.05) {
      const whole = Math.floor(quantity)
      return whole > 0 ? `${whole} ${display}` : display
    }
  }

  // Otherwise, show as decimal with max 2 places
  return quantity.toFixed(2).replace(/\.?0+$/, '')
}

export function parseQuantity(input: string): number | null {
  if (!input.trim()) return null

  // Handle fractions like "1/2", "3/4", etc.
  const fractionMatch = input.match(/^(\d+)?\s*(\d+)\/(\d+)$/)
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1], 10) : 0
    const numerator = parseInt(fractionMatch[2], 10)
    const denominator = parseInt(fractionMatch[3], 10)
    return whole + numerator / denominator
  }

  // Handle decimal numbers
  const num = parseFloat(input)
  return isNaN(num) ? null : num
}
