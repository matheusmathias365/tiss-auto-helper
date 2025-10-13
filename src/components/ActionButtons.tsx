import { Button } from "@/components/ui/button";
import { Wand2, CheckCircle2, User } from "lucide-react";

interface ActionButtonsProps {
  onFixStructure: () => void;
  onStandardizeTipoAtendimento: () => void;
  onStandardizeCBOS: () => void;
  disabled: boolean;
}

export const ActionButtons = ({
  onFixStructure,
  onStandardizeTipoAtendimento,
  onStandardizeCBOS,
  disabled,
}: ActionButtonsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Button
        onClick={onFixStructure}
        disabled={disabled}
        className="h-auto py-4 flex flex-col items-center gap-2 bg-primary hover:bg-primary/90"
      >
        <Wand2 className="w-5 h-5" />
        <div className="text-center">
          <div className="font-semibold">Corrigir Estrutura</div>
          <div className="text-xs opacity-90">Repara tags duplicadas</div>
        </div>
      </Button>

      <Button
        onClick={onStandardizeTipoAtendimento}
        disabled={disabled}
        className="h-auto py-4 flex flex-col items-center gap-2 bg-secondary hover:bg-secondary/90"
      >
        <CheckCircle2 className="w-5 h-5" />
        <div className="text-center">
          <div className="font-semibold">Padronizar Tipo</div>
          <div className="text-xs opacity-90">Define tipoAtendimento = 23</div>
        </div>
      </Button>

      <Button
        onClick={onStandardizeCBOS}
        disabled={disabled}
        className="h-auto py-4 flex flex-col items-center gap-2 bg-secondary hover:bg-secondary/90"
      >
        <User className="w-5 h-5" />
        <div className="text-center">
          <div className="font-semibold">Padronizar CBOS</div>
          <div className="text-xs opacity-90">Define CBOS = 225125</div>
        </div>
      </Button>
    </div>
  );
};
