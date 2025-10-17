import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Code } from "lucide-react";

interface XMLEditorProps {
  content: string;
  onChange: (content: string) => void;
  title?: string;
}

export const XMLEditor = ({ content, onChange, title = "Editor de XML" }: XMLEditorProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="h-[600px] font-mono text-xs resize-none"
          placeholder="O conteúdo XML aparecerá aqui..."
        />
        <p className="text-xs text-muted-foreground mt-2">
          Edite o XML diretamente. Todas as ações operam sobre este conteúdo.
        </p>
      </CardContent>
    </Card>
  );
};
