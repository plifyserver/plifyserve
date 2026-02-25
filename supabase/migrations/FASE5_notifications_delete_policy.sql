-- Permite que o usuário exclua suas próprias notificações
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications
FOR DELETE TO authenticated
USING (user_id = auth.uid());
