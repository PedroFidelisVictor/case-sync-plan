-- Criar tabela para tipos de serviço
CREATE TABLE public.tipos_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  opcoes_extras jsonb DEFAULT '[]'::jsonb,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir os tipos de serviço existentes
INSERT INTO public.tipos_servico (nome, opcoes_extras, ordem) VALUES
  ('Troca de tela', '["FRONTAL INCELL", "FRONTAL ORIGINAL PRIMEIRA LINHA", "FRONTAL ORIGINAL", "FRONTAL ORIGINAL TROCA C.I"]'::jsonb, 1),
  ('Bateria', '["Bateria Primeira Linha Premium", "Bateria Original troca C.I"]'::jsonb, 2),
  ('Conector de carga', '[]'::jsonb, 3),
  ('Problemas de software', '[]'::jsonb, 4),
  ('Câmera', '[]'::jsonb, 5),
  ('Outro', '[]'::jsonb, 6);

-- Criar tabela para datas bloqueadas
CREATE TABLE public.datas_bloqueadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  motivo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datas_bloqueadas ENABLE ROW LEVEL SECURITY;

-- Políticas para tipos_servico (todos podem ler, apenas admin pode modificar)
CREATE POLICY "Qualquer pessoa pode visualizar tipos de serviço"
  ON public.tipos_servico
  FOR SELECT
  USING (true);

CREATE POLICY "Admins podem inserir tipos de serviço"
  ON public.tipos_servico
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar tipos de serviço"
  ON public.tipos_servico
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar tipos de serviço"
  ON public.tipos_servico
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para datas_bloqueadas (todos podem ler, apenas admin pode modificar)
CREATE POLICY "Qualquer pessoa pode visualizar datas bloqueadas"
  ON public.datas_bloqueadas
  FOR SELECT
  USING (true);

CREATE POLICY "Admins podem inserir datas bloqueadas"
  ON public.datas_bloqueadas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar datas bloqueadas"
  ON public.datas_bloqueadas
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tipos_servico_updated_at
  BEFORE UPDATE ON public.tipos_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();