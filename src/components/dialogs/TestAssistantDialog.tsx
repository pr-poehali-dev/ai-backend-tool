import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { AccommodationCard } from '@/components/AccommodationCard';

interface Message {
  role: 'user' | 'assistant';
  content: string | any[];
  timestamp: Date;
  mode?: 'text' | 'json';
}

interface TestAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistantId: string;
  assistantName: string;
  gptunnelBotUrl: string;
}

export const TestAssistantDialog = ({
  open,
  onOpenChange,
  assistantId,
  assistantName,
  gptunnelBotUrl,
}: TestAssistantDialogProps) => {
  const storageKey = `chat_history_${assistantId}`;
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = currentMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(gptunnelBotUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'test-user',
        },
        body: JSON.stringify({
          message: inputMessage,
          assistant_id: assistantId,
          history: history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки сообщения');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.message || 'Нет ответа',
        timestamp: new Date(),
        mode: data.mode || 'text',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка связи с ассистентом');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="MessageSquare" size={20} />
                Тестирование: {assistantName}
              </DialogTitle>
              <DialogDescription>
                ID: <code className="text-xs">{assistantId}</code>
              </DialogDescription>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Icon name="Trash2" size={14} className="mr-2" />
                Очистить
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Icon name="MessageSquare" size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Начните диалог с ассистентом</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && message.mode === 'json' && Array.isArray(message.content) && message.content.length > 0 ? (
                    <div className="w-full max-w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="Bot" size={16} className="text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Найдено объектов: {message.content.length}
                        </p>
                        <p className="text-xs text-muted-foreground ml-auto">
                          {message.timestamp.toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {message.content.map((item: any, idx: number) => (
                          <AccommodationCard key={idx} item={item} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Icon name="Bot" size={16} className="mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              message.role === 'user'
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Icon name="Bot" size={16} />
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Напишите сообщение... (Enter для отправки)"
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="self-end"
            size="icon"
          >
            <Icon name="Send" size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};