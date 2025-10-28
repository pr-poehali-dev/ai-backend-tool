import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface CreateAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  model: string;
  onNameChange: (name: string) => void;
  onModelChange: (model: string) => void;
  onConfirm: () => void;
}

export const CreateAssistantDialog = ({ 
  open, 
  onOpenChange, 
  name, 
  model,
  onNameChange, 
  onModelChange,
  onConfirm 
}: CreateAssistantDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Bot" size={20} className="text-primary" />
            Создать ИИ ассистента
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Настройте параметры нового AI ассистента
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assistant-name">Название ассистента</Label>
            <Input
              id="assistant-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Введите название"
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assistant-model">Модель ИИ</Label>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              </SelectContent>
            </Select>
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
            disabled={!name.trim() || !model}
            className="bg-primary hover:bg-primary/90"
          >
            <Icon name="Check" size={16} className="mr-2" />
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
