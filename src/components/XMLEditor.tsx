import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface XMLEditorProps {
  content: string;
  onChange: (content: string) => void;
  onTagQuery?: (tag: string) => void;
  title?: string;
}

export const XMLEditor = ({ content, onChange, onTagQuery, title = "Editor de XML" }: XMLEditorProps) => {
  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!onTagQuery) return;
    
    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);
    const textAfterCursor = content.substring(cursorPos);
    
    // Find the tag around cursor
    const tagStartMatch = textBeforeCursor.match(/<([a-zA-Z:_][\w:.-]*)(?:\s|>)?[^<]*$/);
    const tagEndMatch = textAfterCursor.match(/^[^>]*>/);
    
    if (tagStartMatch) {
      e.preventDefault();
      const tagName = tagStartMatch[1];
      onTagQuery(tagName);
    }
  };

  return (
    <Card> {/* Removido h-full daqui */}
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
          onContextMenu={handleContextMenu}
          className={cn("font-mono text-xs resize-none h-[1300px]")}
          placeholder="O conteúdo XML aparecerá aqui..."
        />
        <p className="text-xs text-muted-foreground mt-2">
          Edite o XML diretamente. Clique com botão direito numa tag para ver sua explicação.
        </p>
      </CardContent>
    </Card>
  );
};