import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ActionButtons } from "@/components/ActionButtons";
import { ActivityLog, LogEntry } from "@/components/ActivityLog";
import { FileInfo } from "@/components/FileInfo";
import { XMLViewer } from "@/components/XMLViewer";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fixXMLStructure,
  standardizeTipoAtendimento,
  standardizeCBOS,
  downloadXML,
} from "@/utils/xmlProcessor";

const Index = () => {
  const { toast } = useToast();
  const [xmlContent, setXmlContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const addLog = (action: string, status: LogEntry['status'], details?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      status,
      details,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleFileLoad = (content: string, name: string) => {
    setXmlContent(content);
    setOriginalContent(content);
    setFileName(name);
    setHistory([content]);
    setLogs([]);
    addLog("Arquivo carregado", "success", name + " pronto para processamento");
  };

  const saveToHistory = (content: string) => {
    setHistory((prev) => [...prev, content]);
  };

  const handleFixStructure = () => {
    const result = fixXMLStructure(xmlContent);
    saveToHistory(xmlContent);
    setXmlContent(result.content);
    addLog(
      "Estrutura corrigida",
      result.changes > 0 ? "success" : "warning",
      result.changes > 0
        ? result.changes + " correcoes realizadas"
        : "Nenhuma correcao necessaria"
    );
    
    if (result.changes > 0) {
      toast({
        title: "Estrutura corrigida",
        description: result.changes + " tags corrigidas com sucesso.",
      });
    }
  };

  const handleStandardizeTipoAtendimento = () => {
    const result = standardizeTipoAtendimento(xmlContent);
    saveToHistory(xmlContent);
    setXmlContent(result.content);
    addLog(
      "Tipo de atendimento padronizado",
      result.changes > 0 ? "success" : "warning",
      result.changes > 0
        ? result.changes + " campos alterados para valor 23"
        : "Nenhuma alteracao necessaria"
    );
    
    if (result.changes > 0) {
      toast({
        title: "Padronizacao concluida",
        description: result.changes + " campos tipoAtendimento atualizados.",
      });
    }
  };

  const handleStandardizeCBOS = () => {
    const result = standardizeCBOS(xmlContent);
    saveToHistory(xmlContent);
    setXmlContent(result.content);
    addLog(
      "CBOS padronizado",
      result.changes > 0 ? "success" : "warning",
      result.changes > 0
        ? result.changes + " campos alterados para codigo 225125"
        : "Nenhuma alteracao necessaria"
    );
    
    if (result.changes > 0) {
      toast({
        title: "Padronizacao concluida",
        description: result.changes + " campos CBOS atualizados.",
      });
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const previousContent = history[history.length - 2];
      setXmlContent(previousContent);
      setHistory((prev) => prev.slice(0, -1));
      addLog("Acao desfeita", "info", "Conteudo restaurado para versao anterior");
      toast({
        title: "Desfeito",
        description: "Ultima acao revertida com sucesso.",
      });
    }
  };

  const handleDownload = () => {
    if (xmlContent && fileName) {
      downloadXML(xmlContent, fileName);
      addLog("Arquivo baixado", "success", fileName + " salvo com as correcoes");
      toast({
        title: "Download concluido",
        description: "Arquivo corrigido baixado com sucesso.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Assistente TISS Inteligente
              </h1>
              <p className="text-sm text-muted-foreground">
                Otimizador de Lotes XML para Faturistas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {!xmlContent ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Bem-vindo ao seu Assistente TISS
              </h2>
              <p className="text-muted-foreground">
                Carregue um arquivo XML para comecar a validacao e correcao automatica
              </p>
            </div>
            <FileUpload onFileLoad={handleFileLoad} />
            
            {/* Features */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-card border">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Agilidade</h3>
                <p className="text-sm text-muted-foreground">
                  Processe arquivos em segundos com correcoes automaticas
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-card border">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Assertividade</h3>
                <p className="text-sm text-muted-foreground">
                  100% de conformidade com o padrao TISS da ANS
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-card border">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Undo2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Autonomia</h3>
                <p className="text-sm text-muted-foreground">
                  Historico completo e funcao desfazer para total controle
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* File Info and Actions */}
            <div className="space-y-6">
              <FileInfo
                fileName={fileName}
                fileSize={new Blob([xmlContent]).size}
              />

              <ActionButtons
                onFixStructure={handleFixStructure}
                onStandardizeTipoAtendimento={handleStandardizeTipoAtendimento}
                onStandardizeCBOS={handleStandardizeCBOS}
                disabled={!xmlContent}
              />

              {/* Control Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleUndo}
                  disabled={history.length <= 1}
                  variant="outline"
                  className="gap-2"
                >
                  <Undo2 className="w-4 h-4" />
                  Desfazer
                </Button>
                <Button
                  onClick={handleDownload}
                  className="gap-2 bg-gradient-success"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo Corrigido
                </Button>
              </div>
            </div>

            {/* Activity Log and XML Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityLog logs={logs} />
              <XMLViewer content={xmlContent} title="XML Processado" />
            </div>

            {/* Load New File */}
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setXmlContent("");
                  setOriginalContent("");
                  setFileName("");
                  setLogs([]);
                  setHistory([]);
                }}
                variant="outline"
              >
                Carregar Novo Arquivo
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Assistente TISS Inteligente - Ferramenta profissional para faturistas da area da saude
          </p>
          <p className="mt-2">
            Todos os dados sao processados localmente. Sua privacidade e garantida.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
