import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CookModeExitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmExit: () => void
}

export function CookModeExitDialog({
  open,
  onOpenChange,
  onConfirmExit,
}: CookModeExitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exit Cook Mode?</DialogTitle>
          <DialogDescription>
            Your progress will be saved. You can return to cooking mode anytime.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirmExit}>Exit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
