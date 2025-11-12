import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Trash2, Eye, Calendar as CalendarIcon, Settings } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo.png";
import newcaseLogo from "@/assets/newcase-logo.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ServicosManager } from "@/components/admin/ServicosManager";
import { CalendarioManager } from "@/components/admin/CalendarioManager";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  const handleDeleteMultiple = async () => {
    const { error } = await supabase
      .from("agendamentos")
      .delete()
      .in("id", selectedIds);

    if (error) {
      toast.error("Erro ao cancelar agendamentos");
    } else {
      toast.success(`${selectedIds.length} agendamento(s) cancelado(s) com sucesso!`);
      setSelectedIds([]);
      fetchAgendamentos();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === agendamentos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(agendamentos.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={newcaseLogo} alt="NEW CASE" className="h-14 md:h-18 w-auto" />
            <img src={logo} alt="Logo" className="h-12 md:h-16 w-auto" />
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos, serviços e calendário</p>
        </div>

        <Tabs defaultValue="agendamentos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="servicos">
              <Settings className="mr-2 h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="calendario">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos">
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agendamentos ({agendamentos.length})</CardTitle>
              {selectedIds.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Selecionados ({selectedIds.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Agendamentos</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar {selectedIds.length} agendamento(s)? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteMultiple}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === agendamentos.length && agendamentos.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendamentos.map((agendamento) => (
                      <TableRow key={agendamento.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(agendamento.id)}
                            onCheckedChange={() => toggleSelect(agendamento.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {agendamento.codigo_cliente}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{agendamento.nome}</p>
                        </TableCell>
                        <TableCell>{agendamento.telefone}</TableCell>
                        <TableCell>{agendamento.modelo_celular}</TableCell>
                        <TableCell>{agendamento.tipo_servico}</TableCell>
                        <TableCell className="max-w-[320px] truncate" title={agendamento.descricao_problema}>
                          {agendamento.descricao_problema}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(parseISO(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}</p>
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
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Agendamento</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                                      <p className="font-mono font-semibold">{agendamento.codigo_cliente}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                                      {getStatusBadge(agendamento.status)}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Nome</p>
                                      <p>{agendamento.nome}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                                      <p>{agendamento.telefone}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Modelo do Celular</p>
                                      <p>{agendamento.modelo_celular}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Tipo de Serviço</p>
                                      <p>{agendamento.tipo_servico}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Data do Agendamento</p>
                                      <p>{format(parseISO(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Horário</p>
                                      <p>{agendamento.horario_agendamento.substring(0, 5)}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Descrição do Problema</p>
                                    <p className="mt-1 p-3 bg-muted rounded-md">{agendamento.descricao_problema}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                                    <p>{format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="servicos">
            <ServicosManager />
          </TabsContent>

          <TabsContent value="calendario">
            <CalendarioManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
