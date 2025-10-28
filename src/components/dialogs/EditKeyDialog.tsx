import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface EditKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  originalName: string;
  onKeyNameChange: (name: string) => void;
  onConfirm: () => void;
}

export const EditKeyDialog = ({ 
  open, 
  onOpenChange, 
  keyName, 
  originalName,
  onKeyNameChange, 
  onConfirm 
}: EditKeyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Settings" size={20} className="text-primary" />
            Редактировать API ключ
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Измените название для удобной идентификации ключа
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Название ключа</Label>
            <Input
              id="key-name"
              value={keyName}
              onChange={(e) => onKeyNameChange(e.target.value)}
              placeholder="Введите новое название"
              className="bg-muted border-border"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-muted hover:bg-muted/80"
          >
            Отмена
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!keyName.trim() || keyName === originalName}
            className="bg-primary hover:bg-primary/90"
          >
            <Icon name="Check" size={16} className="mr-2" />
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
