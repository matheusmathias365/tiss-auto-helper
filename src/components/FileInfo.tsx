import { Card, CardContent } from "@/components/ui/card";
import { FileText, Package, AlertTriangle } from "lucide-react";

interface FileInfoProps {
  fileName: string;
  fileSize?: number;
  warnings?: number;
}

export const FileInfo = ({ fileName, fileSize, warnings = 0 }: FileInfoProps) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Arquivo</p>
              <p className="font-semibold text-sm truncate max-w-[200px]" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tamanho</p>
              <p className="font-semibold text-sm">{formatFileSize(fileSize)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${warnings > 0 ? 'bg-warning/10' : 'bg-accent'}`}>
              <AlertTriangle className={`w-5 h-5 ${warnings > 0 ? 'text-warning' : 'text-primary'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-sm">
                {warnings > 0 ? `${warnings} avisos` : 'OK'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
