import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";
import { ActionButtons } from "@/components/ActionButtons";
import { ActivityLog, LogEntry } from "@/components/ActivityLog";
import { XMLEditor } from "@/components/XMLEditor";
import { FindReplacePanel } from "@/components/FindReplacePanel";
import { AuditPanel } from "@/components/AuditPanel";
import { ConferenciaPanel } from "@/components/ConferenciaPanel";
import { TriagemTable } from "@/components/TriagemTable";
import { AssistenteTISS } from "@/components/AssistenteTISS";
import { ArrowLeft, HelpCircle, Download, Undo2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadConfig, loadFaturistaName } from "@/utils/localStorage";
import JSZip from "jszip";
import {
  fixXMLStructure,
  standardizeTipoAtendimento,
  standardizeCBOS,
  extractGuides,
  deleteGuide,
  addEpilogo,
  Guide,
  extractLotNumber, // Importar a nova função
  parseAndBuildXml, // Importar a nova função
} from "@/utils/xmlProcessor";
import { CorrectionRule } from "@/types/profiles";
import { openPrintableProtocol } from "@/components/PrintableProtocol";
import { FaturistaNameModal } from "@/components/FaturistaNameModal";

const ConvenioPanel = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [config] = useState(loadConfig());
  const profile = config.profiles.find(p => p.id === profileId);
  
  const [xmlContent, setXmlContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [originalValue, setOriginalValue] = useState<number>(0);
  const [selectedGuideId, setSelectedGuideId] = useState<string | undefined>();
  const [assistentOpen, setAssistentOpen] = useState(false);
  const [assistentTag, setAssistentTag] = useState<string>("");
  const [showFaturistaNameModal, setShowFaturistaNameModal] = useState(false);
  const [downloadContent, setDownloadContent] = useState<string>("");

  useEffect(() => {
    if (!profile) {
      toast({
        title: "Perfil não encontrado",
        description: "Redirecionando para o dashboard",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [profile, navigate, toast]);

  if (!profile) return null;

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

  const applyCustomRules = (content: string): { content: string; changes: number } => {
    let modifiedContent = content;
    let totalChanges = 0;

    const associatedRules = config.rules.filter(r => 
      profile.associatedRules.includes(r.id) && r.enabled
    );

    for (const rule of associatedRules) {
      const { condition, action } = rule;
      const fieldRegex = new RegExp(`<${condition.field}>(.*?)<\/${condition.field}>`, 'g');
      
      let ruleChanges = 0;
      modifiedContent = modifiedContent.replace(fieldRegex, (match, value) => {
        let shouldApply = false;

        switch (condition.operator) {
          case 'equals':
            shouldApply = value === condition.value;
            break;
          case 'contains':
            shouldApply = value.includes(condition.value);
            break;
          case 'startsWith':
            shouldApply = value.startsWith(condition.value);
            break;
          case 'endsWith':
            shouldApply = value.endsWith(condition.value);
            break;
          case 'isEmpty':
            shouldApply = value.trim() === '';
            break;
        }

        if (shouldApply) {
          ruleChanges++;
          return `<${action.field}>${action.newValue}</${action.field}>`;
        }
        return match;
      });

      if (ruleChanges > 0) {
        totalChanges += ruleChanges;
        addLog(`Regra "${rule.name}"`, "success", `${ruleChanges} alterações aplicadas`);
        toast({
          title: `Regra "${rule.name}" aplicada`,
          description: `${ruleChanges} alterações realizadas.`,
        });
      } else {
        addLog(`Regra "${rule.name}"`, "info", "Nenhuma alteração necessária");
        toast({
          title: `Regra "${rule.name}"`,
          description: "Nenhuma alteração necessária.",
        });
      }
    }

    return { content: modifiedContent, changes: totalChanges };
  };

  const handleFileLoad = (content: string, name: string) => {
    const formattedContent = parseAndBuildXml(content); // Formatar o XML ao carregar
    setXmlContent(formattedContent);
    setOriginalContent(formattedContent);
    setFileName(name);
    setHistory([formattedContent]);
    setLogs([]);
    
    const extractedGuides = extractGuides(formattedContent);
    setGuides(extractedGuides);
    
    const totalOriginal = extractedGuides.reduce((sum, g) => sum + g.valorTotalGeral, 0);
    setOriginalValue(totalOriginal);
    
    addLog("Arquivo carregado", "success", `${name} com ${extractedGuides.length} guias detectadas`);
    
    toast({
      title: "Arquivo carregado",
      description: `${extractedGuides.length} guias encontradas no lote.`,
    });
  };

  const saveToHistory = (content: string) => {
    setHistory((prev) => [...prev, content]);
  };

  const handleAutomaticProcess = async () => {
    let content = xmlContent;
    saveToHistory(content);

    const structureResult = fixXMLStructure(content);
    content = structureResult.content;
    if (structureResult.changes > 0) {
      addLog("Estrutura corrigida", "success", `${structureResult.changes} correções`);
      toast({
        title: "Estrutura corrigida",
        description: `${structureResult.changes} tags corrigidas com sucesso.`,
      });
    } else {
      addLog("Estrutura verificada", "info", "Nenhuma correção necessária");
      toast({
        title: "Estrutura verificada",
        description: "Nenhuma correção de estrutura necessária.",
      });
    }

    const tipoResult = standardizeTipoAtendimento(content);
    content = tipoResult.content;
    if (tipoResult.changes > 0) {
      addLog("tipoAtendimento padronizado", "success", `${tipoResult.changes} campos`);
      toast({
        title: "Padronização de Tipo de Atendimento",
        description: `${tipoResult.changes} campos 'tipoAtendimento' atualizados.`,
      });
    } else {
      addLog("tipoAtendimento verificado", "info", "Nenhuma alteração");
      toast({
        title: "Padronização de Tipo de Atendimento",
        description: "Nenhuma alteração em 'tipoAtendimento' necessária.",
      });
    }

    const cbosResult = standardizeCBOS(content);
    content = cbosResult.content;
    if (cbosResult.changes > 0) {
      addLog("CBOS padronizado", "success", `${cbosResult.changes} campos`);
      toast({
        title: "Padronização de CBOS",
        description: `${cbosResult.changes} campos 'CBOS' atualizados.`,
      });
    } else {
      addLog("CBOS verificado", "info", "Nenhuma alteração");
      toast({
        title: "Padronização de CBOS",
        description: "Nenhuma alteração em 'CBOS' necessária.",
      });
    }

    const customResult = applyCustomRules(content);
    content = customResult.content;
    if (customResult.changes > 0) {
      addLog("Regras personalizadas aplicadas", "success", `${customResult.changes} alterações`);
    } else {
      addLog("Regras personalizadas", "info", "Nenhuma regra personalizada aplicada");
    }

    const finalContent = addEpilogo(content);
    setXmlContent(finalContent);
    setDownloadContent(finalContent);
    
    // Recarregar guias após o processamento automático
    setGuides(extractGuides(finalContent));

    const storedFaturistaName = loadFaturistaName();
    if (storedFaturistaName) {
      handleConfirmFaturistaName(storedFaturistaName);
    } else {
      setShowFaturistaNameModal(true);
    }
  };

  const handleDownloadTrigger = () => {
    setDownloadContent(xmlContent);
    const storedFaturistaName = loadFaturistaName();
    if (storedFaturistaName) {
      handleConfirmFaturistaName(storedFaturistaName);
    } else {
      setShowFaturistaNameModal(true);
    }
  };

  const handleConfirmFaturistaName = async (faturistaName: string) => {
    if (!downloadContent || !fileName) return;
    
    const contentWithEpilogo = addEpilogo(downloadContent);
    
    let finalDownloadBlob: Blob | null = null;
    let downloadFileName = fileName;

    if (profile.outputFormat === 'zip') {
      const zip = new JSZip();
      const xmlFileName = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
      zip.file(xmlFileName, contentWithEpilogo);
      finalDownloadBlob = await zip.generateAsync({ type: "blob" });
      downloadFileName = fileName.endsWith('.xml') 
        ? fileName.replace('.xml', '.zip')
        : `${fileName}.zip`;
    } else {
      finalDownloadBlob = new Blob([contentWithEpilogo], { type: 'application/xml' });
      downloadFileName = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
    }

    if (finalDownloadBlob) {
      const url = URL.createObjectURL(finalDownloadBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog("Arquivo baixado", "success", `Formato: ${profile.outputFormat.toUpperCase()}`);
    } else {
      toast({
        title: "Erro no download",
        description: "Não foi possível gerar o arquivo para download.",
        variant: "destructive",
      });
    }
    
    toast({
      title: "Download concluído",
      description: `Arquivo ${downloadFileName} baixado com sucesso.`,
    });

    const lotNumber = extractLotNumber(contentWithEpilogo); // Extrair número do lote
    openPrintableProtocol({
      fileName: fileName,
      guides: extractGuides(contentWithEpilogo),
      totalValue: extractGuides(contentWithEpilogo).reduce((sum, g) => sum + g.valorTotalGeral, 0),
      faturistaName: faturistaName,
      convenioName: profile.name, // Nome do perfil como nome do convênio
      lotNumber: lotNumber, // Passar o número do lote
    });

    setDownloadContent("");
  };

  const handleFixStructure = () => {
    const result = fixXMLStructure(xmlContent);
    saveToHistory(xmlContent);
    setXmlContent(result.content);
    // Recarregar guias após a modificação do XML
    setGuides(extractGuides(result.content));
    addLog(
      "Estrutura corrigida",
      result.changes > 0 ? "success" : "warning",
      result.changes > 0 ? `${result.changes} correções` : "Nenhuma correção necessária"
    );
    toast({
      title: "Estrutura corrigida",
      description: result.changes > 0 ? `${result.changes} tags corrigidas com sucesso.` : "Nenhuma correção de estrutura necessária.",
    });
  };

  const handleStandardizeTipoAtendimento = () => {
    const result = standardizeTipoAtendimento(xmlContent);
    saveToHistory(xmlContent);
    setXmlContent(result.content);
    // Recarregar guias após a modificação do XML
    setGuides(extractGuides(result.content));
    addLog(
      "tipoAtendimento padronizado",
      result.changes > 0 ? "success" : "warning",
      result.changes > 0 ? `${result.changes} campos` : "Nenhuma alteração"
    );
    toast({
      title: "Padronização de Tipo de Atendimento",
      description: result.changes > 0 ? `${result.changes} campos 'tipoAtendimento' atualizados.` : "Nenhuma alteração em 'tipoAtendimento' necessária.",
    });
  };

  const handleStandardizeCBOS = () => {
    const result = standardizeCBOS(xmlContent);
    saveToHistory(xmlContent);
    setXmlContent(result.content);
    // Recarregar guias após a modificação do XML
    setGuides(extractGuides(result.content));
    addLog(
      "CBOS padronizado",
      result.changes > 0 ? "success" : "warning",
      result.changes > 0 ? `${result.changes} campos` : "Nenhuma alteração"
    );
    toast({
      title: "Padronização de CBOS",
      description: result.changes > 0 ? `${result.changes} campos 'CBOS' atualizados.` : "Nenhuma alteração em 'CBOS' necessária.",
    });
  };

  const handleDeleteGuide = (guideId: string) => {
    saveToHistory(xmlContent);
    let newContent = deleteGuide(xmlContent, guideId);
    newContent = addEpilogo(newContent); // Recalcula e adiciona o epílogo com o novo hash
    setXmlContent(newContent);
    
    // CORRIGIDO: Recarregar guias do novo conteúdo XML
    const updatedGuides = extractGuides(newContent);
    setGuides(updatedGuides);
    
    const deletedGuide = guides.find(g => g.id === guideId); // Ainda usa o ID antigo para o toast
    addLog("Guia excluída", "info", `Guia ${deletedGuide?.numeroGuiaPrestador}. Hash recalculado.`);
    toast({
      title: "Guia excluída",
      description: `Guia ${deletedGuide?.numeroGuiaPrestador} removida com sucesso. O hash foi recalculado.`,
    });
    
    if (selectedGuideId === guideId) {
      setSelectedGuideId(undefined);
    }
  };

  const handleSelectGuide = (guideId: string) => {
    setSelectedGuideId(guideId);
    const guide = guides.find(g => g.id === guideId);
    if (guide) {
      toast({
        title: "Guia selecionada",
        description: `Guia ${guide.numeroGuiaPrestador} destacada no editor.`,
      });
    }
  };

  const handleFindReplace = (newContent: string, changes: number) => {
    saveToHistory(xmlContent);
    setXmlContent(newContent);
    // Recarregar guias após a modificação do XML
    setGuides(extractGuides(newContent));
    addLog("Substituição realizada", "success", `${changes} substituições`);
    toast({
      title: "Substituição realizada",
      description: `${changes} ocorrência(s) substituída(s).`,
    });
  };

  const handleFixHash = () => {
    saveToHistory(xmlContent);
    const newContent = addEpilogo(xmlContent);
    setXmlContent(newContent);
    // Recarregar guias após a modificação do XML (se o hash afetar algo, embora não deva)
    setGuides(extractGuides(newContent));
    addLog("Hash corrigido", "success", "Hash MD5 recalculado");
    toast({
      title: "Hash corrigido",
      description: "Hash MD5 recalculado e epílogo atualizado com sucesso.",
    });
  };

  const handleXMLChange = (newContent: string) => {
    setXmlContent(newContent);
    const newGuides = extractGuides(newContent);
    setGuides(newGuides);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const previousContent = history[history.length - 2];
      setXmlContent(previousContent);
      setHistory((prev) => prev.slice(0, -1));
      
      const newGuides = extractGuides(previousContent);
      setGuides(newGuides);
      
      addLog("Ação desfeita", "info", "Conteúdo restaurado");
      toast({
        title: "Desfeito",
        description: "Última ação revertida com sucesso.",
      });
    }
  };

  const currentValue = guides.reduce((sum, g) => sum + g.valorTotalGeral, 0);
  
  const handleTagQuery = (tag: string) => {
    setAssistentTag(tag);
    setAssistentOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Floating Assistant Button */}
      <Button
        onClick={() => setAssistentOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>

      <AssistenteTISS 
        isOpen={assistentOpen} 
        onClose={() => setAssistentOpen(false)}
        initialTag={assistentTag}
      />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Formato de saída: {profile.outputFormat.toUpperCase()} • {profile.associatedRules.length} regras ativas
                </p>
              </div>
            </div>
          </div>
        </div>

        {!xmlContent ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload onFileLoad={handleFileLoad} />
          </div>
        ) : (
          <Tabs defaultValue="automatico" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="automatico">Modo Automático</TabsTrigger>
              <TabsTrigger value="auditoria">Modo Auditoria</TabsTrigger>
              <TabsTrigger value="manual">Modo Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="automatico" className="mt-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-card border rounded-lg p-8 text-center space-y-4">
                  <h3 className="text-xl font-semibold">Processamento Automático</h3>
                  <p className="text-muted-foreground">
                    Clique no botão abaixo para aplicar todas as correções padrão e as regras personalizadas do perfil "{profile.name}". O arquivo será baixado automaticamente no formato {profile.outputFormat.toUpperCase()}.
                  </p>
                  <Button
                    onClick={handleAutomaticProcess}
                    size="lg"
                    className="gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Processar e Baixar
                  </Button>
                </div>
                
                <ActivityLog logs={logs} />
              </div>
            </TabsContent>

            <TabsContent value="auditoria" className="mt-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <AuditPanel content={xmlContent} onFixHash={handleFixHash} />
                
                <ActivityLog logs={logs} />
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Control Panel */}
                <div className="lg:col-span-4 space-y-6">
                  <ActionButtons
                    onFixStructure={handleFixStructure}
                    onStandardizeTipoAtendimento={handleStandardizeTipoAtendimento}
                    onStandardizeCBOS={handleStandardizeCBOS}
                    disabled={!xmlContent}
                  />

                  {/* REMOVED: FindReplacePanel */}

                  <div className="flex flex-col gap-3">
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
                      onClick={handleDownloadTrigger}
                      className="w-full gap-2 bg-gradient-to-r from-green-600 to-green-700"
                    >
                      <Download className="w-4 h-4" />
                      Baixar Lote Corrigido
                    </Button>
                  </div>
                </div>

                {/* RIGHT: Workspace */}
                <div className="lg:col-span-8 space-y-6">
                  <ConferenciaPanel
                    originalValue={originalValue}
                    currentValue={currentValue}
                  />

                  <TriagemTable
                    guides={guides}
                    onDeleteGuide={handleDeleteGuide}
                    onSelectGuide={handleSelectGuide}
                    selectedGuideId={selectedGuideId}
                  />

                  <XMLEditor
                    content={xmlContent}
                    onChange={handleXMLChange}
                    onTagQuery={handleTagQuery}
                    title="Editor de XML (Editável)"
                  />

                  <ActivityLog logs={logs} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <FaturistaNameModal
        isOpen={showFaturistaNameModal}
        onClose={() => setShowFaturistaNameModal(false)}
        onConfirm={handleConfirmFaturistaName}
      />
    </div>
  );
};

export default ConvenioPanel;