import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface AddSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secretName: string;
  secretValue: string;
  onSecretNameChange: (name: string) => void;
  onSecretValueChange: (value: string) => void;
  isChecking: boolean;
  onConfirm: () => void;
}

export const AddSecretDialog = ({
  open,
  onOpenChange,
  secretName,
  secretValue,
  onSecretNameChange,
  onSecretValueChange,
  isChecking,
  onConfirm
}: AddSecretDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Key" size={20} className="text-primary" />
            Добавить секрет
          </DialogTitle>
          <DialogDescription>
            Секрет будет доступен в бэкенд функциях через переменные окружения
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="secret-name">Имя секрета</Label>
            <Input
              id="secret-name"
              placeholder="GPTUNNEL_API_KEY"
              value={secretName}
              onChange={(e) => onSecretNameChange(e.target.value.toUpperCase())}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Используйте UPPERCASE_WITH_UNDERSCORES
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-value">Значение</Label>
            <Input
              id="secret-value"
              type="password"
              placeholder="sk-..."
              value={secretValue}
              onChange={(e) => onSecretValueChange(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              API ключ или другое секретное значение
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Icon name="Info" size={16} className="text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Для GPTUNNEL_API_KEY будет выполнена автоматическая проверка ключа
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isChecking || !secretName || !secretValue}
            className="bg-primary hover:bg-primary/90"
          >
            {isChecking ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Проверка...
              </>
            ) : (
              <>
                <Icon name="Check" size={16} className="mr-2" />
                Добавить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
