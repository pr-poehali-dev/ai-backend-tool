import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const Index = () => {
  const [activeTab, setActiveTab] = useState('playground');
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Production Key', key: 'sk_live_...abc123', created: '2025-10-15', requests: 45678, active: true },
    { id: '2', name: 'Development Key', key: 'sk_test_...xyz789', created: '2025-10-20', requests: 12543, active: true },
    { id: '3', name: 'Testing Key', key: 'sk_test_...def456', created: '2025-10-25', requests: 3421, active: false },
  ]);

  const [playgroundCode, setPlaygroundCode] = useState(`{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello, AI!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 150
}`);

  const [playgroundResponse, setPlaygroundResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  const generateNewKey = () => {
    const newKey = {
      id: String(apiKeys.length + 1),
      name: `New API Key ${apiKeys.length + 1}`,
      key: `sk_live_...${Math.random().toString(36).substring(7)}`,
      created: new Date().toISOString().split('T')[0],
      requests: 0,
      active: true,
    };
    setApiKeys([...apiKeys, newKey]);
    toast.success('Новый API ключ создан');
  };

  const toggleKeyStatus = (id: string) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id ? { ...key, active: !key.active } : key
    ));
    toast.success('Статус ключа обновлен');
  };

  const runPlayground = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPlaygroundResponse(`{
  "id": "chatcmpl-${Math.random().toString(36).substring(7)}",
  "object": "chat.completion",
  "created": ${Math.floor(Date.now() / 1000)},
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm an AI assistant. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 15,
    "total_tokens": 27
  }
}`);
      setIsLoading(false);
      toast.success('Запрос выполнен успешно');
    }, 1500);
  };

  const monitoringData = {
    totalRequests: 61642,
    successRate: 99.7,
    avgLatency: 342,
    activeKeys: 2,
    dailyRequests: [
      { date: '2025-10-22', count: 8234 },
      { date: '2025-10-23', count: 9123 },
      { date: '2025-10-24', count: 7856 },
      { date: '2025-10-25', count: 10234 },
      { date: '2025-10-26', count: 11543 },
      { date: '2025-10-27', count: 9876 },
      { date: '2025-10-28', count: 4776 },
    ],
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
            <TabsTrigger value="playground" className="data-[state=active]:bg-primary/10">
              <Icon name="Code2" size={16} className="mr-2" />
              Песочница
            </TabsTrigger>
            <TabsTrigger value="keys" className="data-[state=active]:bg-primary/10">
              <Icon name="Key" size={16} className="mr-2" />
              API-ключи
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary/10">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Мониторинг
            </TabsTrigger>
          </TabsList>

          <TabsContent value="playground" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Запрос</CardTitle>
                      <CardDescription>Настройте параметры API запроса</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-muted">POST</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <div className="flex gap-2">
                      <Select defaultValue="chat">
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chat">chat/completions</SelectItem>
                          <SelectItem value="embeddings">embeddings</SelectItem>
                          <SelectItem value="images">images/generations</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        value="/v1/chat/completions" 
                        readOnly 
                        className="flex-1 bg-[hsl(var(--code-bg))] font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Request Body</Label>
                    <Textarea
                      value={playgroundCode}
                      onChange={(e) => setPlaygroundCode(e.target.value)}
                      className="font-mono text-sm h-80 bg-[hsl(var(--code-bg))] resize-none"
                      placeholder="Введите JSON запрос"
                    />
                  </div>

                  <Button 
                    onClick={runPlayground} 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                        Выполняется...
                      </>
                    ) : (
                      <>
                        <Icon name="Play" size={16} className="mr-2" />
                        Выполнить запрос
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Ответ</CardTitle>
                      <CardDescription>Результат выполнения запроса</CardDescription>
                    </div>
                    {playgroundResponse && (
                      <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                        <Icon name="CheckCircle2" size={14} className="mr-1" />
                        200 OK
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {playgroundResponse ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex gap-4">
                          <span>Latency: 342ms</span>
                          <span>Tokens: 27</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(playgroundResponse)}
                        >
                          <Icon name="Copy" size={14} className="mr-1" />
                          Копировать
                        </Button>
                      </div>
                      <pre className="p-4 rounded-lg bg-[hsl(var(--code-bg))] font-mono text-sm overflow-auto h-96 border border-border">
                        <code>{playgroundResponse}</code>
                      </pre>
                    </>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                      <div className="text-center">
                        <Icon name="Terminal" size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Выполните запрос для просмотра результата</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                            onCheckedChange={() => toggleKeyStatus(key.id)}
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <Icon name="Settings" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
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
