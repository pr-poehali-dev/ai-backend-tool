import { useState } from 'react';
import { toast } from 'sonner';

export interface Chat {
  id: string;
  name: string;
  config: ChatConfig;
  code: string;
  created_at: string;
}

export interface ChatConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-modal';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  assistantId: string;
  welcomeMessage: string;
  placeholder: string;
  buttonText: string;
  buttonIcon: string;
  width: number;
  height: number;
  borderRadius: number;
  showAvatar: boolean;
  avatarUrl?: string;
  showTimestamp: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
}

export const useChatsState = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [editChatOpen, setEditChatOpen] = useState(false);
  const [deleteChatOpen, setDeleteChatOpen] = useState(false);
  const [previewChatOpen, setPreviewChatOpen] = useState(false);
  const [chatToEdit, setChatToEdit] = useState<Chat | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [chatToPreview, setChatToPreview] = useState<Chat | null>(null);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815');
      if (!response.ok) throw new Error('Failed to load chats');
      const data = await response.json();
      
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast.error('Не удалось загрузить чаты');
    } finally {
      setIsLoading(false);
    }
  };

  const saveChats = (newChats: Chat[]) => {
    setChats(newChats);
  };

  const generateEmbedCode = (chatId: string, config: ChatConfig): string => {
    const widgetUrl = window.location.origin + '/widget.js';
    return `<script src="${widgetUrl}" charset="utf-8"></script>
<script>
window.addEventListener('load', function() {
  if (window.initChatWidget) {
    window.initChatWidget('${chatId}');
  }
});
</script>`;
  };

  const createChat = async (name: string, config: ChatConfig) => {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = generateEmbedCode(chatId, config);
    
    const newChat = {
      id: chatId,
      name,
      config,
      code,
    };
    
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChat),
      });
      
      if (!response.ok) throw new Error('Failed to create chat');
      const data = await response.json();
      
      await loadChats();
      toast.success('Чат создан успешно!');
      return data;
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Не удалось создать чат');
      throw error;
    }
  };

  const updateChat = async (id: string, name: string, config: ChatConfig) => {
    const code = generateEmbedCode(id, config);
    
    const updatedChat = {
      id,
      name,
      config,
      code,
    };
    
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedChat),
      });
      
      if (!response.ok) throw new Error('Failed to update chat');
      const data = await response.json();
      
      await loadChats();
      toast.success('Чат обновлён успешно!');
      return data;
    } catch (error) {
      console.error('Failed to update chat:', error);
      toast.error('Не удалось обновить чат');
      throw error;
    }
  };

  const deleteChat = async (id: string) => {
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) throw new Error('Failed to delete chat');
      
      await loadChats();
      toast.success('Чат удалён');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Не удалось удалить чат');
      throw error;
    }
  };

  return {
    chats,
    isLoading,
    loadChats,
    createChat,
    updateChat,
    deleteChat,
    createChatOpen,
    setCreateChatOpen,
    editChatOpen,
    setEditChatOpen,
    deleteChatOpen,
    setDeleteChatOpen,
    previewChatOpen,
    setPreviewChatOpen,
    chatToEdit,
    setChatToEdit,
    chatToDelete,
    setChatToDelete,
    chatToPreview,
    setChatToPreview,
  };
};