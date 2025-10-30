import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Chat, ChatConfig } from '@/components/admin/useChatsState';
import { Assistant } from '@/components/admin/useAssistantsState';

interface EditChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat | null;
  onSubmit: (id: string, name: string, config: ChatConfig) => Promise<void>;
  assistants: Assistant[];
}

export const EditChatDialog = ({ open, onOpenChange, chat, onSubmit, assistants }: EditChatDialogProps) => {
  const [name, setName] = useState('');
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (chat) {
      setName(chat.name);
      setConfig(chat.config);
    }
  }, [chat]);

  const handleSubmit = async () => {
    if (!chat || !name.trim() || !config || !config.assistantId) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(chat.id, name, config);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update chat:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateConfig = (updates: Partial<ChatConfig>) => {
    if (!config) return;
    setConfig(prev => ({ ...prev!, ...updates }));
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать чат-виджет</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="chat-name">Название чата</Label>
            <Input
              id="chat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Чат поддержки"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistant">Ассистент *</Label>
            {assistants.length === 0 ? (
              <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded-md">
                <div className="flex items-start gap-2">
                  <Icon name="AlertTriangle" size={18} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Нет ассистентов</p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Сначала создайте ассистента на вкладке "Ассистенты"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Select value={config.assistantId} onValueChange={(value) => updateConfig({ assistantId: value })}>
                <SelectTrigger id="assistant">
                  <SelectValue placeholder="Выберите ассистента" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
              <TabsTrigger value="messages">Сообщения</TabsTrigger>
              <TabsTrigger value="behavior">Поведение</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Позиция на странице</Label>
                  <Select value={config.position} onValueChange={(value: any) => updateConfig({ position: value })}>
                    <SelectTrigger id="position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Справа внизу</SelectItem>
                      <SelectItem value="bottom-left">Слева внизу</SelectItem>
                      <SelectItem value="top-right">Справа вверху</SelectItem>
                      <SelectItem value="top-left">Слева вверху</SelectItem>
                      <SelectItem value="center-modal">По центру (модальное окно)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Тема</Label>
                  <Select value={config.theme} onValueChange={(value: any) => updateConfig({ theme: value })}>
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Светлая</SelectItem>
                      <SelectItem value="dark">Темная</SelectItem>
                      <SelectItem value="auto">Авто</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-color">Основной цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-radius">Скругление углов (px)</Label>
                  <Input
                    id="border-radius"
                    type="number"
                    value={config.borderRadius}
                    onChange={(e) => updateConfig({ borderRadius: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width">Ширина (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={config.width}
                    onChange={(e) => updateConfig({ width: parseInt(e.target.value) || 400 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Высота (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={config.height}
                    onChange={(e) => updateConfig({ height: parseInt(e.target.value) || 600 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-avatar">Показывать аватар</Label>
                <Switch
                  id="show-avatar"
                  checked={config.showAvatar}
                  onCheckedChange={(checked) => updateConfig({ showAvatar: checked })}
                />
              </div>

              {config.showAvatar && (
                <div className="space-y-2">
                  <Label htmlFor="avatar-url">URL аватара</Label>
                  <Input
                    id="avatar-url"
                    value={config.avatarUrl || ''}
                    onChange={(e) => updateConfig({ avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="show-timestamp">Показывать время сообщений</Label>
                <Switch
                  id="show-timestamp"
                  checked={config.showTimestamp}
                  onCheckedChange={(checked) => updateConfig({ showTimestamp: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Приветственное сообщение</Label>
                <Input
                  id="welcome-message"
                  value={config.welcomeMessage}
                  onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
                  placeholder="Здравствуйте! Чем могу помочь?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder поля ввода</Label>
                <Input
                  id="placeholder"
                  value={config.placeholder}
                  onChange={(e) => updateConfig({ placeholder: e.target.value })}
                  placeholder="Напишите сообщение..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-text">Текст кнопки</Label>
                <Input
                  id="button-text"
                  value={config.buttonText}
                  onChange={(e) => updateConfig({ buttonText: e.target.value })}
                  placeholder="Чат с поддержкой"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-icon">Иконка кнопки (emoji)</Label>
                <Input
                  id="button-icon"
                  value={config.buttonIcon}
                  onChange={(e) => updateConfig({ buttonIcon: e.target.value })}
                  placeholder="💬"
                  maxLength={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-open">Автоматически открывать чат</Label>
                  <p className="text-sm text-muted-foreground">Чат откроется при загрузке страницы</p>
                </div>
                <Switch
                  id="auto-open"
                  checked={config.autoOpen}
                  onCheckedChange={(checked) => updateConfig({ autoOpen: checked })}
                />
              </div>

              {config.autoOpen && (
                <div className="space-y-2">
                  <Label htmlFor="auto-open-delay">Задержка открытия (мс)</Label>
                  <Input
                    id="auto-open-delay"
                    type="number"
                    value={config.autoOpenDelay}
                    onChange={(e) => updateConfig({ autoOpenDelay: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !config.assistantId || isSubmitting || assistants.length === 0}>
            {isSubmitting ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};