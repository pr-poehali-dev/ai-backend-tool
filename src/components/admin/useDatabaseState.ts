import { useState } from 'react';
import { toast } from 'sonner';

interface Database {
  id: string;
  name: string;
  createDate: string;
  filesCount?: number;
}

type SourceType = 'api' | 'xml' | 'text' | 'docx' | 'pdf' | 'csv' | 'excel';

export const useDatabaseState = () => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createDatabaseOpen, setCreateDatabaseOpen] = useState(false);

  const GPTUNNEL_API_KEY = localStorage.getItem('gptunnel_default_key') || '';

  const fetchDatabases = async () => {
    if (!GPTUNNEL_API_KEY) {
      toast.error('API ключ не найден');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://gptunnel.ru/v1/database/list', {
        method: 'GET',
        headers: {
          'Authorization': GPTUNNEL_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки баз данных');
      }

      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error('Error fetching databases:', error);
      toast.error('Не удалось загрузить базы данных');
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
    if (!GPTUNNEL_API_KEY) {
      toast.error('API ключ не найден');
      return;
    }

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

      const response = await fetch('https://gptunnel.ru/v1/database/create', {
        method: 'POST',
        headers: {
          'Authorization': GPTUNNEL_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка создания базы');
      }

      toast.success('База данных создана успешно');
      setCreateDatabaseOpen(false);
      fetchDatabases();
    } catch (error) {
      console.error('Error creating database:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось создать базу данных');
    }
  };

  const deleteDatabase = async (databaseId: string) => {
    if (!GPTUNNEL_API_KEY) {
      toast.error('API ключ не найден');
      return;
    }

    try {
      const response = await fetch(`https://gptunnel.ru/v1/database/${databaseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': GPTUNNEL_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления базы');
      }

      toast.success('База данных удалена');
      fetchDatabases();
    } catch (error) {
      console.error('Error deleting database:', error);
      toast.error('Не удалось удалить базу данных');
    }
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
