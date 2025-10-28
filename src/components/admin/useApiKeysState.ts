import { useState } from 'react';
import { toast } from 'sonner';

const API_KEYS_URL = 'https://functions.poehali.dev/1032605c-9bdd-4a3e-8e80-ede97e25fc74';

export const useApiKeysState = () => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<{id: number, name: string} | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState<{id: number, name: string} | null>(null);
  const [newKeyName, setNewKeyName] = useState('');

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
      
      if (apiKeys.length === 0 && newKey.key) {
        localStorage.setItem('gptunnel_default_key', newKey.key);
      }
      
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

  return {
    apiKeys,
    isLoadingKeys,
    deleteDialogOpen,
    keyToDelete,
    editDialogOpen,
    keyToEdit,
    newKeyName,
    setDeleteDialogOpen,
    setEditDialogOpen,
    setNewKeyName,
    fetchApiKeys,
    copyToClipboard,
    generateNewKey,
    toggleKeyStatus,
    openDeleteDialog,
    openEditDialog,
    updateKeyName,
    deleteApiKey
  };
};