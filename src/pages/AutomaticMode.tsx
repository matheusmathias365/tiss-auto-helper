import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import { fixXMLStructure, standardizeTipoAtendimento, standardizeCBOS, extractGuides, addEpilogo } from "@/utils/xmlProcessor";
import { openPrintableProtocol } from "@/components/PrintableProtocol";
import { FaturistaNameModal } from "@/components/FaturistaNameModal";

interface ProcessingLog {
  action: string;
  details: string;
  timestamp: Date;
}

const AutomaticMode = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [originalFileName, setOriginalFileName] = useState<string>("");
  const [processedContentForDownload, setProcessedContentForDownload] = useState<string | Blob | null>(null); // Stores XML string or ZIP Blob
  const [currentGuides, setCurrentGuides] = useState<any[]>([]);
  const [currentTotalValue, setCurrentTotalValue] = useState<number>(0);
  const [showFaturistaNameModal, setShowFaturistaNameModal] = useState(false);

  const addLog = (action: string, details: string) => {
    setLogs((prev) => [...prev, { action, details, timestamp: new Date() }]);
  };

  const processXMLFile = (content: string): { content: string; totalChanges: number } => {
    let processedContent = content;
    let totalChanges = 0;

    // Apply all corrections in sequence
    const structureResult = fixXMLStructure(processedContent);
    processedContent = structureResult.content;
    totalChanges += structureResult.changes;

    const tipoResult = standardizeTipoAtendimento(processedContent);
    processedContent = tipoResult.content;
    totalChanges += tipoResult.changes;

    const cbosResult = standardizeCBOS(processedContent);
    processedContent = cbosResult.content;
    totalChanges += cbosResult.changes;

    return { content: processedContent, totalChanges };
  };

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setLogs([]);
    setOriginalFileName(file.name);

    try {
      if (file.name.endsWith('.zip')) {
        await processZipFile(file);
      } else if (file.name.endsWith('.xml')) {
        await processSingleXmlFile(file);
      } else {
        toast({
          title: "Formato não suportado",
          description: "Por favor, selecione um arquivo .xml ou .zip",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const processSingleXmlFile = async (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      
      // Validate XML content
      const trimmedContent = content.trim();
      if (!trimmedContent.startsWith('<?xml') && !trimmedContent.startsWith('<')) {
        toast({
          title: "Conteúdo inválido",
          description: "O arquivo não contém XML válido.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Basic XXE protection check
      if (content.includes('<!DOCTYPE') && content.includes('<!ENTITY')) {
        toast({
          title: "Arquivo não permitido",
          description: "O arquivo contém definições de entidades que não são permitidas por questões de segurança.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      addLog("Upload", `Arquivo ${file.name} carregado`);

      const result = processXMLFile(content);
      const finalContent = addEpilogo(result.content); // Add epilogo here
      addLog("Processamento", `${result.totalChanges} correções aplicadas`);

      const guides = extractGuides(finalContent);
      const totalValue = guides.reduce((sum, guide) => sum + guide.valorTotalGeral, 0);

      setProcessedContentForDownload(finalContent); // Store XML string
      setCurrentGuides(guides);
      setCurrentTotalValue(totalValue);
      setShowFaturistaNameModal(true);
    };

    reader.readAsText(file);
  };

  const processZipFile = async (file: File) => {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    
    addLog("Upload", `Arquivo ZIP ${file.name} carregado`);

    const outputZip = new JSZip();
    let totalFiles = 0;
    let totalChanges = 0;
    const allGuides: any[] = [];

    for (const [filename, zipEntry] of Object.entries(loadedZip.files)) {
      if (!zipEntry.dir && filename.endsWith('.xml')) {
        const content = await zipEntry.async('text');
        const result = processXMLFile(content);
        const finalContent = addEpilogo(result.content); // Add epilogo here for each XML in zip
        outputZip.file(filename, finalContent);
        totalFiles++;
        totalChanges += result.totalChanges;
        
        const fileGuides = extractGuides(finalContent);
        allGuides.push(...fileGuides);
      }
    }

    addLog("Processamento", `${totalFiles} arquivos processados. ${totalChanges} correções aplicadas`);

    const totalValue = allGuides.reduce((sum, guide) => sum + guide.valorTotalGeral, 0);

    const zipBlob = await outputZip.generateAsync({ type: "blob" });
    setProcessedContentForDownload(zipBlob); // Store ZIP Blob
    setCurrentGuides(allGuides);
    setCurrentTotalValue(totalValue);
    setShowFaturistaNameModal(true);
  };

  const handleConfirmFaturistaName = async (faturistaName: string) => {
    if (!processedContentForDownload || !originalFileName) {
      toast({
        title: "Erro no download",
        description: "Nenhum conteúdo processado para baixar.",
        variant: "destructive",
      });
      setProcessing(false);
      return;
    }

    let downloadBlob: Blob | null = null;
    let downloadName = originalFileName;

    if (processedContentForDownload instanceof Blob) {
      // It's a ZIP file
      downloadBlob = processedContentForDownload;
      downloadName = originalFileName; // Keep original name for ZIP
    } else {
      // It's a single XML string, wrap it in a ZIP
      const zip = new JSZip();
      const baseName = originalFileName.replace('.xml', '');
      zip.file(`${baseName}.xml`, processedContentForDownload);
      downloadBlob = await zip.generateAsync({ type: "blob" });
      downloadName = `${baseName}.zip`;
    }

    if (downloadBlob) {
      const url = URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog("Download", `${downloadName} baixado`);
    } else {
      toast({
        title: "Erro no download",
        description: "Não foi possível gerar o arquivo para download.",
        variant: "destructive",
      });
    }

    toast({
      title: "Processamento concluído!",
      description: "O arquivo foi corrigido e baixado automaticamente.",
    });

    openPrintableProtocol({
      fileName: originalFileName,
      guides: currentGuides,
      totalValue: currentTotalValue,
      faturistaName: faturistaName, // Passando o nome da faturista
    });

    setProcessing(false);
    setProcessedContentForDownload(null);
    setCurrentGuides([]);
    setCurrentTotalValue(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      input.files = dataTransfer.files;
      handleFileUpload({ target: input } as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Modo Automático
            </h1>
            <p className="text-muted-foreground mt-2">
              Processamento instantâneo com todas as correções aplicadas automaticamente
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </header>

        <div className="grid gap-6">
          <Card className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-secondary transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-secondary" />
              <h3 className="text-xl font-semibold mb-2">
                Arraste ou selecione seus arquivos
              </h3>
              <p className="text-muted-foreground mb-4">
                Aceita arquivos .xml individuais ou .zip com múltiplos arquivos
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xml,.zip"
                onChange={handleFileUpload}
                disabled={processing}
              />
              <label htmlFor="file-upload">
                <Button
                  asChild
                  variant="secondary"
                  disabled={processing}
                  className="cursor-pointer"
                >
                  <span>
                    {processing ? "Processando..." : "Selecionar Arquivo"}
                  </span>
                </Button>
              </label>
            </div>
          </Card>

          {logs.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Histórico de Ações
              </h3>
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 text-sm border-l-2 border-secondary pl-4 py-2"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-muted-foreground">{log.details}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
      <FaturistaNameModal
        isOpen={showFaturistaNameModal}
        onClose={() => {
          setShowFaturistaNameModal(false);
          setProcessing(false); // Allow new uploads if modal is closed
        }}
        onConfirm={handleConfirmFaturistaName}
      />
    </div>
  );
};

export default AutomaticMode;