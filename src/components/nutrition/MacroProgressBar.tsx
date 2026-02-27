interface MacroProgressBarProps {
  label: string
  value: number
  target: number | null
  unit?: string
  color: 'orange' | 'blue' | 'yellow' | 'green'
}

const colorMap = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
}

export function MacroProgressBar({
  label,
  value,
  target,
  unit = 'g',
  color,
}: MacroProgressBarProps) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {Math.round(value)}{unit}
          {target !== null && <> / {Math.round(target)}{unit}</>}
        </span>
      </div>
      {target !== null && (
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${colorMap[color]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
