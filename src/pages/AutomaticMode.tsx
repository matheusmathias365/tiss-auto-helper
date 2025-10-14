import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import { fixXMLStructure, standardizeTipoAtendimento, standardizeCBOS } from "@/utils/xmlProcessor";

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);
    setLogs([]);

    const file = files[0];
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
      addLog("Upload", `Arquivo ${file.name} carregado`);

      const result = processXMLFile(content);
      addLog("Processamento", `${result.totalChanges} correções aplicadas`);

      // Create ZIP with processed file
      const zip = new JSZip();
      const baseName = file.name.replace('.xml', '');
      zip.file(`${baseName}.xml`, result.content);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}_corrigido.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addLog("Download", `${baseName}_corrigido.zip baixado`);
      
      toast({
        title: "Processamento concluído!",
        description: "O arquivo foi corrigido e baixado automaticamente.",
      });

      setProcessing(false);
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

    for (const [filename, zipEntry] of Object.entries(loadedZip.files)) {
      if (!zipEntry.dir && filename.endsWith('.xml')) {
        const content = await zipEntry.async('text');
        const result = processXMLFile(content);
        outputZip.file(filename, result.content);
        totalFiles++;
        totalChanges += result.totalChanges;
      }
    }

    addLog("Processamento", `${totalFiles} arquivos processados. ${totalChanges} correções aplicadas`);

    const zipBlob = await outputZip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = file.name.replace('.zip', '');
    link.download = `${baseName}_corrigido.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addLog("Download", `${baseName}_corrigido.zip baixado com ${totalFiles} arquivos`);

    toast({
      title: "Processamento concluído!",
      description: `${totalFiles} arquivos foram corrigidos e baixados automaticamente.`,
    });

    setProcessing(false);
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
    </div>
  );
};

export default AutomaticMode;