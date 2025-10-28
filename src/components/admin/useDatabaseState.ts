import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface Database {
  id: string;
  name: string;
  createDate: string;
  filesCount?: number;
}

type SourceType = 'api' | 'xml' | 'text' | 'docx' | 'pdf' | 'csv' | 'excel' | 'json';

const RAG_API_URL = 'https://functions.poehali.dev/101d01cd-5cab-43fa-a4c9-87a37f3b38b4';

const STORAGE_KEY = 'rag_databases_cache';
const FETCHED_KEY = 'rag_databases_fetched';

export const useDatabaseState = () => {
  const [databases, setDatabases] = useState<Database[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    console.log('[useDatabaseState] Loading from localStorage:', cached);
    return cached ? JSON.parse(cached) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [createDatabaseOpen, setCreateDatabaseOpen] = useState(false);
  const [viewDatabaseOpen, setViewDatabaseOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const hasFetchedRef = useRef(localStorage.getItem(FETCHED_KEY) === 'true');

  useEffect(() => {
    console.log('[useDatabaseState] Saving to localStorage:', databases);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(databases));
  }, [databases]);

  const fetchDatabases = async () => {
    console.log('[useDatabaseState] fetchDatabases called');
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
      console.log('[useDatabaseState] Fetched databases:', data);
      setDatabases(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(FETCHED_KEY, 'true');
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('Error fetching databases:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить базы данных');
    } finally {
      setIsLoading(false);
    }
  };

  const createDatabase = async (data: {
    databaseId: string;
    name: string;
    description: string;
    sourceType: SourceType;
    sourceContent: string | File;
  }) => {
    try {
      let content: string;
      
      if (data.sourceContent instanceof File) {
        const text = await data.sourceContent.text();
        content = text;
      } else {
        content = data.sourceContent;
      }

      const requestBody = {
        databaseId: data.databaseId,
        name: data.name,
        description: data.description,
        sourceType: data.sourceType,
        content: content,
      };

      const response = await fetch(RAG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
    console.log('[useDatabaseState] Deleting database:', databaseId);
    setDatabases(prev => {
      const newDatabases = prev.filter(db => db.id !== databaseId);
      console.log('[useDatabaseState] New databases after delete:', newDatabases);
      return newDatabases;
    });
    toast.success('База данных удалена локально');
  };

  const viewDatabase = (database: Database) => {
    setSelectedDatabase(database);
    setViewDatabaseOpen(true);
  };

  return {
    databases,
    isLoading,
    createDatabaseOpen,
    setCreateDatabaseOpen,
    viewDatabaseOpen,
    setViewDatabaseOpen,
    selectedDatabase,
    fetchDatabases,
    createDatabase,
    deleteDatabase,
    viewDatabase,
    hasFetched: hasFetchedRef.current,
  };
};