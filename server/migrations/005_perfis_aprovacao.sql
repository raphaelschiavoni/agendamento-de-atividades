-- Up Migration

-- Fila de aprovação da Sala de Agendamento.
-- Reservas antigas ficam 'aprovada' (já tiveram o WhatsApp disparado);
-- as novas passam a nascer 'pendente' (definido pela aplicação).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'aprovada';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES admin_users(id);

-- Perfil por operação: usuário da Sala de Agendamento fica vinculado a um hotel.
-- (role já existe em admin_users: 'admin' | 'agendamento')
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS hotel_id TEXT REFERENCES hotels(id);

-- Permite filtrar o histórico de WhatsApp por hotel.
ALTER TABLE whatsapp_log ADD COLUMN IF NOT EXISTS hotel_id TEXT;

-- Down Migration

ALTER TABLE whatsapp_log DROP COLUMN IF EXISTS hotel_id;
ALTER TABLE admin_users DROP COLUMN IF EXISTS hotel_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS approved_by;
ALTER TABLE bookings DROP COLUMN IF EXISTS approved_at;
ALTER TABLE bookings DROP COLUMN IF EXISTS approval_status;
