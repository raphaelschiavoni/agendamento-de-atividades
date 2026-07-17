-- Up Migration

-- Agenda completa por dia da semana e datas pontuais (estilo catálogo/Mymento):
-- { "weekdays": { "1": [{"time":"08:30","capacity":6}, ...], ... },
--   "dates":    { "2026-07-20": [{"time":"10:00","capacity":4}] } }
-- capacity ausente no horário => usa a capacidade padrão da atividade.
-- Vazio ({}) => comportamento legado (times + weekdays + allowed_dates).
ALTER TABLE activities ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '{}';

-- Down Migration

ALTER TABLE activities DROP COLUMN IF EXISTS schedule;
