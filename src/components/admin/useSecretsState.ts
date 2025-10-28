import { useState } from 'react';
import { toast } from 'sonner';

const SECRETS_URL = 'https://functions.poehali.dev/1bfad5cb-d72a-4295-a5d5-c6e1211be804';

export const useSecretsState = () => {
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [addSecretOpen, setAddSecretOpen] = useState(false);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [isCheckingSecret, setIsCheckingSecret] = useState(false);

  const fetchSecrets = async () => {
    setIsLoadingSecrets(true);
    try {
      const response = await fetch(SECRETS_URL);
      const data = await response.json();
      setSecrets(data);
    } catch (error) {
      toast.error('Ошибка загрузки секретов');
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  const addSecret = async () => {
    if (!newSecretName.trim() || !newSecretValue.trim()) return;

    setIsCheckingSecret(true);
    try {
      const response = await fetch(SECRETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSecretName, value: newSecretValue })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Секрет добавлен');
        setAddSecretOpen(false);
        setNewSecretName('');
        setNewSecretValue('');
        fetchSecrets();
      } else {
        toast.error(result.error || 'Ошибка добавления секрета');
      }
    } catch (error) {
      toast.error('Ошибка подключения к API');
    } finally {
      setIsCheckingSecret(false);
    }
  };

  const deleteSecret = async (name: string) => {
    try {
      const response = await fetch(`${SECRETS_URL}?name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Секрет удалён');
        fetchSecrets();
      } else {
        toast.error(result.error || 'Ошибка удаления секрета');
      }
    } catch (error) {
      toast.error('Ошибка подключения к API');
    }
  };

  return {
    secrets,
    isLoadingSecrets,
    addSecretOpen,
    newSecretName,
    newSecretValue,
    isCheckingSecret,
    setAddSecretOpen,
    setNewSecretName,
    setNewSecretValue,
    fetchSecrets,
    addSecret,
    deleteSecret
  };
};
