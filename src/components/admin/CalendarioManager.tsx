import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";

interface DataBloqueada {
  id: string;
  data: string;
  motivo: string | null;
  created_at: string;
}

export const CalendarioManager = () => {
  const [datasBloqueadas, setDatasBloqueadas] = useState<DataBloqueada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    fetchDatasBloqueadas();
  }, []);

  const fetchDatasBloqueadas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("datas_bloqueadas")
      .select("*")
      .order("data", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar datas bloqueadas");
      console.error(error);
    } else {
      setDatasBloqueadas(data || []);
    }
    setLoading(false);
  };

  const handleBloquearData = async () => {
    if (!selectedDate) {
      toast.error("Selecione uma data");
      return;
    }

    const dataFormatada = format(selectedDate, "yyyy-MM-dd");

    // Verifica se é domingo
    if (selectedDate.getDay() === 0) {
      toast.error("Domingos já são bloqueados automaticamente");
      return;
    }

    // Verifica se já está bloqueada
    const jaExiste = datasBloqueadas.some(d => d.data === dataFormatada);
    if (jaExiste) {
      toast.error("Esta data já está bloqueada");
      return;
    }

    const { error } = await supabase
      .from("datas_bloqueadas")
      .insert({
        data: dataFormatada,
        motivo: motivo.trim() || null,
      });

    if (error) {
      toast.error("Erro ao bloquear data");
      console.error(error);
    } else {
      toast.success("Data bloqueada com sucesso!");
      fetchDatasBloqueadas();
      setSelectedDate(undefined);
      setMotivo("");
    }
  };

  const handleDesbloquear = async (id: string) => {
    const { error } = await supabase
      .from("datas_bloqueadas")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao desbloquear data");
    } else {
      toast.success("Data desbloqueada com sucesso!");
      fetchDatasBloqueadas();
    }
  };

  const datasDesabilitadas = datasBloqueadas.map(d => parseISO(d.data));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Bloquear Nova Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione a Data</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date.getDay() === 0}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                blocked: datasDesabilitadas,
              }}
              modifiersStyles={{
                blocked: { textDecoration: "line-through", color: "hsl(var(--destructive))" },
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              * Domingos são bloqueados automaticamente
            </p>
          </div>
          <div>
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Feriado, Férias"
            />
          </div>
          <Button onClick={handleBloquearData} className="w-full">
            Bloquear Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datas Bloqueadas ({datasBloqueadas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Carregando...</p>
          ) : datasBloqueadas.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma data bloqueada</p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasBloqueadas.map((data) => (
                    <TableRow key={data.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(data.data), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {data.motivo || <span className="text-muted-foreground">-</span>}
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
                              <AlertDialogTitle>Desbloquear Data</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja desbloquear a data{" "}
                                {format(parseISO(data.data), "dd/MM/yyyy", { locale: ptBR })}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDesbloquear(data.id)}>
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
  );
};
