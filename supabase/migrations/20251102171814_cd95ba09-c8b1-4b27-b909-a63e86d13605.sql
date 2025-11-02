-- Criar função que chama a edge function para sincronizar com Google Sheets
CREATE OR REPLACE FUNCTION public.sync_to_google_sheets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_id bigint;
  webhook_url text;
BEGIN
  -- Obter a URL do webhook do projeto
  SELECT decrypted_secret INTO webhook_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL';
  
  -- Fazer requisição HTTP para a edge function
  SELECT http_post(
    url := webhook_url || '/functions/v1/sync-google-sheets',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
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
DROP TRIGGER IF EXISTS trigger_sync_google_sheets ON public.agendamentos;
CREATE TRIGGER trigger_sync_google_sheets
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_to_google_sheets();

-- Habilitar a extensão http para fazer requisições
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;