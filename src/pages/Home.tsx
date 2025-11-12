import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Clock, Shield, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";
import newcaseLogo from "@/assets/newcase-logo.png";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80 animate-slide-down">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={newcaseLogo} alt="NEW CASE" className="h-14 md:h-18 w-auto" />
            <img src={logo} alt="Logo" className="h-12 md:h-16 w-auto" />
          </div>
          <Link to="/agendar">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border font-semibold">
              Agendar Agora
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Manutenção Profissional para Seu Celular
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Agende online, acompanhe em tempo real e receba seu aparelho como novo
          </p>
          <Link to="/agendar">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border text-lg px-8 py-6 font-semibold">
              Agendar Manutenção
            </Button>
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12 neon-text">Nossos Serviços</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Troca de Tela", desc: "Telas originais e de alta qualidade" },
            { title: "Bateria", desc: "Baterias com garantia e alto desempenho" },
            { title: "Conector de Carga", desc: "Reparo rápido e eficiente" },
            { title: "Problemas de Software", desc: "Formatação e otimização" },
            { title: "Câmera", desc: "Substituição de câmeras frontais e traseiras" },
            { title: "Outros Serviços", desc: "Consulte nossa equipe" },
          ].map((service, i) => (
            <Card key={i} className="bg-card border-border hover:border-primary transition-all hover:neon-border">
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-2 text-foreground">{service.title}</h4>
                <p className="text-muted-foreground">{service.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12 neon-text">Por Que Escolher a NEW CASE?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Clock, title: "Agendamento Online", desc: "Reserve seu horário sem sair de casa" },
            { icon: Shield, title: "Garantia Total", desc: "Todos os serviços com garantia" },
            { icon: Smartphone, title: "Peças Originais", desc: "Trabalhamos com peças certificadas" },
            { icon: CheckCircle2, title: "Acompanhamento", desc: "Veja o status em tempo real" },
          ].map((benefit, i) => (
            <Card key={i} className="bg-card border-border text-center hover:border-primary transition-all">
              <CardContent className="p-6">
                <benefit.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h4 className="text-lg font-semibold mb-2">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-secondary border-primary neon-border">
          <CardContent className="p-8 md:p-12 text-center">
            <h3 className="text-3xl font-bold mb-4 gradient-text">
              Pronto para Consertar Seu Celular?
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Agende agora e receba em até 3 dias úteis
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/agendar">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border font-semibold">
                  Agendar Manutenção
                </Button>
              </Link>
              <Link to="/acompanhar">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Acompanhar Serviço
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 NEW CASE - Manutenção de Celulares. Todos os direitos reservados.</p>
          <Link to="/auth" className="text-xs hover:text-primary transition-colors mt-2 inline-block">
            Acesso Administrativo
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;