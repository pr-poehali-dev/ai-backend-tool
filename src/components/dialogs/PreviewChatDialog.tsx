import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Chat } from '@/components/admin/useChatsState';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface PreviewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat | null;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const GPTUNNEL_BOT_URL = 'https://functions.poehali.dev/eac81e19-553b-4100-981e-e0202e5cb64d';

export const PreviewChatDialog = ({ open, onOpenChange, chat }: PreviewChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!chat) return null;

  const { config } = chat;
  const isDark = config.theme === 'dark';

  const initMessages = () => {
    if (messages.length === 0 && chat) {
      setMessages([{
        id: '1',
        text: config.welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch(GPTUNNEL_BOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: config.assistantId,
          message: messageText,
          chat_id: chat.id,
        }),
      });

      const data = await response.json();

      let responseText = 'Извините, не удалось получить ответ';
      
      if (data.response) {
        if (Array.isArray(data.response)) {
          if (data.response.length === 0) {
            responseText = 'К сожалению, по запросу ничего не найдено. Измените критерии поиска.';
          } else {
            responseText = `Найдено ${data.response.length} вариантов жилья. В реальном виджете они отобразятся в виде красивых карточек с фото и ценами.`;
          }
        } else if (typeof data.response === 'string') {
          responseText = data.response;
        } else if (typeof data.response === 'object') {
          responseText = JSON.stringify(data.response, null, 2);
        } else {
          responseText = String(data.response);
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Упс, что-то сломалось, попробуйте еще раз!',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  if (open) {
    initMessages();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Предпросмотр: {chat.name}</DialogTitle>
          <DialogDescription>
            Тестирование виджета чата с ассистентом
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center p-8 bg-muted rounded-lg">
          <div
            className="shadow-2xl overflow-hidden flex flex-col"
            style={{
              width: `${config.width}px`,
              height: `${config.height}px`,
              borderRadius: `${config.borderRadius}px`,
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              color: isDark ? '#ffffff' : '#000000',
            }}
          >
            <div
              className="p-4 text-white font-semibold flex items-center gap-2"
              style={{ backgroundColor: config.primaryColor }}
            >
              <span>{config.buttonIcon}</span>
              <span>{typeof chat.name === 'string' ? chat.name : config.buttonText}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[80%]">
                    {!message.isUser && config.showAvatar && (
                      <div className="flex items-center gap-2 mb-1">
                        {config.avatarUrl ? (
                          <img
                            src={config.avatarUrl}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: config.primaryColor, color: 'white' }}
                          >
                            AI
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className="px-4 py-2 rounded-2xl"
                      style={{
                        backgroundColor: message.isUser
                          ? config.primaryColor
                          : isDark
                          ? '#2a2a2a'
                          : '#f0f0f0',
                        color: message.isUser ? 'white' : isDark ? '#ffffff' : '#000000',
                      }}
                    >
                      {message.text}
                    </div>
                    {config.showTimestamp && (
                      <div
                        className="text-xs mt-1 px-2"
                        style={{ color: isDark ? '#888' : '#666' }}
                      >
                        {message.timestamp.toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="flex gap-1 px-4 py-2 rounded-2xl" style={{ backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }}>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: isDark ? '#666' : '#999', animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: isDark ? '#666' : '#999', animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: isDark ? '#666' : '#999', animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: isDark ? '#333' : '#e0e0e0' }}>
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={config.placeholder}
                  className="flex-1"
                  style={{
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    color: isDark ? '#ffffff' : '#000000',
                    borderColor: isDark ? '#444' : '#e0e0e0',
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isSending}
                  style={{ backgroundColor: config.primaryColor, color: 'white' }}
                >
                  {isSending ? (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  ) : (
                    <Icon name="Send" size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};