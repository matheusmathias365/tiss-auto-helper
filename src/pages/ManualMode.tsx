import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ActionButtons } from "@/components/ActionButtons";
import { GuidesList } from "@/components/GuidesList";
import { XMLEditor } from "@/components/XMLEditor";
import { AuditPanel } from "@/components/AuditPanel";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Undo2, ArrowLeft, LayoutList } from "lucide-react"; // Adicionado LayoutList
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
  extractLotNumber,
  rebuildXml, // Usar rebuildXml (sem formatação)
  formatXmlContent, // Usar formatXmlContent (com formatação)
  cleanNullValues, // Importar cleanNullValues
} from "@/utils/xmlProcessor";
import { openPrintableProtocol } from "@/components/PrintableProtocol";
import { FaturistaNameModal } from "@/components/FaturistaNameModal";
import { ConferenciaPanel } from "@/components/ConferenciaPanel";
import { TriagemTable } from "@/components/TriagemTable";

const ManualMode = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [xmlContent, setXmlContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [originalTotalValue, setOriginalTotalValue] = useState<number>(0);
  const [selectedGuideId, setSelectedGuideId] = useState<string | undefined>();
  const [showFaturistaNameModal, setShowFaturistaNameModal] = useState(false);

  const handleFileLoad = (content: string, name: string) => {
    // Aplicar limpeza de NULLs e correção de estrutura no carregamento
    let processedContent = cleanNullValues(content);
    const structureResult = fixXMLStructure(processedContent);
    processedContent = structureResult.content;

    setXmlContent(processedContent);
    setOriginalContent(processedContent); // O original também é o conteúdo limpo e corrigido
    setFileName(name);
    setHistory([processedContent]); // Armazenar o conteúdo inicial processado no histórico
    
    const extractedGuides = extractGuides(processedContent);
    setGuides(extractedGuides);
    
    const initialTotal = extractedGuides.reduce((sum, g) => sum + g.valorTotalGeral, 0);
    setOriginalTotalValue(initialTotal);
    
    toast({
      title: "Arquivo carregado",
      description: `${extractedGuides.length} guias encontradas no lote.`,
    });
  };

  const saveToHistory = (content: string) => {
    setHistory((prev) => [...prev, content]);
  };

  const handleFixStructure = () => {
    saveToHistory(xmlContent);
    const result = fixXMLStructure(xmlContent);
    // Não formatar aqui, apenas aplicar a correção e atualizar o estado
    setXmlContent(result.content); 
    setGuides(extractGuides(result.content));

    if (result.changes > 0) {
      toast({
        title: "Estrutura corrigida",
        description: `${result.changes} tags corrigidas com sucesso.`,
      });
    }
  };

  const handleStandardizeTipoAtendimento = () => {
    saveToHistory(xmlContent);
    const result = standardizeTipoAtendimento(xmlContent);
    // A função standardizeTipoAtendimento já retorna o XML como string, sem formatação
    setXmlContent(result.content); 
    setGuides(extractGuides(result.content));
    
    if (result.changes > 0) {
      toast({
        title: "Padronização concluída",
        description: `${result.changes} campos tipoAtendimento atualizados.`,
      });
    }
  };

  const handleStandardizeCBOS = () => {
    saveToHistory(xmlContent);
    const result = standardizeCBOS(xmlContent);
    // A função standardizeCBOS já retorna o XML como string, sem formatação
    setXmlContent(result.content);
    setGuides(extractGuides(result.content));
    
    if (result.changes > 0) {
      toast({
        title: "Padronização concluída",
        description: `${result.changes} campos CBOS atualizados.`,
      });
    }
  };

  const handleDeleteGuide = (guideId: string) => {
    saveToHistory(xmlContent);
    let newContent = deleteGuide(xmlContent, guideId);
    newContent = addEpilogo(newContent);
    // rebuildXml é usado para garantir que o XML seja estruturalmente válido após a exclusão e epílogo, mas sem formatação
    const rebuiltContent = rebuildXml(newContent); 
    setXmlContent(rebuiltContent);
    
    const updatedGuides = extractGuides(rebuiltContent);
    setGuides(updatedGuides);
    
    const deletedGuide = guides.find(g => g.id === guideId);
    
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
    // rebuildXml é usado para garantir que o XML seja estruturalmente válido após a substituição, mas sem formatação
    const rebuiltContent = rebuildXml(newContent); 
    setXmlContent(rebuiltContent);
    setGuides(extractGuides(rebuiltContent));
  };

  const handleFixHash = () => {
    saveToHistory(xmlContent);
    const newContent = addEpilogo(xmlContent);
    // rebuildXml é usado para garantir que o XML seja estruturalmente válido após a correção do hash, mas sem formatação
    const rebuiltContent = rebuildXml(newContent); 
    setXmlContent(rebuiltContent);
    
    setGuides(extractGuides(rebuiltContent));

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
      // Ao desfazer, o conteúdo já deve estar na sua forma desejada (bruta ou formatada anteriormente)
      setXmlContent(previousContent); 
      setHistory((prev) => prev.slice(0, -1));
      
      const newGuides = extractGuides(previousContent);
      setGuides(newGuides);
      
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

  const handleDownloadTrigger = () => {
    setShowFaturistaNameModal(true);
  };

  const handleConfirmFaturistaName = async (faturistaName: string) => {
    if (!xmlContent || !fileName) return;
    
    // O conteúdo para download deve ser reconstruído (sem formatação) e ter o epílogo
    const contentWithEpilogo = addEpilogo(xmlContent);
    const finalContentForDownload = rebuildXml(contentWithEpilogo); // Garante que está estruturalmente correto, sem formatação

    const zip = new JSZip();
    const xmlFileName = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
    zip.file(xmlFileName, finalContentForDownload); // Usar conteúdo não formatado para validação TISS
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const downloadName = fileName.endsWith('.xml') 
      ? fileName.replace('.xml', '.zip')
      : `${fileName}.zip`;
    
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download concluído",
      description: `Arquivo ${downloadName} baixado com sucesso.`,
    });

    const totalValue = extractGuides(finalContentForDownload).reduce((sum, g) => sum + g.valorTotalGeral, 0);
    const lotNumber = extractLotNumber(finalContentForDownload);
    openPrintableProtocol({
      fileName: fileName,
      guides: extractGuides(finalContentForDownload),
      totalValue: totalValue,
      faturistaName: faturistaName,
      convenioName: "Modo Manual",
      lotNumber: lotNumber,
    });
  };

  const handleTagQuery = (tag: string) => {
    // Implementação do Assistente TISS
  };

  const currentValue = guides.reduce((sum, g) => sum + g.valorTotalGeral, 0);

  return (
    <div className="min-h-screen bg-background">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setXmlContent("");
                      setOriginalContent("");
                      setFileName("");
                      setHistory([]);
                      setGuides([]);
                      setOriginalTotalValue(0);
                      setSelectedGuideId(undefined);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Carregar Novo Arquivo
                  </Button>
                </div>

                <ActionButtons
                  onFixStructure={handleFixStructure}
                  onStandardizeTipoAtendimento={handleStandardizeTipoAtendimento}
                  onStandardizeCBOS={handleStandardizeCBOS}
                  disabled={!xmlContent}
                />

                <AuditPanel 
                  content={xmlContent}
                  onFixHash={handleFixHash}
                />

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
                    className="w-full gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Lote Corrigido
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <ConferenciaPanel
                  originalValue={originalTotalValue}
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
              </div>
            </div>
          </>
        )}
      </main>

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
      <FaturistaNameModal
        isOpen={showFaturistaNameModal}
        onClose={() => setShowFaturistaNameModal(false)}
        onConfirm={handleConfirmFaturistaName}
      />
    </div>
  );
};

export default ManualMode;