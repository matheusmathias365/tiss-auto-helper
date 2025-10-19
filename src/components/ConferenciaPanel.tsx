import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface ConferenciaPanelProps {
  originalValue: number;
  currentValue: number;
}

export const ConferenciaPanel = ({ originalValue, currentValue }: ConferenciaPanelProps) => {
  const difference = currentValue - originalValue;
  const percentageChange = originalValue > 0 
    ? ((difference / originalValue) * 100).toFixed(2)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          Painel de Conferência de Lote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Valor Original:</span>
            <span className="text-lg font-bold">
              R$ {originalValue.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Valor Atual:</span>
            <span className="text-lg font-bold text-primary">
              R$ {currentValue.toFixed(2)}
            </span>
          </div>

          {difference !== 0 && (
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              difference < 0 ? 'bg-destructive/10' : 'bg-green-500/10'
            }`}>
              <span className="text-sm font-medium">Diferença:</span>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  difference < 0 ? 'text-destructive' : 'text-green-600'
                }`}>
                  {difference > 0 ? '+' : ''}R$ {difference.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  ({difference > 0 ? '+' : ''}{percentageChange}%)
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Este painel atualiza em tempo real a cada exclusão ou edição de valor.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
