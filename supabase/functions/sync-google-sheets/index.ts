import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgendamentoPayload {
  type: 'INSERT' | 'UPDATE';
  record: {
    id: string;
    codigo_cliente: string;
    nome: string;
    telefone: string;
    modelo_celular: string;
    tipo_servico: string;
    descricao_problema: string;
    data_agendamento: string;
    horario_agendamento: string;
    status: string;
    data_entrega_prevista: string;
    created_at: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AgendamentoPayload = await req.json();
    
    console.log('Received webhook payload:', payload);

    const GOOGLE_SHEETS_WEBHOOK_URL = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL');
    
    if (!GOOGLE_SHEETS_WEBHOOK_URL) {
      console.error('GOOGLE_SHEETS_WEBHOOK_URL não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Webhook do Google Sheets não configurado' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Formatar dados para o Google Sheets na ordem solicitada
    const sheetData = {
      CODIGO: payload.record.codigo_cliente,
      DATA_AGENDAMENTO: payload.record.data_agendamento,
      HORARIO: payload.record.horario_agendamento,
      NOME: payload.record.nome,
      TELEFONE: payload.record.telefone,
      MODELO: payload.record.modelo_celular,
      SERVICO: payload.record.tipo_servico,
      DESCRICAO: payload.record.descricao_problema,
    };

    // Enviar para Google Sheets via webhook
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sheetData),
    });

    const responseText = await response.text();
    console.log('Resposta do Google Sheets:', responseText);

    if (!response.ok) {
      throw new Error(`Erro ao enviar para Google Sheets: ${response.statusText} - ${responseText}`);
    }

    console.log('Dados enviados para Google Sheets com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agendamento sincronizado com Google Sheets' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});