import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const agendamentoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  telefone: z.string().min(10, "Telefone inválido").max(20),
  modelo: z.string().min(2, "Informe o modelo do celular").max(100),
  servico: z.string().min(1, "Selecione um tipo de serviço"),
  descricao: z.string().min(10, "Descreva o problema com mais detalhes").max(500),
});

const Agendamento = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [modelo, setModelo] = useState("");
  const [servico, setServico] = useState("");
  const [tipoTela, setTipoTela] = useState("");
  const [tipoBateria, setTipoBateria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [date, setDate] = useState<Date>();
  const [horario, setHorario] = useState("");
  const [loading, setLoading] = useState(false);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

  const horarios = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setHorario("");
    
    if (selectedDate) {
      const { data } = await supabase
        .from("agendamentos")
        .select("horario_agendamento")
        .eq("data_agendamento", format(selectedDate, "yyyy-MM-dd"));
      
      if (data) {
        const ocupados = data.map(a => a.horario_agendamento.substring(0, 5));
        setHorariosOcupados(ocupados);
      }
    }
  };

  const calcularDataEntrega = (dataAgendamento: Date): string => {
    const entrega = new Date(dataAgendamento);
    entrega.setDate(entrega.getDate() + 3);
    return format(entrega, "yyyy-MM-dd");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validacao = agendamentoSchema.parse({
        nome: nome.trim(),
        telefone: telefone.trim(),
        modelo: modelo.trim(),
        servico,
        descricao: descricao.trim(),
      });

      if (!date) {
        toast.error("Selecione uma data");
        return;
      }

      if (!horario) {
        toast.error("Selecione um horário");
        return;
      }

      if (servico === "Troca de tela" && !tipoTela) {
        toast.error("Selecione o tipo de tela");
        return;
      }

      if (servico === "Bateria" && !tipoBateria) {
        toast.error("Selecione o tipo de bateria");
        return;
      }

      setLoading(true);

      const dataEntrega = calcularDataEntrega(date);

      let descricaoCompleta = validacao.descricao;
      
      if (servico === "Troca de tela") {
        descricaoCompleta = `Tipo de tela: ${tipoTela}\n\n${validacao.descricao}`;
      } else if (servico === "Bateria") {
        descricaoCompleta = `Tipo de bateria: ${tipoBateria}\n\n${validacao.descricao}`;
      }

      const { data, error } = await supabase
        .from("agendamentos")
        .insert({
          nome: validacao.nome,
          telefone: validacao.telefone,
          modelo_celular: validacao.modelo,
          tipo_servico: validacao.servico,
          descricao_problema: descricaoCompleta,
          data_agendamento: format(date, "yyyy-MM-dd"),
          horario_agendamento: horario,
          data_entrega_prevista: dataEntrega,
          codigo_cliente: "",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Agendamento realizado! Seu código: ${data.codigo_cliente}`, {
        duration: 5000,
      });

      // Dispara a sincronização com Google Sheets (não bloqueia a navegação)
      try {
        await supabase.functions.invoke('sync-google-sheets', {
          body: { type: 'INSERT', record: data },
        });
      } catch (e) {
        console.log('Falha ao sincronizar com Sheets', e);
      }

      setTimeout(() => {
        navigate("/acompanhar", { state: { codigo: data.codigo_cliente } });
      }, 2000);

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao criar agendamento. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>

        <Card className="bg-card border-border neon-border">
          <CardHeader>
            <CardTitle className="text-3xl font-bold gradient-text">
              Agendar Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(XX) XXXXX-XXXX"
                  required
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo do Celular *</Label>
                <Input
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: iPhone 13, Samsung S21"
                  required
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servico">Tipo de Serviço *</Label>
                <Select value={servico} onValueChange={(value) => { setServico(value); setTipoTela(""); setTipoBateria(""); }} required>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="Troca de tela">Troca de tela</SelectItem>
                    <SelectItem value="Bateria">Bateria</SelectItem>
                    <SelectItem value="Conector">Conector de carga</SelectItem>
                    <SelectItem value="Software">Problemas de software</SelectItem>
                    <SelectItem value="Câmera">Câmera</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {servico === "Troca de tela" && (
                <div className="space-y-2">
                  <Label htmlFor="tipoTela">Tipo de Tela *</Label>
                  <Select value={tipoTela} onValueChange={setTipoTela} required>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o tipo de tela" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="FRONTAL INCELL">FRONTAL INCELL</SelectItem>
                      <SelectItem value="FRONTAL ORIGINAL PRIMEIRA LINHA">FRONTAL ORIGINAL PRIMEIRA LINHA</SelectItem>
                      <SelectItem value="FRONTAL ORIGINAL">FRONTAL ORIGINAL</SelectItem>
                      <SelectItem value="FRONTAL ORIGINAL TROCA C.I">FRONTAL ORIGINAL TROCA C.I</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {servico === "Bateria" && (
                <div className="space-y-2">
                  <Label htmlFor="tipoBateria">Tipo de Bateria *</Label>
                  <Select value={tipoBateria} onValueChange={setTipoBateria} required>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o tipo de bateria" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="Bateria Primeira Linha Premium">Bateria Primeira Linha Premium</SelectItem>
                      <SelectItem value="Bateria Original troca C.I">Bateria Original troca C.I</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição do Problema *</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva detalhadamente o problema do seu aparelho"
                  rows={4}
                  required
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Data do Agendamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-secondary border-border",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {date && (
                <div className="space-y-2">
                  <Label>Horário *</Label>
                  <Select value={horario} onValueChange={setHorario} required>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {horarios.map((h) => (
                        <SelectItem
                          key={h}
                          value={h}
                          disabled={horariosOcupados.includes(h)}
                          className={horariosOcupados.includes(h) ? "opacity-50" : ""}
                        >
                          {h} {horariosOcupados.includes(h) && "(Ocupado)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border font-semibold text-lg py-6"
              >
                {loading ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agendamento;
