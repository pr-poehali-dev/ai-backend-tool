import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface UsageStats {
  endpoint: string;
  model: string;
  date: string;
  request_count: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost: number;
}

interface UsageTabProps {
  usageStats: UsageStats[];
  isLoading: boolean;
}

export const UsageTab = ({ usageStats, isLoading }: UsageTabProps) => {
  const totalTokens = usageStats.reduce((sum, stat) => sum + stat.total_tokens, 0);
  const totalRequests = usageStats.reduce((sum, stat) => sum + stat.request_count, 0);
  const totalPromptTokens = usageStats.reduce((sum, stat) => sum + stat.total_prompt_tokens, 0);
  const totalCompletionTokens = usageStats.reduce((sum, stat) => sum + stat.total_completion_tokens, 0);
  const totalCost = usageStats.reduce((sum, stat) => sum + stat.total_cost, 0);
  
  const sortedByCost = [...usageStats].sort((a, b) => b.total_cost - a.total_cost);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getEndpointName = (endpoint: string) => {
    const names: Record<string, string> = {
      '/v1/chat/completions': 'Chat Completions',
      '/v1/embeddings': 'Embeddings',
      '/v1/moderations': 'Moderations'
    };
    return names[endpoint] || endpoint;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего запросов</CardTitle>
            <Icon name="Activity" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalRequests)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего токенов</CardTitle>
            <Icon name="Zap" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalTokens)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Промпт токенов</CardTitle>
            <Icon name="ArrowUp" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalPromptTokens)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ответ токенов</CardTitle>
            <Icon name="ArrowDown" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalCompletionTokens)}</div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-400">Общие расходы</CardTitle>
            <Icon name="DollarSign" className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCost.toFixed(2)} ₽</div>
          </CardContent>
        </Card>
      </div>

      {sortedByCost.length > 0 && sortedByCost[0].total_cost > 0 && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-white">💸 Самые дорогие запросы</CardTitle>
            <CardDescription className="text-muted-foreground">Топ-5 по расходам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedByCost.slice(0, 5).map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{stat.model}</Badge>
                      <span className="text-sm text-muted-foreground">{getEndpointName(stat.endpoint)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(stat.date).toLocaleDateString('ru-RU')} • {formatNumber(stat.request_count)} запросов • {formatNumber(stat.total_tokens)} токенов
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-400">{stat.total_cost.toFixed(2)} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Детальная статистика по эндпоинтам</CardTitle>
          <CardDescription>Использование токенов и расходы</CardDescription>
        </CardHeader>
        <CardContent>
          {usageStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="BarChart3" className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Статистика использования пока отсутствует</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Эндпоинт</TableHead>
                  <TableHead>Модель</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Запросы</TableHead>
                  <TableHead className="text-right">Промпт токены</TableHead>
                  <TableHead className="text-right">Ответ токены</TableHead>
                  <TableHead className="text-right">Всего токенов</TableHead>
                  <TableHead className="text-right">Стоимость</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageStats.map((stat, index) => (
                  <TableRow key={index} className={stat.total_cost > 10 ? 'bg-amber-500/10' : ''}>
                    <TableCell className="font-medium">
                      {getEndpointName(stat.endpoint)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{stat.model}</Badge>
                    </TableCell>
                    <TableCell>{new Date(stat.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell className="text-right">{formatNumber(stat.request_count)}</TableCell>
                    <TableCell className="text-right">{formatNumber(stat.total_prompt_tokens)}</TableCell>
                    <TableCell className="text-right">{formatNumber(stat.total_completion_tokens)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(stat.total_tokens)}</TableCell>
                    <TableCell className="text-right">
                      <span className={stat.total_cost > 10 ? 'font-bold text-amber-400' : ''}>
                        {stat.total_cost.toFixed(2)} ₽
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};