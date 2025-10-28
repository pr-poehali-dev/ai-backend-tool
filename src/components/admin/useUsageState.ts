import { useState } from 'react';
import { toast } from 'sonner';

const USAGE_STATS_URL = 'https://functions.poehali.dev/3106619b-f815-4bcb-bbce-85e85edc9a8d';

export const useUsageState = () => {
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const fetchUsageStats = async () => {
    setIsLoadingUsage(true);
    try {
      const response = await fetch(`${USAGE_STATS_URL}?days=30`);
      const data = await response.json();
      setUsageStats(data);
    } catch (error) {
      toast.error('Ошибка загрузки статистики');
    } finally {
      setIsLoadingUsage(false);
    }
  };

  return {
    usageStats,
    isLoadingUsage,
    fetchUsageStats
  };
};
