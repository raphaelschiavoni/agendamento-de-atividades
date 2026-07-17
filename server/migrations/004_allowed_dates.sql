-- Up Migration

-- Datas específicas em que a atividade acontece (ex.: evento no dia 16/07),
-- complementando a recorrência semanal (weekdays). Formato 'YYYY-MM-DD'.
-- Aditiva: apenas acrescenta coluna, não altera dados existentes.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS allowed_dates TEXT[] NOT NULL DEFAULT '{}';

-- Down Migration

ALTER TABLE activities DROP COLUMN IF EXISTS allowed_dates;
