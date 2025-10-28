import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

export const SettingsTab = () => {
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Icon name="Info" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3 mt-2">
                <p className="font-medium">Как подключить GPTunnel API:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Получите API ключ на <a href="https://gptunnel.ru" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gptunnel.ru</a></li>
                  <li>Откройте раздел "Секреты" в настройках проекта</li>
                  <li>Добавьте секрет с именем <code className="bg-muted px-1.5 py-0.5 rounded">GPTUNNEL_API_KEY</code></li>
                  <li>Вставьте ваш API ключ в поле значения</li>
                  <li>Сохраните изменения</li>
                </ol>
                <p className="text-muted-foreground text-sm mt-3">
                  После добавления секрета все API-эндпоинты автоматически получат доступ к GPTunnel.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Icon name="BookOpen" size={20} className="text-primary mt-0.5" />
            <div className="flex-1 space-y-2 text-sm">
              <p className="text-foreground font-medium">
                Документация GPTunnel API
              </p>
              <p className="text-muted-foreground">
                <a href="https://docs.gptunnel.ru" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://docs.gptunnel.ru
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};