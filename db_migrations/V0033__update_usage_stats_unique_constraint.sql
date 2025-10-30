ALTER TABLE usage_stats DROP CONSTRAINT usage_stats_endpoint_model_date_key;

CREATE UNIQUE INDEX usage_stats_endpoint_model_assistant_date_idx 
  ON usage_stats (endpoint, model, COALESCE(assistant_id, ''), date);