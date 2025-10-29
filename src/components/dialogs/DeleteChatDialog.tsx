import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Chat } from '@/components/admin/useChatsState';

interface DeleteChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat | null;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteChatDialog = ({ open, onOpenChange, chat, onConfirm }: DeleteChatDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!chat) return;
    
    setIsDeleting(true);
    try {
      await onConfirm(chat.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить чат-виджет?</DialogTitle>
          <DialogDescription>
            Вы действительно хотите удалить чат "{chat?.name}"? Это действие необратимо.
            Виджет перестанет работать на всех сайтах, где он установлен.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Удаление...
              </>
            ) : (
              'Удалить'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
