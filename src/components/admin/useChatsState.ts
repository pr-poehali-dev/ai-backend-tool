import { useState } from 'react';

export interface Chat {
  id: string;
  name: string;
  config: ChatConfig;
  code: string;
  created_at: string;
}

export interface ChatConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
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

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createChat = async (name: string, config: ChatConfig) => {
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, config }),
    });
    if (response.ok) {
      const newChat = await response.json();
      setChats(prev => [...prev, newChat]);
      return newChat;
    }
    throw new Error('Failed to create chat');
  };

  const updateChat = async (id: string, name: string, config: ChatConfig) => {
    const response = await fetch(`/api/chats/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, config }),
    });
    if (response.ok) {
      const updatedChat = await response.json();
      setChats(prev => prev.map(chat => chat.id === id ? updatedChat : chat));
      return updatedChat;
    }
    throw new Error('Failed to update chat');
  };

  const deleteChat = async (id: string) => {
    const response = await fetch(`/api/chats/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setChats(prev => prev.filter(chat => chat.id !== id));
    } else {
      throw new Error('Failed to delete chat');
    }
  };

  return {
    chats,
    isLoading,
    loadChats,
    createChat,
    updateChat,
    deleteChat,
  };
};
