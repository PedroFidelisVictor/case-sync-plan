-- Criar tabela de agendamentos
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_cliente TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  modelo_celular TEXT NOT NULL,
  tipo_servico TEXT NOT NULL,
  descricao_problema TEXT NOT NULL,
  data_agendamento DATE NOT NULL,
  horario_agendamento TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aguardando análise',
  data_entrega_prevista DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para gerar código único de cliente
CREATE OR REPLACE FUNCTION generate_codigo_cliente()
RETURNS TEXT AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Gera código no formato XXX999 (3 letras + 3 números)
    codigo := 
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text ||
      floor(random() * 10)::text ||
      floor(random() * 10)::text;
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM public.agendamentos WHERE codigo_cliente = codigo) INTO existe;
    
    IF NOT existe THEN
      RETURN codigo;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente antes de insert
CREATE OR REPLACE FUNCTION set_codigo_cliente()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_cliente IS NULL OR NEW.codigo_cliente = '' THEN
    NEW.codigo_cliente := generate_codigo_cliente();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_codigo_cliente
BEFORE INSERT ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION set_codigo_cliente();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agendamentos_updated_at
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Política para inserir agendamentos (público pode criar)
CREATE POLICY "Qualquer pessoa pode criar agendamento"
ON public.agendamentos
FOR INSERT
TO anon
WITH CHECK (true);

-- Política para leitura de agendamentos (público pode ler)
CREATE POLICY "Qualquer pessoa pode visualizar agendamentos"
ON public.agendamentos
FOR SELECT
TO anon
USING (true);

-- Política para atualização (público pode atualizar)
CREATE POLICY "Qualquer pessoa pode atualizar status"
ON public.agendamentos
FOR UPDATE
TO anon
USING (true);

-- Índices para melhor performance
CREATE INDEX idx_agendamentos_data_horario ON public.agendamentos(data_agendamento, horario_agendamento);
CREATE INDEX idx_agendamentos_codigo_cliente ON public.agendamentos(codigo_cliente);
CREATE INDEX idx_agendamentos_status ON public.agendamentos(status);