-- Up Migration

-- Atividades disponíveis o dia todo (sem horário fixo), limitadas por um total
-- de vagas por dia. Aditiva: não altera dados existentes.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS all_day BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS daily_capacity INTEGER NOT NULL DEFAULT 0;

-- Down Migration

ALTER TABLE activities DROP COLUMN IF EXISTS daily_capacity;
ALTER TABLE activities DROP COLUMN IF EXISTS all_day;
