import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Chat } from '@/components/admin/useChatsState';
import { useState } from 'react';
import { toast } from 'sonner';

interface ChatsTabProps {
  chats: Chat[];
  isLoading: boolean;
  hasAssistants: boolean;
  onCreateChat: () => void;
  onEditChat: (chat: Chat) => void;
  onDeleteChat: (chat: Chat) => void;
  onPreviewChat: (chat: Chat) => void;
}

export const ChatsTab = ({
  chats,
  isLoading,
  hasAssistants,
  onCreateChat,
  onEditChat,
  onDeleteChat,
  onPreviewChat,
}: ChatsTabProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success('Код скопирован в буфер обмена');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Не удалось скопировать код');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Встраиваемые чаты</h2>
          <p className="text-muted-foreground">Создавайте и настраивайте чат-виджеты для ваших сайтов</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button onClick={onCreateChat} disabled={!hasAssistants}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать чат
          </Button>
          {!hasAssistants && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Создайте ассистента для начала
            </p>
          )}
        </div>
      </div>

      {chats.length > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Как использовать чаты
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Скопируйте код и вставьте перед закрывающим тегом <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">&lt;/body&gt;</code> на вашем сайте. 
                Используйте предпросмотр для тестирования.
              </p>
            </div>
          </div>
        </Card>
      )}

      {chats.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Нет чатов</h3>
          <p className="text-muted-foreground mb-4">
            {hasAssistants 
              ? 'Создайте первый чат-виджет для вашего сайта'
              : 'Сначала создайте ассистента на вкладке "Ассистенты"'}
          </p>
          {!hasAssistants && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md inline-block">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                💡 Для работы чата нужен AI-ассистент
              </p>
            </div>
          )}
          <Button onClick={onCreateChat} disabled={!hasAssistants}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать чат
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <Card key={chat.id} className="p-4">
              <div className="grid grid-cols-[1fr,2fr,auto] gap-4 items-center">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>{chat.config.buttonIcon}</span>
                    <span>{chat.name}</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {chat.config.theme === 'light' ? '☀️ Светлая' : chat.config.theme === 'dark' ? '🌙 Темная' : '🔄 Авто'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(chat.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <code className="w-[300px] px-3 py-1.5 bg-muted rounded text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap h-[50px] flex items-center">
                    {chat.code.substring(0, 60)}...
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(chat.code, chat.id)}
                    title="Скопировать код"
                  >
                    <Icon name={copiedId === chat.id ? "Check" : "Copy"} size={14} />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreviewChat(chat)}
                    title="Предпросмотр"
                  >
                    <Icon name="Eye" size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditChat(chat)}
                    title="Настроить"
                  >
                    <Icon name="Settings" size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteChat(chat)}
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};