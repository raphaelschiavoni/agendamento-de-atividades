-- Up Migration

-- Vagas por categoria por horário: {"hospede": 8, "passaporte": 2, "visitante": 0}
-- Ausente/null => sem limite (usa as vagas do horário); 0 => a atividade não
-- aparece nem aceita reservas daquela categoria. Aditiva: preserva dados.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS category_capacities JSONB NOT NULL DEFAULT '{}';

-- Down Migration

ALTER TABLE activities DROP COLUMN IF EXISTS category_capacities;
