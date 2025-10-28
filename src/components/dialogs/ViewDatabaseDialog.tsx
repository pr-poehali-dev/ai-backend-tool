import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { AddFileToDatabaseDialog } from './AddFileToDatabaseDialog';
import { toast } from 'sonner';

interface DatabaseFile {
  id: string;
  name: string;
  sourceType: string;
  createDate: string;
}

interface Database {
  id: string;
  name: string;
  createDate: string;
}

interface ViewDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: Database | null;
}

const RAG_API_URL = 'https://functions.poehali.dev/101d01cd-5cab-43fa-a4c9-87a37f3b38b4';

export const ViewDatabaseDialog = ({ open, onOpenChange, database }: ViewDatabaseDialogProps) => {
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  useEffect(() => {
    if (open && database) {
      fetchDatabaseFiles();
    }
  }, [open, database]);

  const fetchDatabaseFiles = async () => {
    if (!database) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${RAG_API_URL}?databaseId=${database.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки файлов');
      }

      const data = await response.json();
      console.log('[ViewDatabaseDialog] Received files:', data);
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      text: 'Текст',
      api: 'API URL',
      xml: 'XML',
      json: 'JSON',
      pdf: 'PDF',
      docx: 'DOCX',
      csv: 'CSV',
      excel: 'Excel',
    };
    return labels[sourceType] || sourceType;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!database) return;

    setDeletingFileId(fileId);
    try {
      const response = await fetch(RAG_API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseId: database.id,
          fileId: fileId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления файла');
      }

      toast.success('Файл удалён');
      fetchDatabaseFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить файл');
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            База данных: {database?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>ID: {database?.id}</span>
            <span>Создана: {database?.createDate ? formatDate(database.createDate) : '-'}</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Файлы в базе данных</h3>
              <Button onClick={() => setAddFileOpen(true)} size="sm">
                <Icon name="Plus" className="h-4 w-4 mr-1" />
                Добавить файл
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Загрузка...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Database" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>В базе данных пока нет файлов</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="p-4 space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="File" className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="Tag" className="h-3 w-3" />
                            {getSourceTypeLabel(file.sourceType)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" className="h-3 w-3" />
                            {formatDate(file.createDate)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deletingFileId === file.id}
                      >
                        {deletingFileId === file.id ? (
                          <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon name="Trash2" className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {database && (
        <AddFileToDatabaseDialog
          open={addFileOpen}
          onOpenChange={setAddFileOpen}
          databaseId={database.id}
          databaseName={database.name}
          onSuccess={fetchDatabaseFiles}
        />
      )}
    </Dialog>
  );
};