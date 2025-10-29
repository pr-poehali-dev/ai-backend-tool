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
  type: 'simple' | 'external';
  name: string;
  firstMessage: string;
  instructions: string;
  model: string;
  contextLength: number;
  humanEmulation: number;
  creativity: number;
  voiceRecognition: boolean;
  ragDatabaseIds?: string[];
  assistantCode?: string;
}

interface EditAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AssistantConfig;
  onConfigChange: (config: AssistantConfig) => void;
  onConfirm: () => void;
}

const MODELS_URL = 'https://functions.poehali.dev/74151b51-97a6-4b7e-b229-d9020587c813';
const RAG_API_URL = 'https://functions.poehali.dev/101d01cd-5cab-43fa-a4c9-87a37f3b38b4';
const GPTUNNEL_MODELS_URL = 'https://functions.poehali.dev/8658254a-114c-4d9a-a2ec-afd076cbe85b';

export const EditAssistantDialog = ({ 
  open, 
  onOpenChange, 
  config,
  onConfigChange,
  onConfirm 
}: EditAssistantDialogProps) => {
  const [models, setModels] = useState<Array<{id: string, name: string}>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [gptunnelModels, setGptunnelModels] = useState<Array<{id: string, name: string}>>([]);
  const [loadingGptunnelModels, setLoadingGptunnelModels] = useState(false);
  const [databases, setDatabases] = useState<Array<{id: string, name: string}>>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);

  useEffect(() => {
    if (open) {
      if (models.length === 0) {
        fetchModels();
      }
      if (databases.length === 0) {
        fetchDatabases();
      }
      if (config.type === 'external') {
        fetchGptunnelModels();
      }
    }
  }, [open, config.type]);

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

  const fetchDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const response = await fetch(RAG_API_URL, {
        method: 'GET'
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setDatabases(data.map((db: any) => ({ id: db.id, name: db.name })));
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
    } finally {
      setLoadingDatabases(false);
    }
  };

  const fetchGptunnelModels = async () => {
    setLoadingGptunnelModels(true);
    try {
      const response = await fetch(GPTUNNEL_MODELS_URL);
      const data = await response.json();
      if (data.data) {
        setGptunnelModels(data.data.map((m: any) => ({ id: m.id, name: m.id })));
      }
    } catch (error) {
      toast.error('Ошибка загрузки моделей GPTunnel');
    } finally {
      setLoadingGptunnelModels(false);
    }
  };

  const toggleDatabase = (dbId: string) => {
    const current = config.ragDatabaseIds || [];
    const updated = current.includes(dbId)
      ? current.filter(id => id !== dbId)
      : [...current, dbId];
    updateConfig('ragDatabaseIds', updated);
  };

  const updateConfig = (field: keyof AssistantConfig, value: any) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Settings" size={20} className="text-primary" />
            Редактировать ассистента
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Измените параметры AI ассистента
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Тип ассистента</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateConfig('type', 'simple')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.type === 'simple'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="Bot" size={24} className={config.type === 'simple' ? 'text-primary' : 'text-muted-foreground'} />
                    <div className="text-sm font-medium">GPTunnel AI</div>
                    <div className="text-xs text-muted-foreground text-center">
                      Создайте своего ИИ-ассистента
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig('type', 'external')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.type === 'external'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="Link" size={24} className={config.type === 'external' ? 'text-primary' : 'text-muted-foreground'} />
                    <div className="text-sm font-medium">Внешний ассистент</div>
                    <div className="text-xs text-muted-foreground text-center">
                      Используйте готового ассистента
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-assistant-name">Название ассистента</Label>
              <Input
                id="edit-assistant-name"
                value={config.name}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder="Введите название"
                className="bg-muted border-border"
              />
            </div>

            {config.type === 'external' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-assistant-code">ID внешнего ассистента</Label>
                  <Input
                    id="edit-assistant-code"
                    value={config.assistantCode || ''}
                    onChange={(e) => updateConfig('assistantCode', e.target.value)}
                    placeholder="Введите ID ассистента из GPTunnel"
                    className="bg-muted border-border font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Укажите код ассистента созданного в GPTunnel UI
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-external-model">Модель ИИ</Label>
                  <Select value={config.model} onValueChange={(v) => updateConfig('model', v)} disabled={loadingGptunnelModels}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder={loadingGptunnelModels ? "Загрузка моделей..." : "Выберите модель"} />
                    </SelectTrigger>
                    <SelectContent>
                      {gptunnelModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {config.type === 'simple' && (
              <>
            <div className="space-y-2">
              <Label htmlFor="edit-first-message">Первое сообщение</Label>
              <Textarea
                id="edit-first-message"
                value={config.firstMessage}
                onChange={(e) => updateConfig('firstMessage', e.target.value)}
                placeholder="Привет! Я ваш ИИ ассистент. Чем могу помочь?"
                className="bg-muted border-border min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Инструкция к работе</Label>
              <Textarea
                id="edit-instructions"
                value={config.instructions}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                placeholder="Опишите, как должен работать ассистент..."
                className="bg-muted border-border min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-assistant-model">Модель ИИ</Label>
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
                <span className="text-sm text-muted-foreground">{(config.creativity ?? 0.7).toFixed(1)}</span>
              </div>
              <Slider
                value={[(config.creativity ?? 0.7) * 10]}
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
                <Label htmlFor="edit-voice-recognition">Распознавание голосовых ответов</Label>
                <p className="text-xs text-muted-foreground">
                  Автоматическое распознавание голосовых команд "да" и "нет"
                </p>
              </div>
              <Switch
                id="edit-voice-recognition"
                checked={config.voiceRecognition}
                onCheckedChange={(v) => updateConfig('voiceRecognition', v)}
              />
            </div>
              </>
            )}
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
            disabled={
              !config.name?.trim() || 
              (config.type === 'simple' && !config.model) ||
              (config.type === 'external' && !config.assistantCode?.trim())
            }
            className="bg-primary hover:bg-primary/90"
          >
            <Icon name="Check" size={16} className="mr-2" />
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};