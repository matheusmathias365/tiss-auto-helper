import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings2, Zap } from "lucide-react";

const ModeSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Assistente TISS Inteligente
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o modo de operação ideal para suas necessidades
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/manual')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Settings2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Modo Manual</CardTitle>
              <CardDescription className="text-base">
                Controlo total sobre as correções, ideal para rever arquivos em detalhe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Visualize o conteúdo XML antes de aplicar correções</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Escolha quais correções aplicar e em qual ordem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Reverta alterações com a função Desfazer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Baixe o resultado quando estiver satisfeito</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => navigate('/manual')}>
                Acessar Modo Manual
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/automatic')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Modo Automático</CardTitle>
              <CardDescription className="text-base">
                Correções instantâneas, ideal para lotes que seguem um padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  <span>Upload e processamento em um único passo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  <span>Aplica todas as correções automaticamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  <span>Download automático do arquivo corrigido</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  <span>Perfeito para processar lotes grandes rapidamente</span>
                </li>
              </ul>
              <Button className="w-full" variant="secondary" onClick={() => navigate('/automatic')}>
                Acessar Modo Automático
              </Button>
            </CardContent>
          </Card>
        </div>

        <footer className="text-center pt-12 pb-4 text-sm text-muted-foreground">
          <p>© 2025 Assistente TISS Inteligente | Upstream Technology</p>
          <p className="mt-2">Todos os dados são processados localmente no seu navegador</p>
        </footer>
      </div>
    </div>
  );
};

export default ModeSelection;
