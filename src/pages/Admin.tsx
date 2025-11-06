import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { LogOut, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  id: string;
  nome: string;
  telefone: string;
  modelo_celular: string;
  tipo_servico: string;
  descricao_problema: string;
  data_agendamento: string;
  horario_agendamento: string;
  status: string;
  codigo_cliente: string;
  created_at: string;
}

const Admin = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("Verificando autenticação...");
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Sessão:", session?.user?.id);
    
    if (!session) {
      console.log("Sem sessão, redirecionando para /auth");
      navigate("/auth");
      return;
    }

    console.log("Verificando role de admin...");
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    console.log("Resultado da verificação de role:", { roles, roleError });

    if (!roles) {
      toast.error("Acesso negado. Você não é administrador.");
      navigate("/");
      return;
    }

    console.log("Usuário é admin, carregando agendamentos...");
    setIsAdmin(true);
    fetchAgendamentos();
  };

  const fetchAgendamentos = async () => {
    setLoading(true);
    console.log("Iniciando busca de agendamentos...");
    
    const { data, error, count } = await supabase
      .from("agendamentos")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    console.log("Resultado da busca:", { data, error, count: count ?? data?.length });

    if (error) {
      toast.error("Erro ao carregar agendamentos");
      console.error("Erro detalhado:", error);
    } else {
      console.log("Agendamentos carregados com sucesso:", data?.length);
      setAgendamentos(data || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("agendamentos")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado com sucesso!");
      fetchAgendamentos();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao cancelar agendamento");
    } else {
      toast.success("Agendamento cancelado com sucesso!");
      fetchAgendamentos();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Aguardando análise": "secondary",
      "Em análise": "default",
      "Aguardando peça": "outline",
      "Em reparo": "default",
      "Pronto para retirada": "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie os agendamentos da loja</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agendamentos ({agendamentos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Carregando...</p>
            ) : agendamentos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum agendamento encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendamentos.map((agendamento) => (
                      <TableRow key={agendamento.id}>
                        <TableCell className="font-mono font-semibold">
                          {agendamento.codigo_cliente}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{agendamento.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {agendamento.modelo_celular}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{agendamento.telefone}</TableCell>
                        <TableCell>{agendamento.tipo_servico}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}</p>
                            <p className="text-muted-foreground">
                              {agendamento.horario_agendamento.substring(0, 5)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={agendamento.status}
                            onValueChange={(value) => handleStatusChange(agendamento.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue>{getStatusBadge(agendamento.status)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Aguardando análise">Aguardando análise</SelectItem>
                              <SelectItem value="Em análise">Em análise</SelectItem>
                              <SelectItem value="Aguardando peça">Aguardando peça</SelectItem>
                              <SelectItem value="Em reparo">Em reparo</SelectItem>
                              <SelectItem value="Pronto para retirada">Pronto para retirada</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita
                                  e o horário ficará disponível novamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(agendamento.id)}>
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
