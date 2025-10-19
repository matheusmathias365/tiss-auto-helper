import { Upload, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileLoad: (content: string, fileName: string) => void;
}

export const FileUpload = ({ onFileLoad }: FileUploadProps) => {
  const { toast } = useToast();
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const processFile = async (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file extension
    if (!file.name.endsWith('.xml')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo XML válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate MIME type (optional, as content check is more robust)
    if (file.type && file.type !== 'text/xml' && file.type !== 'application/xml' && file.type !== '') {
      toast({
        title: "Tipo MIME inválido",
        description: "O arquivo não parece ser um XML válido.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        let content: string;
        let detectedEncoding: string = 'UTF-8'; // Default encoding

        // First, try to decode a small part to find XML declaration
        const preliminaryDecoder = new TextDecoder('utf-8', { fatal: true });
        let preliminaryContent = '';
        try {
          // Decode first 1024 bytes to find encoding declaration
          preliminaryContent = preliminaryDecoder.decode(arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 1024)));
        } catch (error) {
          // If UTF-8 fails for the start, it might be ISO-8859-1
          const isoDecoder = new TextDecoder('iso-8859-1', { fatal: true });
          preliminaryContent = isoDecoder.decode(arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 1024)));
          detectedEncoding = 'ISO-8859-1';
        }
        
        const xmlDeclarationMatch = preliminaryContent.match(/<\?xml[^>]*encoding=["']([^"']*)["'][^>]*\?>/i);
        if (xmlDeclarationMatch && xmlDeclarationMatch[1]) {
          const declaredEncoding = xmlDeclarationMatch[1].toUpperCase();
          // Common encodings for TISS XMLs
          if (declaredEncoding === 'ISO-8859-1' || declaredEncoding === 'WINDOWS-1252' || declaredEncoding === 'UTF-8') {
            detectedEncoding = declaredEncoding;
          }
        }

        // Decode the full content with the detected or default encoding
        const finalDecoder = new TextDecoder(detectedEncoding, { fatal: true });
        content = finalDecoder.decode(arrayBuffer);
        
        // Validate XML content structure
        const trimmedContent = content.trim();
        if (!trimmedContent.startsWith('<?xml') && !trimmedContent.startsWith('<')) {
          toast({
            title: "Conteúdo inválido",
            description: "O arquivo não contém XML válido.",
            variant: "destructive",
          });
          return;
        }

        // Basic XXE protection check
        if (content.includes('<!DOCTYPE') && content.includes('<!ENTITY')) {
          toast({
            title: "Arquivo não permitido",
            description: "O arquivo contém definições de entidades que não são permitidas por questões de segurança.",
            variant: "destructive",
          });
          return;
        }

        onFileLoad(content, file.name);
        toast({
          title: "Arquivo carregado",
          description: `${file.name} foi carregado com sucesso (codificação: ${detectedEncoding}).`,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Erro de codificação",
          description: "Não foi possível ler o arquivo XML. Verifique a codificação.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file); // Read as ArrayBuffer to handle different encodings
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card className="p-8 border-2 border-dashed border-border hover:border-primary transition-colors">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="p-4 bg-accent rounded-full">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Arraste seu arquivo XML aqui
          </h3>
          <p className="text-sm text-muted-foreground">
            ou clique para selecionar
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>Arquivos .xml até 50MB</span>
        </div>
        <input
          id="file-input"
          type="file"
          accept=".xml"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Card>
  );
};