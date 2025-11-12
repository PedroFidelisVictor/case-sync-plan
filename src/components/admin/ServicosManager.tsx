import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, ArrowUp, ArrowDown } from "lucide-react";

interface TipoServico {
  id: string;
  nome: string;
  opcoes_extras: string[];
  ordem: number;
  ativo: boolean;
}

export const ServicosManager = () => {
  const [servicos, setServicos] = useState<TipoServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<TipoServico | null>(null);
  const [nomeServico, setNomeServico] = useState("");
  const [opcoesExtras, setOpcoesExtras] = useState("");

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tipos_servico")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar serviços");
      console.error(error);
    } else {
      setServicos((data || []).map(s => ({
        ...s,
        opcoes_extras: s.opcoes_extras as string[]
      })));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!nomeServico.trim()) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }

    const opcoesArray = opcoesExtras
      .split("\n")
      .map(o => o.trim())
      .filter(o => o.length > 0);

    if (editingServico) {
      const { error } = await supabase
        .from("tipos_servico")
        .update({
          nome: nomeServico,
          opcoes_extras: opcoesArray,
        })
        .eq("id", editingServico.id);

      if (error) {
        toast.error("Erro ao atualizar serviço");
      } else {
        toast.success("Serviço atualizado com sucesso!");
        fetchServicos();
        handleCloseDialog();
      }
    } else {
      const maxOrdem = servicos.length > 0 ? Math.max(...servicos.map(s => s.ordem)) : 0;
      const { error } = await supabase
        .from("tipos_servico")
        .insert({
          nome: nomeServico,
          opcoes_extras: opcoesArray,
          ordem: maxOrdem + 1,
        });

      if (error) {
        toast.error("Erro ao criar serviço");
      } else {
        toast.success("Serviço criado com sucesso!");
        fetchServicos();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("tipos_servico")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao deletar serviço");
    } else {
      toast.success("Serviço deletado com sucesso!");
      fetchServicos();
    }
  };

  const handleToggleAtivo = async (servico: TipoServico) => {
    const { error } = await supabase
      .from("tipos_servico")
      .update({ ativo: !servico.ativo })
      .eq("id", servico.id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Serviço ${!servico.ativo ? "ativado" : "desativado"}`);
      fetchServicos();
    }
  };

  const handleMoveOrdem = async (servico: TipoServico, direction: "up" | "down") => {
    const currentIndex = servicos.findIndex(s => s.id === servico.id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === servicos.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapServico = servicos[swapIndex];

    await supabase
      .from("tipos_servico")
      .update({ ordem: swapServico.ordem })
      .eq("id", servico.id);

    await supabase
      .from("tipos_servico")
      .update({ ordem: servico.ordem })
      .eq("id", swapServico.id);

    fetchServicos();
  };

  const handleEdit = (servico: TipoServico) => {
    setEditingServico(servico);
    setNomeServico(servico.nome);
    setOpcoesExtras(servico.opcoes_extras.join("\n"));
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingServico(null);
    setNomeServico("");
    setOpcoesExtras("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gerenciar Tipos de Serviço</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingServico(null); setNomeServico(""); setOpcoesExtras(""); }}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingServico ? "Editar" : "Adicionar"} Serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Serviço</Label>
                  <Input
                    id="nome"
                    value={nomeServico}
                    onChange={(e) => setNomeServico(e.target.value)}
                    placeholder="Ex: Troca de tela"
                  />
                </div>
                <div>
                  <Label htmlFor="opcoes">Opções Extras (uma por linha)</Label>
                  <textarea
                    id="opcoes"
                    className="w-full min-h-[120px] p-2 rounded-md border bg-secondary border-border"
                    value={opcoesExtras}
                    onChange={(e) => setOpcoesExtras(e.target.value)}
                    placeholder="FRONTAL INCELL&#10;FRONTAL ORIGINAL"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio se não houver opções extras para este serviço
                  </p>
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingServico ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8">Carregando...</p>
        ) : servicos.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhum serviço cadastrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Opções Extras</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((servico, index) => (
                <TableRow key={servico.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveOrdem(servico, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveOrdem(servico, "down")}
                        disabled={index === servicos.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{servico.nome}</TableCell>
                  <TableCell>
                    {servico.opcoes_extras.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {servico.opcoes_extras.slice(0, 2).map((opcao, i) => (
                          <Badge key={i} variant="outline">{opcao}</Badge>
                        ))}
                        {servico.opcoes_extras.length > 2 && (
                          <Badge variant="outline">+{servico.opcoes_extras.length - 2}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem opções</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAtivo(servico)}
                    >
                      <Badge variant={servico.ativo ? "default" : "secondary"}>
                        {servico.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(servico)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deletar Serviço</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja deletar "{servico.nome}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(servico.id)}>
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
        )}
      </CardContent>
    </Card>
  );
};
