import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ApiKeysTab } from '@/components/ApiKeysTab';

import { SettingsTab } from '@/components/SettingsTab';
import { AssistantsTab } from '@/components/AssistantsTab';
import { UsageTab } from '@/components/UsageTab';

import { ChatsTab } from '@/components/ChatsTab';
import { DeleteKeyDialog } from '@/components/dialogs/DeleteKeyDialog';
import { EditKeyDialog } from '@/components/dialogs/EditKeyDialog';
import { CreateAssistantDialog } from '@/components/dialogs/CreateAssistantDialog';
import { EditAssistantDialog } from '@/components/dialogs/EditAssistantDialog';
import { DeleteAssistantDialog } from '@/components/dialogs/DeleteAssistantDialog';
import { TestAssistantDialog } from '@/components/dialogs/TestAssistantDialog';
import { AddSecretDialog } from '@/components/dialogs/AddSecretDialog';

import { CreateChatDialog } from '@/components/dialogs/CreateChatDialog';
import { EditChatDialog } from '@/components/dialogs/EditChatDialog';
import { DeleteChatDialog } from '@/components/dialogs/DeleteChatDialog';
import { PreviewChatDialog } from '@/components/dialogs/PreviewChatDialog';
import { useApiKeysState } from '@/components/admin/useApiKeysState';
import { useAssistantsState } from '@/components/admin/useAssistantsState';
import { useSecretsState } from '@/components/admin/useSecretsState';

import { useUsageState } from '@/components/admin/useUsageState';

import { useChatsState } from '@/components/admin/useChatsState';
import { useBalance } from '@/hooks/useBalance';

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

  const usageState = useUsageState();
  const chatsState = useChatsState();
  const { balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance();

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
    if (activeTab === 'chats') {
      if (chatsState.chats.length === 0) {
        chatsState.loadChats();
      }
      if (assistantsState.assistants.length === 0) {
        assistantsState.fetchAssistants();
      }
    }
  }, [activeTab, chatsState.chats.length, assistantsState.assistants.length]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">GPTunnel Admin</h1>
            <p className="text-muted-foreground">Управление API ключами и ассистентами</p>
          </div>
          <div className="text-right flex items-start gap-3">
            <div>
              <h2 className="text-3xl font-bold">
                {isBalanceLoading ? (
                  <span className="text-muted-foreground">...</span>
                ) : balance !== null ? (
                  `${balance.toFixed(2)} ₽`
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </h2>
              <p className="text-muted-foreground">Баланс</p>
            </div>
            <button
              onClick={refetchBalance}
              disabled={isBalanceLoading}
              className="mt-1 p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Обновить баланс"
            >
              <Icon name="RefreshCw" size={18} className={isBalanceLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys">API Ключи</TabsTrigger>
            <TabsTrigger value="assistants">Ассистенты</TabsTrigger>
            <TabsTrigger value="chats">Чаты</TabsTrigger>
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

          <TabsContent value="chats">
            <ChatsTab
              chats={chatsState.chats}
              isLoading={chatsState.isLoading}
              hasAssistants={assistantsState.assistants.length > 0}
              onCreateChat={() => chatsState.setCreateChatOpen(true)}
              onEditChat={(chat) => {
                chatsState.setChatToEdit(chat);
                chatsState.setEditChatOpen(true);
              }}
              onDeleteChat={(chat) => {
                chatsState.setChatToDelete(chat);
                chatsState.setDeleteChatOpen(true);
              }}
              onPreviewChat={(chat) => {
                chatsState.setChatToPreview(chat);
                chatsState.setPreviewChatOpen(true);
              }}
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

      <CreateChatDialog
        open={chatsState.createChatOpen}
        onOpenChange={chatsState.setCreateChatOpen}
        onSubmit={chatsState.createChat}
        assistants={assistantsState.assistants}
      />

      <EditChatDialog
        open={chatsState.editChatOpen}
        onOpenChange={chatsState.setEditChatOpen}
        chat={chatsState.chatToEdit}
        onSubmit={chatsState.updateChat}
        assistants={assistantsState.assistants}
      />

      <DeleteChatDialog
        open={chatsState.deleteChatOpen}
        onOpenChange={chatsState.setDeleteChatOpen}
        chat={chatsState.chatToDelete}
        onConfirm={chatsState.deleteChat}
      />

      <PreviewChatDialog
        open={chatsState.previewChatOpen}
        onOpenChange={chatsState.setPreviewChatOpen}
        chat={chatsState.chatToPreview}
      />
    </div>
  );
};

export default Index;