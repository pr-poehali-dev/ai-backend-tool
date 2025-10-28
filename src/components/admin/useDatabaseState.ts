import { useState } from 'react';
import { toast } from 'sonner';

interface Database {
  id: string;
  name: string;
  createDate: string;
  filesCount?: number;
}

type SourceType = 'api' | 'xml' | 'text' | 'docx' | 'pdf' | 'csv' | 'excel' | 'json';

const RAG_API_URL = 'https://functions.poehali.dev/101d01cd-5cab-43fa-a4c9-87a37f3b38b4';

export const useDatabaseState = () => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createDatabaseOpen, setCreateDatabaseOpen] = useState(false);

  const fetchDatabases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(RAG_API_URL, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки баз данных');
      }

      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error('Error fetching databases:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить базы данных');
    } finally {
      setIsLoading(false);
    }
  };

  const createDatabase = async (data: {
    name: string;
    description: string;
    sourceType: SourceType;
    sourceContent: string | File;
  }) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('sourceType', data.sourceType);

      if (data.sourceContent instanceof File) {
        formData.append('file', data.sourceContent);
      } else {
        formData.append('content', data.sourceContent);
      }

      const response = await fetch(RAG_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания базы');
      }

      toast.success('База данных создана успешно');
      setCreateDatabaseOpen(false);
      fetchDatabases();
    } catch (error) {
      console.error('Error creating database:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось создать базу данных');
    }
  };

  const deleteDatabase = (databaseId: string) => {
    setDatabases(prev => prev.filter(db => db.id !== databaseId));
    toast.success('База данных удалена локально');
  };

  const viewDatabase = (database: Database) => {
    toast.info(`Просмотр базы: ${database.name}`);
  };

  return {
    databases,
    isLoading,
    createDatabaseOpen,
    setCreateDatabaseOpen,
    fetchDatabases,
    createDatabase,
    deleteDatabase,
    viewDatabase,
  };
};