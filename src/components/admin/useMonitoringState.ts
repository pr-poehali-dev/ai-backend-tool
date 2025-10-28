import { useState } from 'react';
import { toast } from 'sonner';

const MONITORING_URL = 'https://functions.poehali.dev/6775cf31-8260-4bb5-b914-e8a57517ba49';

export const useMonitoringState = () => {
  const [monitoringData, setMonitoringData] = useState({
    totalRequests: 0,
    successRate: 0,
    avgLatency: 0,
    activeKeys: 0,
    dailyRequests: [] as { date: string; count: number }[],
  });

  const fetchMonitoring = async () => {
    try {
      const response = await fetch(MONITORING_URL);
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Ошибка загрузки мониторинга');
        return;
      }
      
      setMonitoringData(data);
    } catch (error) {
      toast.error('Ошибка загрузки мониторинга');
      console.error('Monitoring error:', error);
    }
  };

  return {
    monitoringData,
    fetchMonitoring
  };
};
