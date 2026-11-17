-- Up Migration

-- Corrige a FK de audit_logs -> admin_users: antes bloqueava excluir qualquer
-- usuário que já tivesse feito uma ação logada (violava a constraint, dava 500).
-- Como o log guarda admin_name/admin_email denormalizados, podemos apenas anular
-- o vínculo (ON DELETE SET NULL): o histórico continua legível, só perde o id vivo.
-- Aditiva/idempotente.
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_user_id_fkey;
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_admin_user_id_fkey
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL;

-- Down Migration

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_user_id_fkey;
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_admin_user_id_fkey
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id);
