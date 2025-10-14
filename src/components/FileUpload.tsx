import { Upload, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileLoad: (content: string, fileName: string) => void;
}

export const FileUpload = ({ onFileLoad }: FileUploadProps) => {
  const { toast } = useToast();
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    // Validate MIME type
    if (file.type && file.type !== 'text/xml' && file.type !== 'application/xml') {
      toast({
        title: "Tipo MIME inválido",
        description: "O arquivo não parece ser um XML válido.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
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
        description: `${file.name} foi carregado com sucesso.`,
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

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
        description: "Por favor, arraste um arquivo XML válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate MIME type
    if (file.type && file.type !== 'text/xml' && file.type !== 'application/xml') {
      toast({
        title: "Tipo MIME inválido",
        description: "O arquivo não parece ser um XML válido.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
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
        description: `${file.name} foi carregado com sucesso.`,
      });
    };
    reader.readAsText(file);
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
