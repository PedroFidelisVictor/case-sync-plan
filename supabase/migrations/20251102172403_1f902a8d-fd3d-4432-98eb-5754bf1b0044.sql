-- Remover a função e trigger problemáticos
DROP TRIGGER IF EXISTS trigger_sync_google_sheets ON public.agendamentos;
DROP FUNCTION IF EXISTS public.sync_to_google_sheets();

-- Habilitar a extensão pg_net para fazer requisições HTTP assíncronas
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar função correta que faz requisição HTTP para a edge function
CREATE OR REPLACE FUNCTION public.sync_to_google_sheets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_url text;
  service_key text;
  request_id bigint;
BEGIN
  -- Obter credenciais do vault
  SELECT decrypted_secret INTO project_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL';
  
  SELECT decrypted_secret INTO service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  
  -- Fazer requisição HTTP assíncrona para a edge function
  SELECT net.http_post(
    url := project_url || '/functions/v1/sync-google-sheets',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que executa após INSERT na tabela agendamentos
CREATE TRIGGER trigger_sync_google_sheets
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_to_google_sheets();