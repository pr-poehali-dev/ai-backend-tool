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
      const stored = localStorage.getItem('chats');
      if (stored) {
        setChats(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChats = (newChats: Chat[]) => {
    localStorage.setItem('chats', JSON.stringify(newChats));
    setChats(newChats);
  };

  const generateEmbedCode = (chatId: string, config: ChatConfig): string => {
    const positionStyles: Record<string, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
    };
    
    const position = config.position || 'bottom-right';
    const positionStyle = positionStyles[position];
    
    return `<script>
(function(){var c=${JSON.stringify(config)};var id='${chatId}';var s=document.createElement('style');s.textContent=\`.gpt-chat-widget{position:fixed;${positionStyle}z-index:9999;font-family:sans-serif}\`;document.head.appendChild(s);var d=document.createElement('div');d.className='gpt-chat-widget';d.innerHTML='<button onclick="alert(\\'Chat widget ID: ${chatId}\\')" style="padding:12px 20px;background:${config.primaryColor};color:white;border:none;border-radius:${config.borderRadius}px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15)">${config.buttonIcon} ${config.buttonText}</button>';document.body.appendChild(d);})();
</script>`;
  };

  const createChat = async (name: string, config: ChatConfig) => {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = generateEmbedCode(chatId, config);
    
    const newChat: Chat = {
      id: chatId,
      name,
      config,
      code,
      created_at: new Date().toISOString(),
    };
    
    const newChats = [...chats, newChat];
    saveChats(newChats);
    toast.success('Чат создан успешно!');
    return newChat;
  };

  const updateChat = async (id: string, name: string, config: ChatConfig) => {
    const code = generateEmbedCode(id, config);
    
    const newChats = chats.map(chat => 
      chat.id === id 
        ? { ...chat, name, config, code }
        : chat
    );
    
    saveChats(newChats);
    toast.success('Чат обновлён успешно!');
    return newChats.find(c => c.id === id)!;
  };

  const deleteChat = async (id: string) => {
    const newChats = chats.filter(chat => chat.id !== id);
    saveChats(newChats);
    toast.success('Чат удалён');
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