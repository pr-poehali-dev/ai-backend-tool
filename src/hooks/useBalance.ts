import { useState, useEffect } from 'react';

interface BalanceData {
  balance: number;
}

const SECRETS_URL = 'https://functions.poehali.dev/1bfad5cb-d72a-4295-a5d5-c6e1211be804';

export const useBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SECRETS_URL}?action=balance`, {
        method: 'GET',
        headers: {
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