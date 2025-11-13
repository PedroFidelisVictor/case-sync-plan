-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Qualquer pessoa pode criar agendamento" ON public.agendamentos;
DROP POLICY IF EXISTS "Qualquer pessoa pode atualizar status" ON public.agendamentos;
DROP POLICY IF EXISTS "Qualquer pessoa pode visualizar agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar agendamentos" ON public.agendamentos;

-- Create permissive policies for public access
CREATE POLICY "Qualquer pessoa pode criar agendamento"
ON public.agendamentos
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Qualquer pessoa pode visualizar agendamentos"
ON public.agendamentos
FOR SELECT
TO public
USING (true);

CREATE POLICY "Qualquer pessoa pode atualizar agendamentos"
ON public.agendamentos
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);