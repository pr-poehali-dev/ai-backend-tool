import { useState, useEffect } from 'react';

interface BalanceData {
  balance: number;
}

export const useBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = localStorage.getItem('gptunnel_default_key');
      
      if (!apiKey) {
        console.warn('[useBalance] API ключ не найден в localStorage');
        setBalance(0);
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://gptunnel.ru/v1/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useBalance] API error:', response.status, errorText);
        throw new Error(`Ошибка загрузки баланса: ${response.status}`);
      }

      const data: BalanceData = await response.json();
      console.log('[useBalance] Loaded balance:', data.balance);
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      console.error('[useBalance] Error:', err);
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
};