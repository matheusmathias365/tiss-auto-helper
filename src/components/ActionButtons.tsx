import { Button } from "@/components/ui/button";
import { Wand2, CheckCircle2, User } from "lucide-react";

interface ActionButtonsProps {
  // onFixStructure: () => void; // Removido
  onStandardizeTipoAtendimento: () => void;
  onStandardizeCBOS: () => void;
  disabled: boolean;
}

export const ActionButtons = ({
  // onFixStructure, // Removido
  onStandardizeTipoAtendimento,
  onStandardizeCBOS,
  disabled,
}: ActionButtonsProps) => {
  return (
    <div className="space-y-3">
      {/* Botão 'Corrigir Estrutura' removido */}
      {/* <Button
        onClick={onFixStructure}
        disabled={disabled}
        className="w-full h-auto py-3 flex items-center justify-start gap-3 bg-primary hover:bg-primary/90"
      >
        <Wand2 className="w-5 h-5" />
        <div className="text-left flex-1">
          <div className="font-semibold">Corrigir Estrutura</div>
          <div className="text-xs opacity-90">Repara tags duplicadas</div>
        </div>
      </Button> */}

      <Button
        onClick={onStandardizeTipoAtendimento}
        disabled={disabled}
        className="w-full h-auto py-3 flex items-center justify-start gap-3 bg-secondary hover:bg-secondary/90"
      >
        <CheckCircle2 className="w-5 h-5" />
        <div className="text-left flex-1">
          <div className="font-semibold">Padronizar Tipo</div>
          <div className="text-xs opacity-90">Define tipoAtendimento = 23</div>
        </div>
      </Button>

      <Button
        onClick={onStandardizeCBOS}
        disabled={disabled}
        className="w-full h-auto py-3 flex items-center justify-start gap-3 bg-secondary hover:bg-secondary/90"
      >
        <User className="w-5 h-5" />
        <div className="text-left flex-1">
          <div className="font-semibold">Padronizar CBOS</div>
          <div className="text-xs opacity-90">Define CBOS = 225125</div>
        </div>
      </Button>
    </div>
  );
};