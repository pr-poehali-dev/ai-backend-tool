import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { ApiKeysTab } from '@/components/ApiKeysTab';
import { MonitoringTab } from '@/components/MonitoringTab';
import { SettingsTab } from '@/components/SettingsTab';
import { DeleteKeyDialog } from '@/components/dialogs/DeleteKeyDialog';
import { EditKeyDialog } from '@/components/dialogs/EditKeyDialog';
import { GptunnelSettingsDialog } from '@/components/dialogs/GptunnelSettingsDialog';

const API_KEYS_URL = 'https://functions.poehali.dev/1032605c-9bdd-4a3e-8e80-ede97e25fc74';
const MONITORING_URL = 'https://functions.poehali.dev/6775cf31-8260-4bb5-b914-e8a57517ba49';
const GPTUNNEL_SETTINGS_URL = 'https://functions.poehali.dev/02fd2adf-54b4-4476-9f64-6c552acacfc1';

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

  const [monitoringData, setMonitoringData] = useState({
    totalRequests: 0,
    successRate: 0,
    avgLatency: 0,
    activeKeys: 0,
    dailyRequests: [] as { date: string; count: number }[],
  });

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

  const fetchMonitoring = async () => {
    try {
      const response = await fetch(MONITORING_URL);
      const data = await response.json();
      setMonitoringData(data);
    } catch (error) {
      toast.error('Ошибка загрузки мониторинга');
    }
  };

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

          <TabsContent value="keys">
            <ApiKeysTab
              apiKeys={apiKeys}
              onGenerateKey={generateNewKey}
              onCopyKey={copyToClipboard}
              onToggleStatus={toggleKeyStatus}
              onEditKey={openEditDialog}
              onDeleteKey={openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="monitoring">
            <MonitoringTab data={monitoringData} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              gptunnelStatus={gptunnelStatus}
              onOpenSettingsDialog={() => setSettingsDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </main>

      <DeleteKeyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        keyName={keyToDelete?.name || null}
        onConfirm={deleteApiKey}
      />

      <EditKeyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        keyName={newKeyName}
        originalName={keyToEdit?.name || ''}
        onKeyNameChange={setNewKeyName}
        onConfirm={updateKeyName}
      />

      <GptunnelSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        apiKey={gptunnelApiKey}
        onApiKeyChange={setGptunnelApiKey}
        isChecking={isCheckingKey}
        onConfirm={saveGptunnelKey}
      />
    </div>
  );
};

export default Index;
