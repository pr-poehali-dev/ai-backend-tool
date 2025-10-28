import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SourceType = 'api' | 'xml' | 'text' | 'docx' | 'pdf' | 'csv' | 'excel' | 'json';

interface GPTunnelDatabase {
  id: string;
  name: string;
  createDate: string;
}

interface CreateDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    databaseId: string;
    name: string;
    description: string;
    sourceType: SourceType;
    sourceContent: string | File;
  }) => void;
}

export const CreateDatabaseDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: CreateDatabaseDialogProps) => {
  const [databases, setDatabases] = useState<GPTunnelDatabase[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [databaseId, setDatabaseId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('text');
  const [textContent, setTextContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      loadDatabases();
    }
  }, [open]);

  const loadDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const response = await fetch('https://functions.poehali.dev/101d01cd-5cab-43fa-a4c9-87a37f3b38b4');
      if (response.ok) {
        const data = await response.json();
        setDatabases(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      setLoadingDatabases(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    let sourceContent: string | File = '';

    if (sourceType === 'text') {
      sourceContent = textContent;
    } else if (sourceType === 'api' || sourceType === 'xml') {
      sourceContent = url;
    } else if (file) {
      sourceContent = file;
    }

    onConfirm({
      databaseId,
      name,
      description,
      sourceType,
      sourceContent,
    });

    setName('');
    setDescription('');
    setTextContent('');
    setUrl('');
    setFile(null);
  };

  const isValid = databaseId.trim() && name.trim() && description.trim() && (
    (sourceType === 'text' && textContent.trim()) ||
    ((sourceType === 'api' || sourceType === 'xml') && url.trim()) ||
    (['docx', 'pdf', 'csv', 'excel', 'json'].includes(sourceType) && file)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать базу данных</DialogTitle>
          <DialogDescription>
            Создайте векторную базу для хранения знаний и документов
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="database-id">База данных GPTunnel</Label>
            <Select value={databaseId} onValueChange={setDatabaseId} disabled={loadingDatabases}>
              <SelectTrigger>
                <SelectValue placeholder={loadingDatabases ? "Загрузка..." : "Выберите базу данных"} />
              </SelectTrigger>
              <SelectContent>
                {databases.length === 0 && !loadingDatabases && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Нет баз данных
                  </div>
                )}
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Создайте базу в <a href="https://gptunnel.ru/database" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">GPTunnel</a> если её нет в списке
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-name">Название файла</Label>
            <Input
              id="db-name"
              placeholder="Например: База знаний компании"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-description">Описание</Label>
            <Textarea
              id="db-description"
              placeholder="Краткое описание содержимого базы"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Источник данных</Label>
            <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
              <TabsList className="grid grid-cols-3 lg:grid-cols-7">
                <TabsTrigger value="text">Текст</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
                <TabsTrigger value="xml">XML</TabsTrigger>
                <TabsTrigger value="pdf">PDF</TabsTrigger>
                <TabsTrigger value="docx">DOCX</TabsTrigger>
                <TabsTrigger value="csv">CSV/Excel</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-2 mt-4">
                <Label htmlFor="text-content">Текстовое содержимое</Label>
                <Textarea
                  id="text-content"
                  placeholder="Введите текст для индексации..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="api" className="space-y-2 mt-4">
                <Label htmlFor="api-url">URL API эндпоинта</Label>
                <Input
                  id="api-url"
                  type="url"
                  placeholder="https://api.example.com/data"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  API должен возвращать JSON данные
                </p>
              </TabsContent>

              <TabsContent value="xml" className="space-y-2 mt-4">
                <Label htmlFor="xml-url">URL XML документа</Label>
                <Input
                  id="xml-url"
                  type="url"
                  placeholder="https://example.com/data.xml"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </TabsContent>

              <TabsContent value="pdf" className="space-y-2 mt-4">
                <Label htmlFor="pdf-file">PDF файл</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                {file && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Icon name="FileText" size={16} />
                    <span className="text-sm">{file.name}</span>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="docx" className="space-y-2 mt-4">
                <Label htmlFor="docx-file">DOCX файл</Label>
                <Input
                  id="docx-file"
                  type="file"
                  accept=".docx,.doc"
                  onChange={handleFileChange}
                />
                {file && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Icon name="FileText" size={16} />
                    <span className="text-sm">{file.name}</span>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="csv" className="space-y-2 mt-4">
                <Label htmlFor="csv-file">CSV или Excel файл</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                {file && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Icon name="FileSpreadsheet" size={16} />
                    <span className="text-sm">{file.name}</span>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="json" className="space-y-2 mt-4">
                <Label htmlFor="json-file">JSON файл</Label>
                <Input
                  id="json-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                />
                {file && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Icon name="FileJson" size={16} />
                    <span className="text-sm">{file.name}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Загрузите JSON файл с данными для индексации
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            <Icon name="Upload" size={16} className="mr-2" />
            Создать и загрузить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};