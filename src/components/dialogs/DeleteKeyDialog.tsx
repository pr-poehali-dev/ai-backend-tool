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

interface DeleteKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string | null;
  onConfirm: () => void;
}

export const DeleteKeyDialog = ({ open, onOpenChange, keyName, onConfirm }: DeleteKeyDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon name="AlertTriangle" size={20} className="text-destructive" />
            Удалить API ключ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Вы уверены, что хотите удалить ключ <span className="font-semibold text-foreground">"{keyName}"</span>?
            <br />
            Это действие деактивирует ключ и его нельзя будет использовать для API запросов.
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
