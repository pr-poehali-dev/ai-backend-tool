import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ApiKeysTab } from '@/components/ApiKeysTab';
import { MonitoringTab } from '@/components/MonitoringTab';
import { SettingsTab } from '@/components/SettingsTab';
import { AssistantsTab } from '@/components/AssistantsTab';
import { UsageTab } from '@/components/UsageTab';
import { DatabaseTab } from '@/components/DatabaseTab';
import { DeleteKeyDialog } from '@/components/dialogs/DeleteKeyDialog';
import { EditKeyDialog } from '@/components/dialogs/EditKeyDialog';
import { CreateAssistantDialog } from '@/components/dialogs/CreateAssistantDialog';
import { EditAssistantDialog } from '@/components/dialogs/EditAssistantDialog';
import { DeleteAssistantDialog } from '@/components/dialogs/DeleteAssistantDialog';
import { TestAssistantDialog } from '@/components/dialogs/TestAssistantDialog';
import { AddSecretDialog } from '@/components/dialogs/AddSecretDialog';
import { CreateDatabaseDialog } from '@/components/dialogs/CreateDatabaseDialog';
import { useApiKeysState } from '@/components/admin/useApiKeysState';
import { useAssistantsState } from '@/components/admin/useAssistantsState';
import { useSecretsState } from '@/components/admin/useSecretsState';
import { useMonitoringState } from '@/components/admin/useMonitoringState';
import { useUsageState } from '@/components/admin/useUsageState';
import { useDatabaseState } from '@/components/admin/useDatabaseState';

const GPTUNNEL_BOT_URL = 'https://functions.poehali.dev/eac81e19-553b-4100-981e-e0202e5cb64d';

const Index = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'keys';
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('activeTab', value);
  };

  const apiKeysState = useApiKeysState();
  const assistantsState = useAssistantsState();
  const secretsState = useSecretsState();
  const monitoringState = useMonitoringState();
  const usageState = useUsageState();
  const databaseState = useDatabaseState();

  useEffect(() => {
    if (activeTab === 'keys' && apiKeysState.apiKeys.length === 0) {
      apiKeysState.fetchApiKeys();
    }
  }, [activeTab, apiKeysState.apiKeys.length]);

  useEffect(() => {
    if (activeTab === 'assistants' && assistantsState.assistants.length === 0) {
      assistantsState.fetchAssistants();
    }
  }, [activeTab, assistantsState.assistants.length]);

  useEffect(() => {
    if (activeTab === 'usage' && usageState.usageStats.length === 0) {
      usageState.fetchUsageStats();
    }
  }, [activeTab, usageState.usageStats.length]);

  useEffect(() => {
    if (activeTab === 'settings' && secretsState.secrets.length === 0) {
      secretsState.fetchSecrets();
    }
  }, [activeTab, secretsState.secrets.length]);

  useEffect(() => {
    if (activeTab === 'monitoring') {
      monitoringState.fetchMonitoring();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'database' && databaseState.databases.length === 0) {
      databaseState.fetchDatabases();
    }
  }, [activeTab, databaseState.databases.length]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">GPTunnel Admin</h1>
          <p className="text-muted-foreground">Управление API ключами и ассистентами</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys">API Ключи</TabsTrigger>
            <TabsTrigger value="assistants">Ассистенты</TabsTrigger>
            <TabsTrigger value="database">База данных</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
            <TabsTrigger value="usage">Статистика</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <ApiKeysTab
              apiKeys={apiKeysState.apiKeys}
              onGenerateKey={apiKeysState.generateNewKey}
              onCopyKey={apiKeysState.copyToClipboard}
              onToggleStatus={apiKeysState.toggleKeyStatus}
              onEditKey={apiKeysState.openEditDialog}
              onDeleteKey={apiKeysState.openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="assistants">
            <AssistantsTab
              assistants={assistantsState.assistants}
              onCreateAssistant={() => assistantsState.setCreateAssistantOpen(true)}
              onEditAssistant={assistantsState.openEditAssistant}
              onDeleteAssistant={assistantsState.openDeleteAssistant}
              onTestAssistant={assistantsState.openTestAssistant}
            />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseTab
              databases={databaseState.databases}
              isLoading={databaseState.isLoading}
              onCreateDatabase={() => databaseState.setCreateDatabaseOpen(true)}
              onViewDatabase={databaseState.viewDatabase}
              onDeleteDatabase={(db) => databaseState.deleteDatabase(db.id)}
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
        onConfirm={assistantsState.createAssistant}
      />

      <EditAssistantDialog
        open={assistantsState.editAssistantOpen}
        onOpenChange={assistantsState.setEditAssistantOpen}
        config={assistantsState.editAssistantConfig}
        onConfigChange={assistantsState.setEditAssistantConfig}
        onConfirm={assistantsState.updateAssistant}
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

      <CreateDatabaseDialog
        open={databaseState.createDatabaseOpen}
        onOpenChange={databaseState.setCreateDatabaseOpen}
        onConfirm={databaseState.createDatabase}
      />
    </div>
  );
};

export default Index;