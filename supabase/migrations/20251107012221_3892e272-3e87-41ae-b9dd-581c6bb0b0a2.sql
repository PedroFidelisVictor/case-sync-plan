-- Allow authenticated users to view all agendamentos (needed for Admin page)
-- This complements existing anon/view policies.
CREATE POLICY "Usuários autenticados podem visualizar agendamentos"
ON public.agendamentos
FOR SELECT
TO authenticated
USING (true);
