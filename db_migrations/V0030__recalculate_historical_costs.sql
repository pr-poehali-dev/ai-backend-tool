-- Пересчет стоимости для исторических данных на основе токенов и моделей
-- Цены основаны на анализе реальных логов GPTunnel API

UPDATE usage_stats
SET total_cost = CASE
    -- GPT-4o: ~1.35₽ за 1K prompt tokens, ~2.7₽ за 1K completion tokens
    -- (из логов: 63248 токенов = 85.44₽)
    WHEN model = 'gpt-4o' THEN 
        (total_prompt_tokens::numeric / 1000.0 * 1.35) + 
        (total_completion_tokens::numeric / 1000.0 * 2.7)
    
    -- GPT-4o-mini: ~0.15₽ за 1K prompt, ~0.3₽ за 1K completion
    WHEN model = 'gpt-4o-mini' THEN 
        (total_prompt_tokens::numeric / 1000.0 * 0.15) + 
        (total_completion_tokens::numeric / 1000.0 * 0.3)
    
    -- Claude 3.5 Sonnet: ~3₽ за 1K prompt, ~15₽ за 1K completion  
    WHEN model = 'claude-3.5-sonnet' THEN 
        (total_prompt_tokens::numeric / 1000.0 * 3.0) + 
        (total_completion_tokens::numeric / 1000.0 * 15.0)
    
    -- Claude 3/4.5 Haiku: ~0.8₽ за 1K prompt, ~4₽ за 1K completion
    WHEN model LIKE 'claude%haiku%' THEN 
        (total_prompt_tokens::numeric / 1000.0 * 0.8) + 
        (total_completion_tokens::numeric / 1000.0 * 4.0)
    
    -- GPT-4 Turbo: ~10₽ за 1K prompt, ~30₽ за 1K completion
    WHEN model LIKE 'gpt-4-turbo%' THEN 
        (total_prompt_tokens::numeric / 1000.0 * 10.0) + 
        (total_completion_tokens::numeric / 1000.0 * 30.0)
    
    -- GPT-3.5 Turbo: ~0.5₽ за 1K prompt, ~1.5₽ за 1K completion
    WHEN model LIKE 'gpt-3.5%' THEN 
        (total_prompt_tokens::numeric / 1000.0 * 0.5) + 
        (total_completion_tokens::numeric / 1000.0 * 1.5)
    
    -- По умолчанию (неизвестные модели): ~1₽ за 1K prompt, ~2₽ за 1K completion
    ELSE 
        (total_prompt_tokens::numeric / 1000.0 * 1.0) + 
        (total_completion_tokens::numeric / 1000.0 * 2.0)
END
WHERE total_cost = 0 OR total_cost IS NULL;
