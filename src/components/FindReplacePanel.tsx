import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Replace } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FindReplacePanelProps {
  content: string;
  onReplace: (newContent: string, changes: number) => void;
}

export const FindReplacePanel = ({ content, onReplace }: FindReplacePanelProps) => {
  const { toast } = useToast();
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  const handleReplaceNext = () => {
    if (!findText) {
      toast({
        title: "Campo vazio",
        description: "Digite o texto que deseja localizar.",
        variant: "destructive",
      });
      return;
    }

    const index = content.indexOf(findText);
    if (index === -1) {
      toast({
        title: "Não encontrado",
        description: "Texto não encontrado no documento.",
        variant: "destructive",
      });
      return;
    }

    const newContent = content.replace(findText, replaceText);
    onReplace(newContent, 1);
    
    toast({
      title: "Substituído",
      description: "1 ocorrência substituída.",
    });
  };

  const handleReplaceAll = () => {
    if (!findText) {
      toast({
        title: "Campo vazio",
        description: "Digite o texto que deseja localizar.",
        variant: "destructive",
      });
      return;
    }

    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    
    if (!matches || matches.length === 0) {
      toast({
        title: "Não encontrado",
        description: "Texto não encontrado no documento.",
        variant: "destructive",
      });
      return;
    }

    const newContent = content.replace(regex, replaceText);
    onReplace(newContent, matches.length);
    
    toast({
      title: "Substituído",
      description: `${matches.length} ocorrências substituídas.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Localizar e Substituir
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="find">Localizar</Label>
          <Input
            id="find"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Texto a localizar..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="replace">Substituir por</Label>
          <Input
            id="replace"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Novo texto..."
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReplaceNext}
            variant="outline"
            className="flex-1 gap-2"
            size="sm"
          >
            <Search className="w-4 h-4" />
            Substituir
          </Button>
          <Button
            onClick={handleReplaceAll}
            variant="secondary"
            className="flex-1 gap-2"
            size="sm"
          >
            <Replace className="w-4 h-4" />
            Substituir Todos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
