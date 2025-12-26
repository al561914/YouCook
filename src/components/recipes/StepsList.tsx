import type { RecipeStep } from '@/types/recipe'

interface StepsListProps {
  steps: RecipeStep[] | undefined
  rawProcedureText?: string | null
}

export function StepsList({ steps, rawProcedureText }: StepsListProps) {
  if (steps && steps.length > 0) {
    return (
      <ol className="space-y-4">
        {steps.map((step) => (
          <li key={step.id} className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
              {step.step_number}
            </span>
            <div className="flex-1 pt-1">
              <p>{step.instruction}</p>
            </div>
          </li>
        ))}
      </ol>
    )
  }

  if (rawProcedureText) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500 italic">
          Raw instructions (not yet parsed):
        </p>
        <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-3 rounded-md">
          {rawProcedureText}
        </pre>
      </div>
    )
  }

  return <p className="text-gray-500 text-sm">No instructions listed</p>
}
