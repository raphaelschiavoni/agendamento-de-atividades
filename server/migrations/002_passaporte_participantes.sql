-- Up Migration

-- Passaporte dos Sonhos: hóspede de um hotel usa atividades de outro sem custo.
-- Guardamos em qual hotel o cliente está hospedado (quando aplicável) e o quarto/chalé.
ALTER TABLE bookings ADD COLUMN guest_hotel_id TEXT REFERENCES hotels(id);
ALTER TABLE bookings ADD COLUMN room_number    TEXT;

-- Participantes detalhados (adultos 13+, crianças até 12). qty continua sendo o total.
ALTER TABLE bookings ADD COLUMN adults   INTEGER NOT NULL DEFAULT 1 CHECK (adults >= 0);
ALTER TABLE bookings ADD COLUMN children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0);

-- Down Migration

ALTER TABLE bookings DROP COLUMN IF EXISTS children;
ALTER TABLE bookings DROP COLUMN IF EXISTS adults;
ALTER TABLE bookings DROP COLUMN IF EXISTS room_number;
ALTER TABLE bookings DROP COLUMN IF EXISTS guest_hotel_id;
