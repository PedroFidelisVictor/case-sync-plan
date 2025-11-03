-- Remover integração via trigger no banco para evitar falhas na criação
DROP TRIGGER IF EXISTS trigger_sync_google_sheets ON public.agendamentos;
DROP FUNCTION IF EXISTS public.sync_to_google_sheets();