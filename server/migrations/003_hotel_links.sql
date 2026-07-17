-- Up Migration

-- Tour virtual 360° e link de rota/mapa (Google Maps) de cada hotel.
-- Aditiva: apenas acrescenta colunas, não altera dados existentes.
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS tour360_url TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS map_url     TEXT;

-- Down Migration

ALTER TABLE hotels DROP COLUMN IF EXISTS map_url;
ALTER TABLE hotels DROP COLUMN IF EXISTS tour360_url;
