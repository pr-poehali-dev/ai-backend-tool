import { useState } from 'react';
import { toast } from 'sonner';

const ASSISTANTS_URL = 'https://functions.poehali.dev/abfaab11-c221-448f-9066-0ced0a86705d';

export const useAssistantsState = () => {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [createAssistantOpen, setCreateAssistantOpen] = useState(false);
  const [editAssistantOpen, setEditAssistantOpen] = useState(false);
  const [editAssistantConfig, setEditAssistantConfig] = useState({
    type: 'simple' as 'simple' | 'external',
    name: '',
    firstMessage: '',
    instructions: '',
    model: 'gpt-4o',
    contextLength: 5,
    humanEmulation: 5,
    creativity: 0.7,
    voiceRecognition: false,
    ragDatabaseIds: [] as string[],
    assistantCode: ''
  });
  const [assistantToEdit, setAssistantToEdit] = useState<string | null>(null);
  const [deleteAssistantOpen, setDeleteAssistantOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<{id: string, name: string} | null>(null);
  const [testAssistantOpen, setTestAssistantOpen] = useState(false);
  const [assistantToTest, setAssistantToTest] = useState<{id: string, name: string} | null>(null);

  const fetchAssistants = async () => {
    try {
      const response = await fetch(ASSISTANTS_URL);
      const data = await response.json();
      setAssistants(data);
    } catch (error) {
      toast.error('Ошибка загрузки ассистентов');
    }
  };

  const createAssistant = async (config: any) => {
    try {
      console.log('[createAssistant] Sending config:', config);
      const response = await fetch(ASSISTANTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const newAssistant = await response.json();
      setAssistants([...assistants, newAssistant]);
      setCreateAssistantOpen(false);
      toast.success('Ассистент создан');
    } catch (error) {
      toast.error('Ошибка создания ассистента');
    }
  };

  const openEditAssistant = (assistant: any) => {
    console.log('Opening edit for assistant:', assistant);
    setAssistantToEdit(assistant.id);
    const config = {
      type: assistant.type || 'simple',
      name: assistant.name || '',
      firstMessage: assistant.firstMessage || '',
      instructions: assistant.instructions || '',
      model: assistant.model || 'gpt-4o',
      contextLength: assistant.contextLength || 5,
      humanEmulation: assistant.humanEmulation || 5,
      creativity: assistant.creativity || 0.7,
      voiceRecognition: assistant.voiceRecognition || false,
      ragDatabaseIds: assistant.ragDatabaseIds || [],
      assistantCode: assistant.assistantCode || ''
    };
    console.log('Setting edit config:', config);
    setEditAssistantConfig(config);
    setEditAssistantOpen(true);
  };

  const updateAssistant = async () => {
    if (!assistantToEdit) return;
    
    try {
      const payload = {
        id: assistantToEdit,
        ...editAssistantConfig
      };
      console.log('[updateAssistant] Sending payload:', payload);
      const response = await fetch(ASSISTANTS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const updatedAssistant = await response.json();
      setAssistants(assistants.map(a => a.id === assistantToEdit ? updatedAssistant : a));
      toast.success('Ассистент обновлен');
      setEditAssistantOpen(false);
      setAssistantToEdit(null);
    } catch (error) {
      toast.error('Ошибка обновления ассистента');
    }
  };

  const openDeleteAssistant = (id: string, name: string) => {
    setAssistantToDelete({ id, name });
    setDeleteAssistantOpen(true);
  };

  const deleteAssistant = async () => {
    if (!assistantToDelete) return;
    
    try {
      const response = await fetch(`${ASSISTANTS_URL}?id=${assistantToDelete.id}`, {
        method: 'DELETE'
      });
      await response.json();
      setAssistants(assistants.filter(a => a.id !== assistantToDelete.id));
      toast.success('Ассистент удален');
    } catch (error) {
      toast.error('Ошибка удаления ассистента');
    } finally {
      setDeleteAssistantOpen(false);
      setAssistantToDelete(null);
    }
  };

  const openTestAssistant = (id: string, name: string) => {
    setAssistantToTest({ id, name });
    setTestAssistantOpen(true);
  };

  return {
    assistants,
    createAssistantOpen,
    editAssistantOpen,
    editAssistantConfig,
    assistantToEdit,
    deleteAssistantOpen,
    assistantToDelete,
    testAssistantOpen,
    assistantToTest,
    setCreateAssistantOpen,
    setEditAssistantOpen,
    setEditAssistantConfig,
    setDeleteAssistantOpen,
    setTestAssistantOpen,
    fetchAssistants,
    createAssistant,
    openEditAssistant,
    updateAssistant,
    openDeleteAssistant,
    deleteAssistant,
    openTestAssistant
  };
};