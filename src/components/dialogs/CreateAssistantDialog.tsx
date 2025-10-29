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

interface CreateAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: AssistantConfig) => void;
}

const MODELS_URL = 'https://functions.poehali.dev/74151b51-97a6-4b7e-b229-d9020587c813';
const RAG_API_URL = 'https://functions.poehali.dev/101d01cd-5cab-43fa-a4c9-87a37f3b38b4';
const GPTUNNEL_MODELS_URL = 'https://functions.poehali.dev/8658254a-114c-4d9a-a2ec-afd076cbe85b';

const defaultConfig: AssistantConfig = {
  type: 'simple',
  name: '',
  firstMessage: '',
  instructions: '',
  model: 'gpt-4o',
  contextLength: 5,
  humanEmulation: 5,
  creativity: 0.7,
  voiceRecognition: false,
  ragDatabaseIds: [],
  assistantCode: ''
};

export const CreateAssistantDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm 
}: CreateAssistantDialogProps) => {
  const [config, setConfig] = useState<AssistantConfig>(() => {
    const saved = sessionStorage.getItem('createAssistantDraft');
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [models, setModels] = useState<Array<{id: string, name: string}>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [gptunnelModels, setGptunnelModels] = useState<Array<{id: string, name: string}>>([]);
  const [loadingGptunnelModels, setLoadingGptunnelModels] = useState(false);
  const [databases, setDatabases] = useState<Array<{id: string, name: string}>>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  
  useEffect(() => {
    if (open) {
      sessionStorage.setItem('createAssistantDraft', JSON.stringify(config));
    }
  }, [config, open]);

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
    setConfig({ ...config, [field]: value });
  };
  
  const handleConfirm = async () => {
    await onConfirm(config);
    setConfig(defaultConfig);
    sessionStorage.removeItem('createAssistantDraft');
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
              <Label>Тип ассистента</Label>
              <Select value={config.type} onValueChange={(v: 'simple' | 'external') => updateConfig('type', v)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">
                    <div className="flex items-center gap-2">
                      <Icon name="Settings" size={16} />
                      <span>Простой (настраиваемый)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="external">
                    <div className="flex items-center gap-2">
                      <Icon name="ExternalLink" size={16} />
                      <span>Сторонний (GPTunnel)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {config.type === 'external' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="assistant-code">ID ассистента (GPTunnel)</Label>
                  <Input
                    id="assistant-code"
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
                  <Label htmlFor="external-model">Модель ИИ</Label>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Базы знаний (RAG)</Label>
                <span className="text-xs text-muted-foreground">
                  {loadingDatabases ? 'Загрузка...' : `Выбрано: ${(config.ragDatabaseIds || []).length}`}
                </span>
              </div>
              {databases.length > 0 ? (
                <div className="grid gap-2 max-h-32 overflow-y-auto p-2 bg-muted/50 rounded-md">
                  {databases.map((db) => (
                    <div
                      key={db.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleDatabase(db.id)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        (config.ragDatabaseIds || []).includes(db.id) 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {(config.ragDatabaseIds || []).includes(db.id) && (
                          <Icon name="Check" size={12} className="text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm flex-1">{db.name}</span>
                      <Icon name="Database" size={14} className="text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
                  Нет доступных баз знаний. Создайте их в разделе "База данных"
                </p>
              )}
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
            onClick={handleConfirm}
            disabled={
              !config.name?.trim() || 
              (config.type === 'simple' && !config.model) ||
              (config.type === 'external' && !config.assistantCode?.trim())
            }
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