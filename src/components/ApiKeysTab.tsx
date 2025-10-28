import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  created: string;
  active: boolean;
  requests: number;
}

interface ApiKeysTabProps {
  apiKeys: ApiKey[];
  onGenerateKey: () => void;
  onCopyKey: (key: string) => void;
  onToggleStatus: (id: number, active: boolean) => void;
  onEditKey: (id: number, name: string) => void;
  onDeleteKey: (id: number, name: string) => void;
}

export const ApiKeysTab = ({
  apiKeys,
  onGenerateKey,
  onCopyKey,
  onToggleStatus,
  onEditKey,
  onDeleteKey
}: ApiKeysTabProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">API Ключи</h2>
          <p className="text-muted-foreground">Управление ключами доступа к API</p>
        </div>
        <Button onClick={onGenerateKey} className="bg-primary hover:bg-primary/90">
          <Icon name="Plus" size={16} className="mr-2" />
          Создать ключ
        </Button>
      </div>

      <div className="grid gap-4">
        {apiKeys.map((key) => (
          <Card key={key.id} className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{key.name}</h3>
                    <Badge variant={key.active ? "default" : "secondary"} className={key.active ? "bg-secondary/10 text-secondary border-secondary/30" : ""}>
                      {key.active ? 'Активен' : 'Отключен'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icon name="Key" size={14} />
                      <code className="bg-[hsl(var(--code-bg))] px-2 py-1 rounded font-mono text-xs">{key.key}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => onCopyKey(key.key)}
                      >
                        <Icon name="Copy" size={12} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={14} />
                      {key.created}
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Activity" size={14} />
                      {key.requests.toLocaleString()} запросов
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Статус</span>
                    <Switch
                      checked={key.active}
                      onCheckedChange={() => onToggleStatus(key.id, key.active)}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEditKey(key.id, key.name)}
                  >
                    <Icon name="Settings" size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDeleteKey(key.id, key.name)}
                  >
                    <Icon name="Trash2" size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
