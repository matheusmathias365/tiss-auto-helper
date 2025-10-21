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
import { ArrowLeft, HelpCircle, Download, Undo2, Sparkles, LayoutList } from "lucide-react"; // Adicionado LayoutList
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
  extractLotNumber,
  rebuildXml, // Importar rebuildXml
  formatXmlContent, // Importar formatXmlContent
  cleanNullValues, // Importar cleanNullValues
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
      // Regex para encontrar a tag e seu conteúdo
      const fieldRegex = new RegExp(`(<${condition.field}>)(.*?)(<\/${condition.field}>)`, 'g');
      
      let ruleChanges = 0;
      modifiedContent = modifiedContent.replace(fieldRegex, (match, openTag, value, closeTag) => {
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
    // Aplicar limpeza de NULLs e correção de estrutura no carregamento
    let processedContent = cleanNullValues(content);
    const structureResult = fixXMLStructure(processedContent);
    processedContent = structureResult.content;

    setXmlContent(processedContent);
    setOriginalContent(processedContent); // O original também é o conteúdo limpo e corrigido
    setFileName(name);
    setHistory([processedContent]); // Armazenar o conteúdo inicial processado no histórico
    setLogs([]);
    
    const extractedGuides = extractGuides(processedContent);
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

    // 0. Limpar valores "NULL"
    const cleanedContent = cleanNullValues(content);
    if (cleanedContent !== content) {
      addLog("Limpeza de NULLs", "success", "Valores 'NULL' removidos");
      content = cleanedContent;
    } else {
      addLog("Limpeza de NULLs", "info", "Nenhum valor 'NULL' encontrado");
    }

    const structureResult = fixXMLStructure(content);
    content = structureResult.content; // Não formatar aqui
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
    content = tipoResult.content; // Usar o conteúdo já como string
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
    content = cbosResult.content; // Usar o conteúdo já como string
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
    content = customResult.content; // Usar o conteúdo já como string
    if (customResult.changes > 0) {
      addLog("Regras personalizadas aplicadas", "success", `${customResult.changes} alterações`);
    } else {
      addLog("Regras personalizadas", "info", "Nenhuma regra personalizada aplicada");
    }

    const finalContent = addEpilogo(content);
    const rebuiltFinalContent = rebuildXml(finalContent); // Reconstruir sem formatação para TISS
    setXmlContent(rebuiltFinalContent);
    setDownloadContent(rebuiltFinalContent);
    
    setGuides(extractGuides(rebuiltFinalContent));

    const storedFaturistaName = loadFaturistaName();
    if (storedFaturistaName) {
      handleConfirmFaturistaName(storedFaturistaName);
    } else {
      setShowFaturistaNameModal(true);
    }
  };

  const handleDownloadTrigger = () => {
    // O conteúdo para download deve ser reconstruído (sem formatação) e ter o epílogo
    const contentWithEpilogo = addEpilogo(xmlContent);
    const finalContentForDownload = rebuildXml(contentWithEpilogo); // Garante que está estruturalmente correto, sem formatação
    setDownloadContent(finalContentForDownload);

    const storedFaturistaName = loadFaturistaName();
    if (storedFaturistaName) {
      handleConfirmFaturistaName(storedFaturistaName);
    } else {
      setShowFaturistaNameModal(true);
    }
  };

  const handleConfirmFaturistaName = async (faturistaName: string) => {
    if (!downloadContent || !fileName) return;
    
    let finalDownloadBlob: Blob | null = null;
    let downloadFileName = fileName;

    if (profile.outputFormat === 'zip') {
      const zip = new JSZip();
      const xmlFileName = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
      zip.file(xmlFileName, downloadContent); // Usar downloadContent (já reconstruído sem formatação)
      finalDownloadBlob = await zip.generateAsync({ type: "blob" });
      downloadFileName = fileName.endsWith('.xml') 
        ? fileName.replace('.xml', '.zip')
        : `${fileName}.zip`;
    } else {
      finalDownloadBlob = new Blob([downloadContent], { type: 'application/xml' }); // Usar downloadContent
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

    const lotNumber = extractLotNumber(downloadContent);
    openPrintableProtocol({
      fileName: fileName,
      guides: extractGuides(downloadContent),
      totalValue: extractGuides(downloadContent).reduce((sum, g) => sum + g.valorTotalGeral, 0),
      faturistaName: faturistaName,
      convenioName: profile.name,
      lotNumber: lotNumber,
    });

    setDownloadContent("");
  };

  const handleFixStructure = () => {
    saveToHistory(xmlContent);
    const result = fixXMLStructure(xmlContent);
    setXmlContent(result.content); // Não formatar aqui
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
    saveToHistory(xmlContent);
    const result = standardizeTipoAtendimento(xmlContent);
    setXmlContent(result.content); // Usar o conteúdo já como string
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
    saveToHistory(xmlContent);
    const result = standardizeCBOS(xmlContent);
    setXmlContent(result.content); // Usar o conteúdo já como string
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
    newContent = addEpilogo(newContent);
    const rebuiltContent = rebuildXml(newContent); // Reconstruir sem formatação
    setXmlContent(rebuiltContent);
    
    const updatedGuides = extractGuides(rebuiltContent);
    setGuides(updatedGuides);
    
    const deletedGuide = guides.find(g => g.id === guideId);
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
    const rebuiltContent = rebuildXml(newContent); // Reconstruir sem formatação
    setXmlContent(rebuiltContent);
    setGuides(extractGuides(rebuiltContent));
    addLog("Substituição realizada", "success", `${changes} substituições`);
    toast({
      title: "Substituição realizada",
      description: `${changes} ocorrência(s) substituída(s).`,
    });
  };

  const handleFixHash = () => {
    saveToHistory(xmlContent);
    const newContent = addEpilogo(xmlContent);
    const rebuiltContent = rebuildXml(newContent); // Reconstruir sem formatação
    setXmlContent(rebuiltContent);
    setGuides(extractGuides(rebuiltContent));
    addLog("Hash corrigido", "success", "Hash MD5 recalculado");
    toast({
      title: "Hash corrigido",
      description: "Hash MD5 recalculado e epílogo atualizado com sucesso.",
    });
  };

  const handleXMLChange = (newContent: string) => {
    // Não formatar em cada keystroke para evitar interrupções na digitação
    setXmlContent(newContent);
    const newGuides = extractGuides(newContent); // Extrair guias do conteúdo não formatado para manter responsividade
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

  const handleFormatXml = () => {
    if (!xmlContent) return;
    const formatted = formatXmlContent(xmlContent);
    setXmlContent(formatted);
    toast({
      title: "XML Formatado",
      description: "O conteúdo do XML foi formatado para melhor legibilidade.",
    });
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

                  <FindReplacePanel 
                    content={xmlContent}
                    onReplace={handleFindReplace}
                  />

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
                      onClick={handleFormatXml}
                      disabled={!xmlContent}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <LayoutList className="w-4 h-4" />
                      Formatar XML
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