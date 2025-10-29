import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Chat } from '@/components/admin/useChatsState';
import { useState } from 'react';
import { toast } from 'sonner';

interface ChatsTabProps {
  chats: Chat[];
  isLoading: boolean;
  onCreateChat: () => void;
  onEditChat: (chat: Chat) => void;
  onDeleteChat: (chat: Chat) => void;
  onPreviewChat: (chat: Chat) => void;
}

export const ChatsTab = ({
  chats,
  isLoading,
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
        <Button onClick={onCreateChat}>
          <Icon name="Plus" size={16} className="mr-2" />
          Создать чат
        </Button>
      </div>

      {chats.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Нет чатов</h3>
          <p className="text-muted-foreground mb-4">Создайте первый чат-виджет для вашего сайта</p>
          <Button onClick={onCreateChat}>
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
                  <h3 className="font-semibold">{chat.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(chat.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                    {chat.code}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(chat.code, chat.id)}
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
