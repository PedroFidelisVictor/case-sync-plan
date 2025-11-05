import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, CheckCircle2, Clock, Wrench, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  codigo_cliente: string;
  nome: string;
  telefone: string;
  modelo_celular: string;
  tipo_servico: string;
  descricao_problema: string;
  data_agendamento: string;
  horario_agendamento: string;
  status: string;
  created_at: string;
}

const Acompanhamento = () => {
  const location = useLocation();
  const [codigo, setCodigo] = useState("");
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.codigo) {
      setCodigo(location.state.codigo);
      buscarAgendamento(location.state.codigo);
    }
  }, [location]);

  const buscarAgendamento = async (codigoBusca: string) => {
    if (!codigoBusca || codigoBusca.length < 6) {
      toast.error("Digite um código válido");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("codigo_cliente", codigoBusca.toUpperCase())
        .single();

      if (error || !data) {
        toast.error("Agendamento não encontrado");
        setAgendamento(null);
        return;
      }

      setAgendamento(data);
    } catch (error) {
      toast.error("Erro ao buscar agendamento");
      setAgendamento(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando análise":
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case "em manutenção":
        return <Wrench className="w-8 h-8 text-blue-500" />;
      case "pronto para retirada":
        return <CheckCircle2 className="w-8 h-8 text-primary" />;
      default:
        return <Package className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando análise":
        return "border-yellow-500";
      case "em manutenção":
        return "border-blue-500";
      case "pronto para retirada":
        return "border-primary neon-border";
      default:
        return "border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>

        <Card className="bg-card border-border neon-border mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold gradient-text">
              Acompanhar Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Serviço</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="bg-secondary border-border"
                    maxLength={6}
                  />
                  <Button
                    onClick={() => buscarAgendamento(codigo)}
                    disabled={loading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Digite o código de 6 caracteres que você recebeu ao fazer o agendamento
              </p>
            </div>
          </CardContent>
        </Card>

        {agendamento && (
          <div className="space-y-6">
            <Card className={`bg-card ${getStatusColor(agendamento.status)}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {getStatusIcon(agendamento.status)}
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      Status: {agendamento.status}
                    </h3>
                    <p className="text-muted-foreground">
                      Código: {agendamento.codigo_cliente}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-semibold">{agendamento.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-semibold">{agendamento.telefone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aparelho</p>
                    <p className="font-semibold">{agendamento.modelo_celular}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
                    <p className="font-semibold">{agendamento.tipo_servico}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Agendamento</p>
                    <p className="font-semibold">
                      {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })} às {agendamento.horario_agendamento.substring(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Descrição do Problema</p>
                  <p className="font-semibold">{agendamento.descricao_problema}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary border-border">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 text-lg">Timeline do Serviço</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${agendamento.status ? 'bg-primary' : 'bg-muted'}`} />
                    <div>
                      <p className="font-semibold">Agendamento Recebido</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${agendamento.status.toLowerCase() === 'em manutenção' || agendamento.status.toLowerCase() === 'pronto para retirada' ? 'bg-primary' : 'bg-muted'}`} />
                    <div>
                      <p className="font-semibold">Em Manutenção</p>
                      <p className="text-sm text-muted-foreground">
                        {agendamento.status.toLowerCase() === 'em manutenção' || agendamento.status.toLowerCase() === 'pronto para retirada' ? 'Concluído' : 'Aguardando'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${agendamento.status.toLowerCase() === 'pronto para retirada' ? 'bg-primary' : 'bg-muted'}`} />
                    <div>
                      <p className="font-semibold">Pronto para Retirada</p>
                      <p className="text-sm text-muted-foreground">
                        {agendamento.status.toLowerCase() === 'pronto para retirada' ? 'Pode retirar!' : 'Aguardando'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Acompanhamento;