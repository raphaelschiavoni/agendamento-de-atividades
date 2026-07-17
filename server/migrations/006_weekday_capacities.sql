-- Up Migration

-- Capacidade por horário específica de cada dia da semana (0=Dom..6=Sáb).
-- Ex.: {"1": 8, "2": 6} => segunda 8 vagas/horário, terça 6; demais dias usam
-- a capacidade padrão da atividade. Aditiva: não altera dados existentes.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS weekday_capacities JSONB NOT NULL DEFAULT '{}';

-- Down Migration

ALTER TABLE activities DROP COLUMN IF EXISTS weekday_capacities;
