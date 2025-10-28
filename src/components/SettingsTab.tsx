import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface SettingsTabProps {
  gptunnelStatus: 'connected' | 'disconnected';
  onOpenSettingsDialog: () => void;
}

export const SettingsTab = ({ gptunnelStatus, onOpenSettingsDialog }: SettingsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Настройки интеграций</h2>
        <p className="text-muted-foreground">Подключение внешних сервисов</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Zap" size={20} className="text-primary" />
                GPTunnel API
              </CardTitle>
              <CardDescription>Интеграция с GPTunnel для доступа к AI моделям</CardDescription>
            </div>
            <Badge variant={gptunnelStatus === 'connected' ? 'default' : 'secondary'} 
                   className={gptunnelStatus === 'connected' ? 'bg-secondary/10 text-secondary border-secondary/30' : ''}>
              {gptunnelStatus === 'connected' ? 'Подключено' : 'Отключено'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Icon name="Info" size={20} className="text-primary mt-0.5" />
            <div className="flex-1 space-y-2 text-sm">
              <p className="text-foreground">
                GPTunnel предоставляет доступ к различным AI моделям через единый API.
              </p>
              <p className="text-muted-foreground">
                Документация: <a href="https://docs.gptunnel.ru" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://docs.gptunnel.ru</a>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={onOpenSettingsDialog}
              className="bg-primary hover:bg-primary/90"
            >
              <Icon name="Key" size={16} className="mr-2" />
              {gptunnelStatus === 'connected' ? 'Изменить ключ' : 'Настроить интеграцию'}
            </Button>
            
            {gptunnelStatus === 'connected' && (
              <Button 
                variant="outline"
                onClick={() => window.open('https://docs.gptunnel.ru', '_blank')}
              >
                <Icon name="ExternalLink" size={16} className="mr-2" />
                Документация API
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
