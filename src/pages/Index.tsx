import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ApiKeysTab } from '@/components/ApiKeysTab';
import { MonitoringTab } from '@/components/MonitoringTab';
import { SettingsTab } from '@/components/SettingsTab';
import { AssistantsTab } from '@/components/AssistantsTab';
import { UsageTab } from '@/components/UsageTab';
import { DeleteKeyDialog } from '@/components/dialogs/DeleteKeyDialog';
import { EditKeyDialog } from '@/components/dialogs/EditKeyDialog';
import { CreateAssistantDialog } from '@/components/dialogs/CreateAssistantDialog';
import { EditAssistantDialog } from '@/components/dialogs/EditAssistantDialog';
import { DeleteAssistantDialog } from '@/components/dialogs/DeleteAssistantDialog';
import { TestAssistantDialog } from '@/components/dialogs/TestAssistantDialog';
import { AddSecretDialog } from '@/components/dialogs/AddSecretDialog';
import { useApiKeysState } from '@/components/admin/useApiKeysState';
import { useAssistantsState } from '@/components/admin/useAssistantsState';
import { useSecretsState } from '@/components/admin/useSecretsState';
import { useMonitoringState } from '@/components/admin/useMonitoringState';
import { useUsageState } from '@/components/admin/useUsageState';

const GPTUNNEL_BOT_URL = 'https://functions.poehali.dev/eac81e19-553b-4100-981e-e0202e5cb64d';

const Index = () => {
  const [activeTab, setActiveTab] = useState('keys');

  const apiKeysState = useApiKeysState();
  const assistantsState = useAssistantsState();
  const secretsState = useSecretsState();
  const monitoringState = useMonitoringState();
  const usageState = useUsageState();

  useEffect(() => {
    if (activeTab === 'keys' && apiKeysState.apiKeys.length === 0) {
      apiKeysState.fetchApiKeys();
    } else if (activeTab === 'monitoring') {
      monitoringState.fetchMonitoring();
    } else if (activeTab === 'assistants' && assistantsState.assistants.length === 0) {
      assistantsState.fetchAssistants();
    } else if (activeTab === 'usage') {
      usageState.fetchUsageStats();
    } else if (activeTab === 'settings') {
      secretsState.fetchSecrets();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-purple-500/20 p-3 rounded-xl">
            <Icon name="Settings" className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">GPTunnel Admin</h1>
            <p className="text-purple-300">Управление API ключами и ассистентами</p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-300 border-green-500/30">
            <Icon name="Activity" className="w-3 h-3 mr-1" />
            Online
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger value="keys" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Icon name="Key" className="w-4 h-4 mr-2" />
              API Ключи
            </TabsTrigger>
            <TabsTrigger value="assistants" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Icon name="Bot" className="w-4 h-4 mr-2" />
              Ассистенты
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Icon name="BarChart3" className="w-4 h-4 mr-2" />
              Мониторинг
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Icon name="TrendingUp" className="w-4 h-4 mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Icon name="Settings" className="w-4 h-4 mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <ApiKeysTab
              apiKeys={apiKeysState.apiKeys}
              isLoading={apiKeysState.isLoadingKeys}
              onCopy={apiKeysState.copyToClipboard}
              onGenerateNew={apiKeysState.generateNewKey}
              onToggleStatus={apiKeysState.toggleKeyStatus}
              onEdit={apiKeysState.openEditDialog}
              onDelete={apiKeysState.openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="assistants">
            <AssistantsTab
              assistants={assistantsState.assistants}
              onCreateNew={() => assistantsState.setCreateAssistantOpen(true)}
              onEdit={assistantsState.openEditAssistant}
              onDelete={assistantsState.openDeleteAssistant}
              onTest={assistantsState.openTestAssistant}
            />
          </TabsContent>

          <TabsContent value="monitoring">
            <MonitoringTab monitoringData={monitoringState.monitoringData} />
          </TabsContent>

          <TabsContent value="usage">
            <UsageTab usageStats={usageState.usageStats} isLoading={usageState.isLoadingUsage} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              secrets={secretsState.secrets}
              isLoading={secretsState.isLoadingSecrets}
              onAddSecret={() => secretsState.setAddSecretOpen(true)}
              onDeleteSecret={secretsState.deleteSecret}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DeleteKeyDialog
        open={apiKeysState.deleteDialogOpen}
        onOpenChange={apiKeysState.setDeleteDialogOpen}
        keyName={apiKeysState.keyToDelete?.name || ''}
        onConfirm={apiKeysState.deleteApiKey}
      />

      <EditKeyDialog
        open={apiKeysState.editDialogOpen}
        onOpenChange={apiKeysState.setEditDialogOpen}
        keyName={apiKeysState.newKeyName}
        onKeyNameChange={apiKeysState.setNewKeyName}
        onConfirm={apiKeysState.updateKeyName}
      />

      <CreateAssistantDialog
        open={assistantsState.createAssistantOpen}
        onOpenChange={assistantsState.setCreateAssistantOpen}
        config={assistantsState.newAssistantConfig}
        onConfigChange={assistantsState.setNewAssistantConfig}
        onCreate={assistantsState.createAssistant}
      />

      <EditAssistantDialog
        open={assistantsState.editAssistantOpen}
        onOpenChange={assistantsState.setEditAssistantOpen}
        config={assistantsState.editAssistantConfig}
        onConfigChange={assistantsState.setEditAssistantConfig}
        onUpdate={assistantsState.updateAssistant}
      />

      <DeleteAssistantDialog
        open={assistantsState.deleteAssistantOpen}
        onOpenChange={assistantsState.setDeleteAssistantOpen}
        assistantName={assistantsState.assistantToDelete?.name || ''}
        onConfirm={assistantsState.deleteAssistant}
      />

      <TestAssistantDialog
        open={assistantsState.testAssistantOpen}
        onOpenChange={assistantsState.setTestAssistantOpen}
        assistantId={assistantsState.assistantToTest?.id || ''}
        assistantName={assistantsState.assistantToTest?.name || ''}
        gptunnelBotUrl={GPTUNNEL_BOT_URL}
      />

      <AddSecretDialog
        open={secretsState.addSecretOpen}
        onOpenChange={secretsState.setAddSecretOpen}
        secretName={secretsState.newSecretName}
        secretValue={secretsState.newSecretValue}
        onSecretNameChange={secretsState.setNewSecretName}
        onSecretValueChange={secretsState.setNewSecretValue}
        isChecking={secretsState.isCheckingSecret}
        onConfirm={secretsState.addSecret}
      />
    </div>
  );
};

export default Index;
