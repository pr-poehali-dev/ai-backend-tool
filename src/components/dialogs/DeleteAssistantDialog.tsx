import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';

interface DeleteAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistantName: string | null;
  onConfirm: () => void;
}

export const DeleteAssistantDialog = ({ open, onOpenChange, assistantName, onConfirm }: DeleteAssistantDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon name="AlertTriangle" size={20} className="text-destructive" />
            Удалить ассистента?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Вы уверены, что хотите удалить ассистента <span className="font-semibold text-foreground">"{assistantName}"</span>?
            <br />
            Это действие необратимо. Все данные ассистента будут удалены.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted hover:bg-muted/80">
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Icon name="Trash2" size={16} className="mr-2" />
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
