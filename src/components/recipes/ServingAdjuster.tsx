import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

interface ServingAdjusterProps {
  currentServings: number
  onServingsChange: (servings: number) => void
  minServings?: number
  maxServings?: number
  variant?: 'inline' | 'compact'
}

export function ServingAdjuster({
  currentServings,
  onServingsChange,
  minServings = 1,
  maxServings = 99,
  variant = 'inline',
}: ServingAdjusterProps) {
  const handleDecrement = () => {
    if (currentServings > minServings) {
      onServingsChange(currentServings - 1)
    }
  }

  const handleIncrement = () => {
    if (currentServings < maxServings) {
      onServingsChange(currentServings + 1)
    }
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          disabled={currentServings <= minServings}
          className="h-7 w-7 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="min-w-[60px] text-center text-sm font-medium">
          {currentServings}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          disabled={currentServings >= maxServings}
          className="h-7 w-7 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  // inline variant
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={currentServings <= minServings}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="min-w-[120px] text-center text-sm font-medium">
        {currentServings} {currentServings === 1 ? 'serving' : 'servings'}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={currentServings >= maxServings}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
