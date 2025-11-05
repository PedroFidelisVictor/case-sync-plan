-- Tornar o campo data_entrega_prevista nullable
ALTER TABLE public.agendamentos 
ALTER COLUMN data_entrega_prevista DROP NOT NULL;