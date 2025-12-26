import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CookModeExitDialog } from './CookModeExitDialog'

interface CookModeHeaderProps {
  recipeTitle: string
  onExit: () => void
}

export function CookModeHeader({ recipeTitle, onExit }: CookModeHeaderProps) {
  const [exitDialogOpen, setExitDialogOpen] = useState(false)

  const handleConfirmExit = () => {
    onExit()
    setExitDialogOpen(false)
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-4">
          {recipeTitle}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExitDialogOpen(true)}
          className="flex-shrink-0"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Exit Cook Mode</span>
        </Button>
      </header>

      <CookModeExitDialog
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        onConfirmExit={handleConfirmExit}
      />
    </>
  )
}
