-- Up Migration

-- Reserva em dupla: cada vaga/reserva corresponde a 2 pessoas (ex.: caiaque
-- de 2 lugares). O cliente escolhe quantas duplas; cada dupla conta 2 pessoas.
-- Aditiva: não altera dados existentes.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pair_booking BOOLEAN NOT NULL DEFAULT false;

-- Down Migration

ALTER TABLE activities DROP COLUMN IF EXISTS pair_booking;
