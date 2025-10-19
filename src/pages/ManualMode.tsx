import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ActionButtons } from "@/components/ActionButtons";
import { ActivityLog, LogEntry } from "@/components/ActivityLog";
import { GuidesList } from "@/components/GuidesList";
import { XMLEditor } from "@/components/XMLEditor";
import { FindReplacePanel } from "@/components/FindReplacePanel";
import { AuditPanel } from "@/components/AuditPanel";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Undo2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import {
  fixXMLStructure,
  standardizeTipoAtendimento,
  standardizeCBOS,
  extractGuides,
  deleteGuide,
  addEpilogo,
  Guide,
} from "@/utils/xmlProcessor";
import { openPrintableProtocol } from "@/components/PrintableProtocol";

const ManualMode = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [xmlContent, setXmlContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | undefined>();

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
    
    // Extract guides
    const extractedGuides = extractGuides(content);
    setGuides(extractedGuides);
    
    addLog("Arquivo carregado", "success", `${name} com ${extractedGuides.length} guias detectadas`);
    
    toast({
      title: "Arquivo carregado",
      description: `${extractedGuides.length} guias encontradas no lote.`,
    });
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
        ? `${result.changes} correções realizadas`
        : "Nenhuma correção necessária"
    );
    
    if (result.changes > 0) {
      toast({
        title: "Estrutura corrigida",
        description: `${result.changes} tags corrigidas com sucesso.`,
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
        ? `${result.changes} campos alterados para valor 23`
        : "Nenhuma alteração necessária"
    );
    
    if (result.changes > 0) {
      toast({
        title: "Padronização concluída",
        description: `${result.changes} campos tipoAtendimento atualizados.`,
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
        ? `${result.changes} campos alterados para código 225125`
        : "Nenhuma alteração necessária"
    );
    
    if (result.changes > 0) {
      toast({
        title: "Padronização concluída",
        description: `${result.changes} campos CBOS atualizados.`,
      });
    }
  };

  const handleDeleteGuide = (guideId: string) => {
    saveToHistory(xmlContent);
    const newContent = deleteGuide(xmlContent, guideId, guides);
    setXmlContent(newContent);
    
    // Update guides list
    const newGuides = guides.filter(g => g.id !== guideId);
    setGuides(newGuides);
    
    const deletedGuide = guides.find(g => g.id === guideId);
    addLog(
      "Guia excluída",
      "info",
      `Guia ${deletedGuide?.numeroGuiaPrestador} removida do lote`
    );
    
    toast({
      title: "Guia excluída",
      description: `Guia ${deletedGuide?.numeroGuiaPrestador} removida com sucesso.`,
    });
    
    if (selectedGuideId === guideId) {
      setSelectedGuideId(undefined);
    }
  };

  const handleSelectGuide = (guideId: string) => {
    setSelectedGuideId(guideId);
    const guide = guides.find(g => g.id === guideId);
    
    if (guide) {
      // Find the guide in the XML and scroll to it
      // This is a simple implementation - in a real app you'd want more sophisticated scrolling
      toast({
        title: "Guia selecionada",
        description: `Guia ${guide.numeroGuiaPrestador} destacada no editor.`,
      });
    }
  };

  const handleFindReplace = (newContent: string, changes: number) => {
    saveToHistory(xmlContent);
    setXmlContent(newContent);
    addLog(
      "Substituição realizada",
      "success",
      `${changes} substituições realizadas`
    );
  };

  const handleFixHash = () => {
    saveToHistory(xmlContent);
    const newContent = addEpilogo(xmlContent);
    setXmlContent(newContent);
    addLog("Hash corrigido", "success", "Hash MD5 recalculado e atualizado");
    
    toast({
      title: "Hash corrigido",
      description: "Hash MD5 recalculado e epílogo atualizado com sucesso.",
    });
  };

  const handleXMLChange = (newContent: string) => {
    setXmlContent(newContent);
    // Update guides when XML changes
    const newGuides = extractGuides(newContent);
    setGuides(newGuides);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const previousContent = history[history.length - 2];
      setXmlContent(previousContent);
      setHistory((prev) => prev.slice(0, -1));
      
      // Update guides
      const newGuides = extractGuides(previousContent);
      setGuides(newGuides);
      
      addLog("Ação desfeita", "info", "Conteúdo restaurado para versão anterior");
      toast({
        title: "Desfeito",
        description: "Última ação revertida com sucesso.",
      });
    }
  };

  const handleDownload = async () => {
    if (!xmlContent || !fileName) return;
    
    // Add epilogo with new hash
    const contentWithEpilogo = addEpilogo(xmlContent);
    
    const zip = new JSZip();
    const xmlFileName = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
    zip.file(xmlFileName, contentWithEpilogo);
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use original filename (without _corrigido suffix)
    const downloadName = fileName.endsWith('.xml') 
      ? fileName.replace('.xml', '.zip')
      : `${fileName}.zip`;
    
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLog("Arquivo baixado", "success", `${downloadName} salvo com hash MD5 atualizado`);
    
    toast({
      title: "Download concluído",
      description: `Arquivo ${downloadName} baixado com sucesso.`,
    });

    // Open printable protocol
    const totalValue = guides.reduce((sum, guide) => sum + guide.valorTotalGeral, 0);
    openPrintableProtocol({
      fileName: fileName,
      guides: guides,
      totalValue: totalValue
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Painel de Auditoria Interativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Auditoria completa com edição manual e validações avançadas
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {!xmlContent ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Carregue seu arquivo XML ou lote ZIP
              </h2>
              <p className="text-muted-foreground">
                Acesse todas as ferramentas de auditoria e correção
              </p>
            </div>
            <FileUpload onFileLoad={handleFileLoad} />
          </div>
        ) : (
          <>
            {/* Main Layout: 2 Column Grid - Control Panel (Left) + Workspace (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: Control Panel and Actions */}
              <div className="lg:col-span-4 space-y-6">
                {/* Card 1: File Upload */}
                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setXmlContent("");
                      setOriginalContent("");
                      setFileName("");
                      setLogs([]);
                      setHistory([]);
                      setGuides([]);
                      setSelectedGuideId(undefined);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Carregar Novo Arquivo
                  </Button>
                </div>

                {/* Card 2: Batch Actions */}
                <ActionButtons
                  onFixStructure={handleFixStructure}
                  onStandardizeTipoAtendimento={handleStandardizeTipoAtendimento}
                  onStandardizeCBOS={handleStandardizeCBOS}
                  disabled={!xmlContent}
                />

                {/* Card 3: Find and Replace */}
                <FindReplacePanel
                  content={xmlContent}
                  onReplace={handleFindReplace}
                />

                {/* Card 4: Active Audit Panel */}
                <AuditPanel 
                  content={xmlContent}
                  onFixHash={handleFixHash}
                />

                {/* Card 5: Control Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleUndo}
                    disabled={history.length <= 1}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Undo2 className="w-4 h-4" />
                    Desfazer Última Ação
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="w-full gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Lote Corrigido
                  </Button>
                </div>
              </div>

              {/* RIGHT COLUMN: Workspace and Visualization */}
              <div className="lg:col-span-8 space-y-6">
                {/* Card 1: Guides List */}
                <GuidesList
                  guides={guides}
                  onDeleteGuide={handleDeleteGuide}
                  onSelectGuide={handleSelectGuide}
                  selectedGuideId={selectedGuideId}
                />

                {/* Card 2: Interactive XML Editor */}
                <XMLEditor
                  content={xmlContent}
                  onChange={handleXMLChange}
                  title="Editor de XML (Editável)"
                />

                {/* Activity Log */}
                <ActivityLog logs={logs} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Assistente TISS Inteligente - Ferramenta profissional para faturistas da área da saúde
          </p>
          <p className="mt-2">
            Todos os dados são processados localmente. Sua privacidade é garantida.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ManualMode;
