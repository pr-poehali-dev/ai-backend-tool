import { useState } from 'react';
import { toast } from 'sonner';

const ENDPOINTS_URL = 'https://functions.poehali.dev/01656c08-1cc0-472d-b64b-94b8c7a186dc';

interface ExternalEndpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  description?: string;
  headers: Record<string, string>;
  authType: string;
  authConfig: Record<string, any>;
  active: boolean;
  createdAt: string;
}

export const useExternalEndpointsState = () => {
  const [endpoints, setEndpoints] = useState<ExternalEndpoint[]>([]);
  const [createEndpointOpen, setCreateEndpointOpen] = useState(false);
  const [editEndpointOpen, setEditEndpointOpen] = useState(false);
  const [testEndpointOpen, setTestEndpointOpen] = useState(false);
  const [endpointToEdit, setEndpointToEdit] = useState<ExternalEndpoint | null>(null);
  const [endpointToTest, setEndpointToTest] = useState<ExternalEndpoint | null>(null);

  const fetchEndpoints = async () => {
    try {
      const response = await fetch(ENDPOINTS_URL);
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Ошибка загрузки эндпоинтов');
        return;
      }
      
      setEndpoints(data);
    } catch (error) {
      toast.error('Ошибка загрузки эндпоинтов');
      console.error('Fetch endpoints error:', error);
    }
  };

  const createEndpoint = async (endpointData: Partial<ExternalEndpoint>) => {
    try {
      const response = await fetch(ENDPOINTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpointData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка создания эндпоинта');
        return false;
      }

      toast.success('Эндпоинт успешно создан');
      setCreateEndpointOpen(false);
      await fetchEndpoints();
      return true;
    } catch (error) {
      toast.error('Ошибка создания эндпоинта');
      console.error('Create endpoint error:', error);
      return false;
    }
  };

  const updateEndpoint = async (endpointData: Partial<ExternalEndpoint>) => {
    try {
      const response = await fetch(ENDPOINTS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpointData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка обновления эндпоинта');
        return false;
      }

      toast.success('Эндпоинт успешно обновлен');
      setEditEndpointOpen(false);
      await fetchEndpoints();
      return true;
    } catch (error) {
      toast.error('Ошибка обновления эндпоинта');
      console.error('Update endpoint error:', error);
      return false;
    }
  };

  const toggleEndpointStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(ENDPOINTS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка изменения статуса');
        return;
      }

      toast.success(currentStatus ? 'Эндпоинт отключен' : 'Эндпоинт включен');
      await fetchEndpoints();
    } catch (error) {
      toast.error('Ошибка изменения статуса');
      console.error('Toggle status error:', error);
    }
  };

  const openEditEndpoint = (endpoint: ExternalEndpoint) => {
    setEndpointToEdit(endpoint);
    setEditEndpointOpen(true);
  };

  const openTestEndpoint = (endpoint: ExternalEndpoint) => {
    setEndpointToTest(endpoint);
    setTestEndpointOpen(true);
  };

  return {
    endpoints,
    createEndpointOpen,
    editEndpointOpen,
    testEndpointOpen,
    endpointToEdit,
    endpointToTest,
    setCreateEndpointOpen,
    setEditEndpointOpen,
    setTestEndpointOpen,
    fetchEndpoints,
    createEndpoint,
    updateEndpoint,
    toggleEndpointStatus,
    openEditEndpoint,
    openTestEndpoint,
  };
};
