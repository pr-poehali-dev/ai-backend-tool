import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { toast } from 'sonner';

interface Secret {
  name: string;
  has_value: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SettingsTabProps {
  secrets: Secret[];
  isLoading: boolean;
  onAddSecret: () => void;
  onDeleteSecret: (name: string) => void;
}

const MODELS_URL = 'https://functions.poehali.dev/74151b51-97a6-4b7e-b229-d9020587c813';

export const SettingsTab = ({ secrets, isLoading, onAddSecret, onDeleteSecret }: SettingsTabProps) => {
  const [loadingModels, setLoadingModels] = useState(false);
  const [models, setModels] = useState<Array<{id: string}>>([]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch(MODELS_URL);
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setModels(data.data);
        toast.success(`Загружено ${data.data.length} моделей`);
      } else {
        toast.error('Не удалось загрузить модели');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки моделей');
    } finally {
      setLoadingModels(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Секреты проекта</h2>
          <p className="text-muted-foreground">Управление API ключами и секретными данными</p>
        </div>
        <Button onClick={onAddSecret} className="bg-primary hover:bg-primary/90">
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить секрет
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Key" size={20} className="text-primary" />
            Секреты
          </CardTitle>
          <CardDescription>
            Секреты доступны в бэкенд функциях через переменные окружения
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : secrets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="KeyRound" className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Секреты отсутствуют</p>
              <p className="text-sm mt-1">Добавьте API ключи для работы с внешними сервисами</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Обновлён</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secrets.map((secret) => (
                  <TableRow key={secret.name}>
                    <TableCell className="font-mono font-medium">{secret.name}</TableCell>
                    <TableCell>
                      <Badge variant={secret.has_value ? 'default' : 'secondary'} className="bg-secondary/10 text-secondary border-secondary/30">
                        {secret.has_value ? 'Активен' : 'Не задан'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(secret.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(secret.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteSecret(secret.name)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="BookOpen" size={20} className="text-primary" />
            Документация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Icon name="Info" size={18} className="text-primary mt-0.5" />
            <div className="space-y-1 text-sm flex-1">
              <p className="font-medium">GPTunnel API</p>
              <p className="text-muted-foreground">
                Получите ключ на{' '}
                <a href="https://gptunnel.ru" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  gptunnel.ru
                </a>
                {' '}и добавьте секрет <code className="bg-muted px-1 py-0.5 rounded">GPTUNNEL_API_KEY</code>
              </p>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchModels}
                  disabled={loadingModels}
                  className="w-full sm:w-auto"
                >
                  {loadingModels ? (
                    <>
                      <Icon name="Loader2" size={14} className="mr-2 animate-spin" />
                      Загрузка моделей...
                    </>
                  ) : (
                    <>
                      <Icon name="RefreshCw" size={14} className="mr-2" />
                      Загрузить список моделей
                    </>
                  )}
                </Button>
                {models.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Доступно моделей: {models.length}
                    </p>
                    <div className="max-h-48 overflow-y-auto bg-muted/30 rounded-md p-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {models.map((model) => (
                          <div 
                            key={model.id} 
                            className="text-xs font-mono px-2 py-1 bg-background rounded border border-border/50"
                          >
                            {model.id}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};