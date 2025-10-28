import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AssistantConfig {
  name: string;
  firstMessage: string;
  instructions: string;
  model: string;
  contextLength: number;
  humanEmulation: number;
  creativity: number;
  voiceRecognition: boolean;
}

interface CreateAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AssistantConfig;
  onConfigChange: (config: AssistantConfig) => void;
  onConfirm: () => void;
}

const MODELS_URL = 'https://functions.poehali.dev/74151b51-97a6-4b7e-b229-d9020587c813';

export const CreateAssistantDialog = ({ 
  open, 
  onOpenChange, 
  config,
  onConfigChange,
  onConfirm 
}: CreateAssistantDialogProps) => {
  const [models, setModels] = useState<Array<{id: string, name: string}>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (open && models.length === 0) {
      fetchModels();
    }
  }, [open, models.length]);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch(MODELS_URL);
      const data = await response.json();
      if (data.data) {
        setModels(data.data.map((m: any) => ({ id: m.id, name: m.id })));
      }
    } catch (error) {
      toast.error('Ошибка загрузки моделей');
    } finally {
      setLoadingModels(false);
    }
  };

  const updateConfig = (field: keyof AssistantConfig, value: any) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Bot" size={20} className="text-primary" />
            Создать ИИ ассистента
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Настройте параметры нового AI ассистента
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="assistant-name">Название ассистента</Label>
              <Input
                id="assistant-name"
                value={config.name}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder="Введите название"
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first-message">Первое сообщение</Label>
              <Textarea
                id="first-message"
                value={config.firstMessage}
                onChange={(e) => updateConfig('firstMessage', e.target.value)}
                placeholder="Привет! Я ваш ИИ ассистент. Чем могу помочь?"
                className="bg-muted border-border min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Инструкция к работе</Label>
              <Textarea
                id="instructions"
                value={config.instructions}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                placeholder="Опишите, как должен работать ассистент..."
                className="bg-muted border-border min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistant-model">Модель ИИ</Label>
              <Select value={config.model} onValueChange={(v) => updateConfig('model', v)} disabled={loadingModels}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder={loadingModels ? "Загрузка моделей..." : "Выберите модель"} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Длина контекста</Label>
                <span className="text-sm text-muted-foreground">{config.contextLength}</span>
              </div>
              <Slider
                value={[config.contextLength]}
                onValueChange={(v) => updateConfig('contextLength', v[0])}
                min={1}
                max={10}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Количество сообщений, которые ассистент помнит в диалоге
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Эмуляция диалога человека</Label>
                <span className="text-sm text-muted-foreground">{config.humanEmulation}</span>
              </div>
              <Slider
                value={[config.humanEmulation]}
                onValueChange={(v) => updateConfig('humanEmulation', v[0])}
                min={1}
                max={10}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Насколько естественно ассистент имитирует человеческую речь
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Креативность</Label>
                <span className="text-sm text-muted-foreground">{config.creativity.toFixed(1)}</span>
              </div>
              <Slider
                value={[config.creativity * 10]}
                onValueChange={(v) => updateConfig('creativity', v[0] / 10)}
                min={0}
                max={10}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Уровень случайности и вариативности ответов (0 - предсказуемо, 1 - креативно)
              </p>
            </div>

            <div className="flex items-center justify-between space-x-4 rounded-lg border border-border bg-muted/50 p-4">
              <div className="space-y-1 flex-1">
                <Label htmlFor="voice-recognition">Распознавание голосовых ответов</Label>
                <p className="text-xs text-muted-foreground">
                  Автоматическое распознавание голосовых команд "да" и "нет"
                </p>
              </div>
              <Switch
                id="voice-recognition"
                checked={config.voiceRecognition}
                onCheckedChange={(v) => updateConfig('voiceRecognition', v)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-muted hover:bg-muted/80"
          >
            Отмена
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!config.name?.trim() || !config.model}
            className="bg-primary hover:bg-primary/90"
          >
            <Icon name="Check" size={16} className="mr-2" />
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};