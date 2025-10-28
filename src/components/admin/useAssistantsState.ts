import { useState } from 'react';
import { toast } from 'sonner';

const ASSISTANTS_URL = 'https://functions.poehali.dev/abfaab11-c221-448f-9066-0ced0a86705d';

export const useAssistantsState = () => {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [createAssistantOpen, setCreateAssistantOpen] = useState(false);
  const [newAssistantConfig, setNewAssistantConfig] = useState({
    name: '',
    firstMessage: '',
    instructions: '',
    model: 'gpt-4o',
    contextLength: 5,
    humanEmulation: 5,
    creativity: 0.7,
    voiceRecognition: false
  });
  const [editAssistantOpen, setEditAssistantOpen] = useState(false);
  const [editAssistantConfig, setEditAssistantConfig] = useState({
    name: '',
    firstMessage: '',
    instructions: '',
    model: 'gpt-4o',
    contextLength: 5,
    humanEmulation: 5,
    creativity: 0.7,
    voiceRecognition: false
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

  const createAssistant = async () => {
    try {
      const response = await fetch(ASSISTANTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssistantConfig)
      });
      const newAssistant = await response.json();
      setAssistants([...assistants, newAssistant]);
      toast.success('Ассистент создан');
      setCreateAssistantOpen(false);
      setNewAssistantConfig({
        name: '',
        firstMessage: '',
        instructions: '',
        model: 'gpt-4o',
        contextLength: 5,
        humanEmulation: 5,
        creativity: 0.7,
        voiceRecognition: false
      });
    } catch (error) {
      toast.error('Ошибка создания ассистента');
    }
  };

  const openEditAssistant = (assistant: any) => {
    setAssistantToEdit(assistant.id);
    setEditAssistantConfig({
      name: assistant.name,
      firstMessage: assistant.first_message,
      instructions: assistant.instructions,
      model: assistant.model,
      contextLength: assistant.context_length,
      humanEmulation: assistant.human_emulation,
      creativity: assistant.creativity,
      voiceRecognition: assistant.voice_recognition
    });
    setEditAssistantOpen(true);
  };

  const updateAssistant = async () => {
    if (!assistantToEdit) return;
    
    try {
      const response = await fetch(ASSISTANTS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assistantToEdit,
          ...editAssistantConfig
        })
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
    newAssistantConfig,
    editAssistantOpen,
    editAssistantConfig,
    assistantToEdit,
    deleteAssistantOpen,
    assistantToDelete,
    testAssistantOpen,
    assistantToTest,
    setCreateAssistantOpen,
    setNewAssistantConfig,
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
