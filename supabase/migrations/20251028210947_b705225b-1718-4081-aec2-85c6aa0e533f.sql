-- Corrigir search_path das funções para segurança

-- Recriar função generate_codigo_cliente com search_path
CREATE OR REPLACE FUNCTION generate_codigo_cliente()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    codigo := 
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text ||
      floor(random() * 10)::text ||
      floor(random() * 10)::text;
    
    SELECT EXISTS(SELECT 1 FROM public.agendamentos WHERE codigo_cliente = codigo) INTO existe;
    
    IF NOT existe THEN
      RETURN codigo;
    END IF;
  END LOOP;
END;
$$;

-- Recriar função set_codigo_cliente com search_path
CREATE OR REPLACE FUNCTION set_codigo_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_cliente IS NULL OR NEW.codigo_cliente = '' THEN
    NEW.codigo_cliente := generate_codigo_cliente();
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;