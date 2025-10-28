-- Add RAG database IDs field to assistants table
ALTER TABLE t_p5706452_ai_backend_tool.assistants 
ADD COLUMN rag_database_ids TEXT[];

COMMENT ON COLUMN t_p5706452_ai_backend_tool.assistants.rag_database_ids 
IS 'Array of GPTunnel RAG database IDs for knowledge base';
