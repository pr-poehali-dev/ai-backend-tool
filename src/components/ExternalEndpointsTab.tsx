import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ExternalEndpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  description?: string;
  headers: Record<string, string>;
  authType: string;
  authConfig: Record<string, any>;
  active: boolean;
  createdAt: string;
}

interface ExternalEndpointsTabProps {
  endpoints: ExternalEndpoint[];
  onCreateEndpoint: () => void;
  onEditEndpoint: (endpoint: ExternalEndpoint) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onTestEndpoint: (endpoint: ExternalEndpoint) => void;
}

export const ExternalEndpointsTab = ({
  endpoints,
  onCreateEndpoint,
  onEditEndpoint,
  onToggleStatus,
  onTestEndpoint,
}: ExternalEndpointsTabProps) => {
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'POST': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'PUT': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Внешние API Endpoint</CardTitle>
              <CardDescription>Управление внешними API для интеграций</CardDescription>
            </div>
            <Button onClick={onCreateEndpoint} className="bg-primary hover:bg-primary/90">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить endpoint
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon name="Globe" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Нет эндпоинтов</h3>
              <p className="text-muted-foreground mb-4">Добавьте первый внешний API для интеграции</p>
              <Button onClick={onCreateEndpoint} variant="outline">
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить endpoint
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Метод</TableHead>
                  <TableHead>Авторизация</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon name="Globe" size={16} className="text-primary" />
                        <div>
                          <div>{endpoint.name}</div>
                          {endpoint.description && (
                            <div className="text-xs text-muted-foreground">{endpoint.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{endpoint.url}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/10">
                        {endpoint.authType === 'none' ? 'Без авторизации' : 
                         endpoint.authType === 'bearer' ? 'Bearer Token' :
                         endpoint.authType === 'api-key' ? 'API Key' : endpoint.authType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(endpoint.id, endpoint.active)}
                        className="p-0 h-auto"
                      >
                        {endpoint.active ? (
                          <Badge className="bg-secondary/10 text-secondary border-secondary/30">
                            <Icon name="CheckCircle2" size={12} className="mr-1" />
                            Активен
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/10">
                            <Icon name="Circle" size={12} className="mr-1" />
                            Неактивен
                          </Badge>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTestEndpoint(endpoint)}
                          title="Тестировать endpoint"
                        >
                          <Icon name="Play" size={16} className="text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditEndpoint(endpoint)}
                        >
                          <Icon name="Settings" size={16} />
                        </Button>
                      </div>
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
