import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

export const PreviewChatDialog = ({ open, onOpenChange, chat }: PreviewChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: chat?.config.welcomeMessage || 'Здравствуйте! Чем могу помочь?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  if (!chat) return null;

  const { config } = chat;
  const isDark = config.theme === 'dark';

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Это предпросмотр чата. В реальном режиме здесь будут ответы от выбранного ассистента.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Предпросмотр: {chat.name}</DialogTitle>
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
              <span>{config.buttonText}</span>
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
                  style={{ backgroundColor: config.primaryColor, color: 'white' }}
                >
                  <Icon name="Send" size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
