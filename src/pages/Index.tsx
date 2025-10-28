import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const API_KEYS_URL = 'https://functions.poehali.dev/1032605c-9bdd-4a3e-8e80-ede97e25fc74';
const MONITORING_URL = 'https://functions.poehali.dev/6775cf31-8260-4bb5-b914-e8a57517ba49';
const GPTUNNEL_SETTINGS_URL = 'https://functions.poehali.dev/02fd2adf-54b4-4476-9f64-6c552acacfc1';
const GPTUNNEL_API_URL = 'https://functions.poehali.dev/e841d4e2-de13-41cb-bc7b-d3055e3c42c0';

const Index = () => {
  const [activeTab, setActiveTab] = useState('keys');
  const [gptunnelApiKey, setGptunnelApiKey] = useState('');
  const [gptunnelStatus, setGptunnelStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<{id: number, name: string} | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState<{id: number, name: string} | null>(null);
  const [newKeyName, setNewKeyName] = useState('');



  useEffect(() => {
    if (activeTab === 'keys') {
      fetchApiKeys();
    } else if (activeTab === 'monitoring') {
      fetchMonitoring();
    } else if (activeTab === 'settings') {
      fetchGptunnelStatus();
    }
  }, [activeTab]);

  const fetchGptunnelStatus = async () => {
    try {
      const response = await fetch(GPTUNNEL_SETTINGS_URL);
      const data = await response.json();
      setGptunnelStatus(data.connected ? 'connected' : 'disconnected');
    } catch (error) {
      setGptunnelStatus('disconnected');
    }
  };

  const saveGptunnelKey = async () => {
    if (!gptunnelApiKey.trim()) {
      toast.error('Введите API ключ');
      return;
    }

    setIsCheckingKey(true);
    try {
      const response = await fetch(GPTUNNEL_SETTINGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: gptunnelApiKey })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setGptunnelStatus('connected');
        setSettingsDialogOpen(false);
        setGptunnelApiKey('');
        toast.success('GPTunnel API подключен');
      } else {
        toast.error(result.error || 'Ошибка проверки ключа');
      }
    } catch (error) {
      toast.error('Ошибка подключения к API');
    } finally {
      setIsCheckingKey(false);
    }
  };

  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const response = await fetch(API_KEYS_URL);
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      toast.error('Ошибка загрузки ключей');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  const generateNewKey = async () => {
    try {
      const response = await fetch(API_KEYS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `New API Key ${apiKeys.length + 1}` })
      });
      const newKey = await response.json();
      setApiKeys([newKey, ...apiKeys]);
      toast.success('Новый API ключ создан');
    } catch (error) {
      toast.error('Ошибка создания ключа');
    }
  };

  const toggleKeyStatus = async (id: number, currentActive: boolean) => {
    try {
      const response = await fetch(API_KEYS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive })
      });
      const updatedKey = await response.json();
      setApiKeys(apiKeys.map(key => key.id === id ? updatedKey : key));
      toast.success('Статус ключа обновлен');
    } catch (error) {
      toast.error('Ошибка обновления статуса');
    }
  };

  const openDeleteDialog = (id: number, name: string) => {
    setKeyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (id: number, name: string) => {
    setKeyToEdit({ id, name });
    setNewKeyName(name);
    setEditDialogOpen(true);
  };

  const updateKeyName = async () => {
    if (!keyToEdit || !newKeyName.trim()) return;
    
    try {
      const response = await fetch(API_KEYS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: keyToEdit.id, name: newKeyName })
      });
      const updatedKey = await response.json();
      setApiKeys(apiKeys.map(key => key.id === keyToEdit.id ? updatedKey : key));
      toast.success('Название ключа обновлено');
    } catch (error) {
      toast.error('Ошибка обновления названия');
    } finally {
      setEditDialogOpen(false);
      setKeyToEdit(null);
      setNewKeyName('');
    }
  };

  const deleteApiKey = async () => {
    if (!keyToDelete) return;
    
    try {
      const response = await fetch(`${API_KEYS_URL}?id=${keyToDelete.id}`, {
        method: 'DELETE'
      });
      await response.json();
      setApiKeys(apiKeys.filter(key => key.id !== keyToDelete.id));
      toast.success('API ключ удален');
    } catch (error) {
      toast.error('Ошибка удаления ключа');
    } finally {
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
    }
  };


  const [monitoringData, setMonitoringData] = useState({
    totalRequests: 0,
    successRate: 0,
    avgLatency: 0,
    activeKeys: 0,
    dailyRequests: [] as { date: string; count: number }[],
  });

  const fetchMonitoring = async () => {
    try {
      const response = await fetch(MONITORING_URL);
      const data = await response.json();
      setMonitoringData(data);
    } catch (error) {
      toast.error('Ошибка загрузки мониторинга');
    }
  };

  const maxRequests = Math.max(...monitoringData.dailyRequests.map(d => d.count));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Cpu" className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Developer Console</h1>
              <p className="text-xs text-muted-foreground">API Management & Testing</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
              <Icon name="Activity" size={14} className="mr-1" />
              Online
            </Badge>
            <Button variant="outline" size="sm">
              <Icon name="Bell" size={16} className="mr-2" />
              Уведомления
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-card">
            <TabsTrigger value="keys" className="data-[state=active]:bg-primary/10">
              <Icon name="Key" size={16} className="mr-2" />
              API-ключи
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary/10">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Мониторинг
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary/10">
              <Icon name="Settings" size={16} className="mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>



          <TabsContent value="keys" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">API Ключи</h2>
                <p className="text-muted-foreground">Управление ключами доступа к API</p>
              </div>
              <Button onClick={generateNewKey} className="bg-primary hover:bg-primary/90">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать ключ
              </Button>
            </div>

            <div className="grid gap-4">
              {apiKeys.map((key) => (
                <Card key={key.id} className="border-border bg-card hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{key.name}</h3>
                          <Badge variant={key.active ? "default" : "secondary"} className={key.active ? "bg-secondary/10 text-secondary border-secondary/30" : ""}>
                            {key.active ? 'Активен' : 'Отключен'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Icon name="Key" size={14} />
                            <code className="bg-[hsl(var(--code-bg))] px-2 py-1 rounded font-mono text-xs">{key.key}</code>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(key.key)}
                            >
                              <Icon name="Copy" size={12} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon name="Calendar" size={14} />
                            {key.created}
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon name="Activity" size={14} />
                            {key.requests.toLocaleString()} запросов
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`switch-${key.id}`} className="text-sm">Активен</Label>
                          <Switch 
                            id={`switch-${key.id}`}
                            checked={key.active} 
                            onCheckedChange={() => toggleKeyStatus(key.id, key.active)}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(key.id, key.name)}
                        >
                          <Icon name="Settings" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(key.id, key.name)}
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardDescription>Всего запросов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{monitoringData.totalRequests.toLocaleString()}</span>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                      <Icon name="TrendingUp" size={12} className="mr-1" />
                      +12%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardDescription>Успешность</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{monitoringData.successRate}%</span>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                      <Icon name="CheckCircle2" size={12} className="mr-1" />
                      Отлично
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardDescription>Средняя задержка</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{monitoringData.avgLatency}ms</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Icon name="Zap" size={12} className="mr-1" />
                      Быстро
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardDescription>Активных ключей</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{monitoringData.activeKeys}</span>
                    <span className="text-sm text-muted-foreground">из {apiKeys.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Активность API за последние 7 дней</CardTitle>
                <CardDescription>Количество запросов по дням</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitoringData.dailyRequests.map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-mono">{day.date}</span>
                        <span className="font-semibold">{day.count.toLocaleString()} запросов</span>
                      </div>
                      <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 rounded-lg"
                          style={{ width: `${(day.count / maxRequests) * 100}%` }}
                        >
                          <div className="h-full w-full bg-gradient-to-t from-transparent to-white/10" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Настройки интеграций</h2>
              <p className="text-muted-foreground">Подключение внешних сервисов</p>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Zap" size={20} className="text-primary" />
                      GPTunnel API
                    </CardTitle>
                    <CardDescription>Интеграция с GPTunnel для доступа к AI моделям</CardDescription>
                  </div>
                  <Badge variant={gptunnelStatus === 'connected' ? 'default' : 'secondary'} 
                         className={gptunnelStatus === 'connected' ? 'bg-secondary/10 text-secondary border-secondary/30' : ''}>
                    {gptunnelStatus === 'connected' ? 'Подключено' : 'Отключено'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Icon name="Info" size={20} className="text-primary mt-0.5" />
                  <div className="flex-1 space-y-2 text-sm">
                    <p className="text-foreground">
                      GPTunnel предоставляет доступ к различным AI моделям через единый API.
                    </p>
                    <p className="text-muted-foreground">
                      Документация: <a href="https://docs.gptunnel.ru" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://docs.gptunnel.ru</a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setSettingsDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Icon name="Key" size={16} className="mr-2" />
                    {gptunnelStatus === 'connected' ? 'Изменить ключ' : 'Настроить интеграцию'}
                  </Button>
                  
                  {gptunnelStatus === 'connected' && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open('https://docs.gptunnel.ru', '_blank')}
                    >
                      <Icon name="ExternalLink" size={16} className="mr-2" />
                      Документация API
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={20} className="text-destructive" />
              Удалить API ключ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Вы уверены, что хотите удалить ключ <span className="font-semibold text-foreground">"{keyToDelete?.name}"</span>?
              <br />
              Это действие деактивирует ключ и его нельзя будет использовать для API запросов.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted hover:bg-muted/80">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteApiKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Icon name="Trash2" size={16} className="mr-2" />
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Settings" size={20} className="text-primary" />
              Редактировать API ключ
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Измените название для удобной идентификации ключа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Название ключа</Label>
              <Input
                id="key-name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Введите новое название"
                className="bg-muted border-border"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateKeyName();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="bg-muted hover:bg-muted/80"
            >
              Отмена
            </Button>
            <Button 
              onClick={updateKeyName}
              disabled={!newKeyName.trim() || newKeyName === keyToEdit?.name}
              className="bg-primary hover:bg-primary/90"
            >
              <Icon name="Check" size={16} className="mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Zap" size={20} className="text-primary" />
              Настройка GPTunnel API
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Введите API ключ для подключения к GPTunnel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gptunnel-key">API ключ GPTunnel</Label>
              <Input
                id="gptunnel-key"
                type="password"
                value={gptunnelApiKey}
                onChange={(e) => setGptunnelApiKey(e.target.value)}
                placeholder="Введите API ключ"
                className="bg-muted border-border font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveGptunnelKey();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Ключ будет проверен и сохранен в защищенном хранилище
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSettingsDialogOpen(false)}
              className="bg-muted hover:bg-muted/80"
              disabled={isCheckingKey}
            >
              Отмена
            </Button>
            <Button 
              onClick={saveGptunnelKey}
              disabled={!gptunnelApiKey.trim() || isCheckingKey}
              className="bg-primary hover:bg-primary/90"
            >
              {isCheckingKey ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  Сохранить и проверить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;