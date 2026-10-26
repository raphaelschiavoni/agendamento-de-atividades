-- Up Migration

-- Trilha de auditoria: registra quem fez cada ação no painel (editar/cancelar/
-- aprovar reserva, mexer em atividade/hotel/usuário). Aditiva.
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_user_id UUID REFERENCES admin_users(id),
  admin_name TEXT,
  admin_email TEXT,
  action TEXT NOT NULL,       -- ex.: booking.edit, booking.cancel, activity.update
  entity_type TEXT NOT NULL,  -- booking | activity | hotel | user
  entity_id TEXT,
  hotel_id TEXT,              -- para filtrar por hotel
  summary TEXT NOT NULL,      -- descrição legível da ação
  details JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_hotel ON audit_logs (hotel_id);

-- Down Migration

DROP TABLE IF EXISTS audit_logs;
