import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

interface AddFileToDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  databaseId: string;
  databaseName: string;
  onSuccess: () => void;
}

type SourceType = 'text' | 'api' | 'xml' | 'json' | 'pdf' | 'docx' | 'csv' | 'excel';

const RAG_API_URL = 'https://functions.poehali.dev/101d01cd-5cab-43fa-a4c9-87a37f3b38b4';

export const AddFileToDatabaseDialog = ({ 
  open, 
  onOpenChange, 
  databaseId, 
  databaseName,
  onSuccess 
}: AddFileToDatabaseDialogProps) => {
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Введите название файла');
      return;
    }

    if (!content.trim() && !file) {
      toast.error('Введите содержимое или выберите файл');
      return;
    }

    setIsLoading(true);

    try {
      let finalContent = content;

      if (file) {
        if (sourceType === 'text' || sourceType === 'json' || sourceType === 'xml') {
          finalContent = await file.text();
        } else {
          toast.error('Загрузка бинарных файлов пока не поддерживается');
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(RAG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseId,
          name,
          sourceType,
          content: finalContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка добавления файла');
      }

      toast.success('Файл успешно добавлен');
      setName('');
      setContent('');
      setFile(null);
      setSourceType('text');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding file:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось добавить файл');
    } finally {
      setIsLoading(false);
    }
  };

  const sourceTypeLabels: Record<SourceType, string> = {
    text: 'Текст',
    api: 'API URL',
    xml: 'XML',
    json: 'JSON',
    pdf: 'PDF',
    docx: 'DOCX',
    csv: 'CSV',
    excel: 'Excel',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Добавить файл в базу: {databaseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-name">Название файла</Label>
            <Input
              id="file-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Прайс-лист 2025"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="source-type">Тип источника</Label>
            <Select value={sourceType} onValueChange={(value) => setSourceType(value as SourceType)}>
              <SelectTrigger id="source-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sourceType === 'api' ? (
            <div>
              <Label htmlFor="api-url">API URL</Label>
              <Input
                id="api-url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://api.example.com/data"
                className="mt-1"
              />
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="file-upload">Загрузить файл (опционально)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept={sourceType === 'text' ? '.txt' : sourceType === 'json' ? '.json' : sourceType === 'xml' ? '.xml' : '*'}
                  className="mt-1"
                />
                {file && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Icon name="File" className="h-3 w-3" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="content">Или введите содержимое</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Введите ${sourceTypeLabels[sourceType].toLowerCase()}...`}
                  className="mt-1 min-h-[200px] font-mono text-sm"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => onOpenChange(false)} variant="outline" disabled={isLoading}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                <>
                  <Icon name="Plus" className="h-4 w-4 mr-2" />
                  Добавить файл
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
