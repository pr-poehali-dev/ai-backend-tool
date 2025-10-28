import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface MonitoringData {
  totalRequests: number;
  successRate: number;
  avgLatency: number;
  activeKeys: number;
  dailyRequests: { date: string; count: number }[];
}

interface MonitoringTabProps {
  monitoringData: MonitoringData;
}

export const MonitoringTab = ({ monitoringData }: MonitoringTabProps) => {
  const maxRequests = Math.max(...monitoringData.dailyRequests.map(d => d.count), 0);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Мониторинг API</h2>
        <p className="text-muted-foreground">Статистика и метрики использования</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <Icon name="BarChart3" size={16} />
              Всего запросов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monitoringData.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">За все время</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <Icon name="CheckCircle2" size={16} />
              Успешность
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{monitoringData.successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Процент успешных запросов</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Clock" size={16} />
              Средняя задержка
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monitoringData.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Время ответа API</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Key" size={16} />
              Активных ключей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{monitoringData.activeKeys}</div>
            <p className="text-xs text-muted-foreground mt-1">Включенных ключей</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Активность API за последние 7 дней</CardTitle>
          <CardDescription>Количество запросов по дням</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monitoringData.dailyRequests.map((day, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-mono">{day.date}</span>
                  <span className="font-semibold">{day.count.toLocaleString()} запросов</span>
                </div>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 rounded-lg"
                    style={{ width: `${(day.count / maxRequests) * 100}%` }}
                  >
                    <div className="h-full w-full bg-gradient-to-t from-transparent to-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};