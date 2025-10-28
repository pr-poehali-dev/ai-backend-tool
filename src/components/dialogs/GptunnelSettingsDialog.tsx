import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface GptunnelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  isChecking: boolean;
  onConfirm: () => void;
}

export const GptunnelSettingsDialog = ({ 
  open, 
  onOpenChange, 
  apiKey, 
  onApiKeyChange, 
  isChecking,
  onConfirm 
}: GptunnelSettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Zap" size={20} className="text-primary" />
            Настройка GPTunnel API
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Введите API ключ для подключения к GPTunnel
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gptunnel-key">API ключ GPTunnel</Label>
            <Input
              id="gptunnel-key"
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Введите API ключ"
              className="bg-muted border-border font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onConfirm();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Ключ будет проверен и сохранен в защищенном хранилище
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-muted hover:bg-muted/80"
            disabled={isChecking}
          >
            Отмена
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!apiKey.trim() || isChecking}
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
                Сохранить и проверить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
