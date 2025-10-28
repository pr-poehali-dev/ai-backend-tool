import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_KEYS_URL = 'https://functions.poehali.dev/1032605c-9bdd-4a3e-8e80-ede97e25fc74';
const MONITORING_URL = 'https://functions.poehali.dev/6775cf31-8260-4bb5-b914-e8a57517ba49';

const Index = () => {
  const [activeTab, setActiveTab] = useState('keys');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);



  useEffect(() => {
    if (activeTab === 'keys') {
      fetchApiKeys();
    } else if (activeTab === 'monitoring') {
      fetchMonitoring();
    }
  }, [activeTab]);

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

  const deleteApiKey = async (id: number) => {
    try {
      const response = await fetch(`${API_KEYS_URL}?id=${id}`, {
        method: 'DELETE'
      });
      await response.json();
      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast.success('API ключ удален');
    } catch (error) {
      toast.error('Ошибка удаления ключа');
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
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-card">
            <TabsTrigger value="keys" className="data-[state=active]:bg-primary/10">
              <Icon name="Key" size={16} className="mr-2" />
              API-ключи
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary/10">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Мониторинг
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
                        <Button variant="outline" size="sm">
                          <Icon name="Settings" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteApiKey(key.id)}
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
        </Tabs>
      </main>
    </div>
  );
};

export default Index;