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

interface Assistant {
  id: string;
  name: string;
  type: 'simple' | 'external';
  model: string;
  created_at: string;
  status: 'active' | 'inactive';
  stats?: {
    totalMessages: number;
    totalTokens: number;
    uniqueUsers: number;
  };
}

interface AssistantsTabProps {
  assistants: Assistant[];
  onCreateAssistant: () => void;
  onEditAssistant: (assistant: Assistant) => void;
  onDeleteAssistant: (id: string, name: string) => void;
  onTestAssistant: (id: string, name: string) => void;
}

export const AssistantsTab = ({
  assistants,
  onCreateAssistant,
  onEditAssistant,
  onDeleteAssistant,
  onTestAssistant,
}: AssistantsTabProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ИИ Ассистенты</CardTitle>
              <CardDescription>Управление AI ассистентами для обработки запросов</CardDescription>
            </div>
            <Button onClick={onCreateAssistant} className="bg-primary hover:bg-primary/90">
              <Icon name="Plus" size={16} className="mr-2" />
              Создать ассистента
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assistants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon name="Bot" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Нет ассистентов</h3>
              <p className="text-muted-foreground mb-4">Создайте первого AI ассистента для начала работы</p>
              <Button onClick={onCreateAssistant} variant="outline">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать ассистента
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Модель</TableHead>
                  <TableHead>Статистика</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assistants.map((assistant) => (
                  <TableRow key={assistant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon name="Bot" size={16} className="text-primary" />
                        {assistant.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{assistant.id}</code>
                    </TableCell>
                    <TableCell>
                      {assistant.type === 'simple' ? (
                        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-600">
                          <Icon name="Settings" size={12} className="mr-1" />
                          Простой
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-600">
                          <Icon name="ExternalLink" size={12} className="mr-1" />
                          Сторонний
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-secondary/10 border-secondary/30">
                        {assistant.model}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <div key="messages" className="flex items-center gap-2">
                          <Icon name="MessageCircle" size={12} className="text-muted-foreground" />
                          <span>{assistant.stats?.totalMessages || 0} сообщений</span>
                        </div>
                        <div key="users" className="flex items-center gap-2">
                          <Icon name="Users" size={12} className="text-muted-foreground" />
                          <span>{assistant.stats?.uniqueUsers || 0} пользователей</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          key="test"
                          variant="ghost"
                          size="sm"
                          onClick={() => onTestAssistant(assistant.id, assistant.name)}
                          title="Тестировать ассистента"
                        >
                          <Icon name="MessageSquare" size={16} className="text-primary" />
                        </Button>
                        <Button
                          key="edit"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditAssistant(assistant)}
                        >
                          <Icon name="Settings" size={16} />
                        </Button>
                        <Button
                          key="delete"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAssistant(assistant.id, assistant.name)}
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
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