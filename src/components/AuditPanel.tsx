import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { validateHash, findEmptyFields, validateProfessionalData, validateTissCompliance } from "@/utils/xmlProcessor"; // Importar validateTissCompliance

interface AuditPanelProps {
  content: string;
  onFixHash: () => void;
}

export const AuditPanel = ({ content, onFixHash }: AuditPanelProps) => {
  const [auditResults, setAuditResults] = useState<string[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [hashInvalid, setHashInvalid] = useState(false);

  const handleAudit = () => {
    setIsAuditing(true);
    const results: string[] = [];

    // 1. Validar Hash MD5
    const hashResult = validateHash(content);
    results.push(hashResult);
    setHashInvalid(hashResult.includes("❌"));

    // 2. Validar Campos Vazios
    const emptyFieldsResult = findEmptyFields(content);
    results.push(emptyFieldsResult);

    // 3. Validar Dados do Profissional
    const professionalResults = validateProfessionalData(content);
    results.push(...professionalResults);

    // 4. Validação TISS (nova)
    const tissResults = validateTissCompliance(content);
    results.push(...tissResults);

    setAuditResults(results);
    setIsAuditing(false);
  };

  const getIcon = (result: string) => {
    if (result.includes("✅")) {
      return <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />;
    } else if (result.includes("❌")) {
      return <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />;
    } else if (result.includes("⚠️")) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Validação e Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleAudit}
          disabled={isAuditing || !content}
          className="w-full gap-2"
          variant="secondary"
        >
          <ShieldCheck className="w-4 h-4" />
          {isAuditing ? "Auditando..." : "Executar Auditoria"}
        </Button>

        {auditResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Resultados da Auditoria:</h4>
              {hashInvalid && (
                <Button
                  onClick={onFixHash}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Corrigir Hash
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px] w-full rounded-md border p-3">
              <div className="space-y-3">
                {auditResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    {getIcon(result)}
                    <span className="flex-1 leading-relaxed">{result}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};