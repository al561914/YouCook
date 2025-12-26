import type { RecipeStep, RecipeWithRelations } from '@/types/recipe'

interface CookModeStepProps {
  step: RecipeStep
  recipe: RecipeWithRelations
}

export function CookModeStep({ step, recipe }: CookModeStepProps) {
  // Find step photos (if any)
  const stepPhotos = recipe.media?.filter((m) => m.step_id === step.id) || []

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Step number badge */}
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg lg:text-xl">
            {step.step_number}
          </span>
          <span className="text-sm font-medium text-gray-500">
            Step {step.step_number}
          </span>
        </div>

        {/* Step photos (if available) */}
        {stepPhotos.length > 0 && (
          <div className="space-y-2">
            {stepPhotos.map((photo) => (
              <div key={photo.id} className="rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption || `Step ${step.step_number}`}
                  className="w-full object-cover"
                />
                {photo.caption && (
                  <p className="text-sm text-gray-600 mt-2">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step instruction - LARGE TEXT for kitchen use */}
        <p className="text-2xl lg:text-xl leading-relaxed text-gray-900 font-normal">
          {step.instruction}
        </p>

        {/* Timer detection placeholder (Phase 2) */}
        {/* TODO: Add timer detection and CookModeTimer component */}
      </div>
    </div>
  )
}
