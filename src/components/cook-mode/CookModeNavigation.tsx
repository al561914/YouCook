import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CookModeNavigationProps {
  currentIndex: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
  onFinish?: () => void
}

export function CookModeNavigation({
  currentIndex,
  totalSteps,
  onPrev,
  onNext,
  onFinish,
}: CookModeNavigationProps) {
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === totalSteps - 1
  const progress = ((currentIndex + 1) / totalSteps) * 100

  return (
    <div className="border-t bg-white px-4 py-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Step {currentIndex + 1} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={isFirstStep}
            className="flex-1 h-12 text-base"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Previous
          </Button>

          {isLastStep ? (
            <Button
              onClick={onFinish || onNext}
              className="flex-1 h-12 text-base"
            >
              <Check className="mr-2 h-5 w-5" />
              Finish Cooking
            </Button>
          ) : (
            <Button onClick={onNext} className="flex-1 h-12 text-base">
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
