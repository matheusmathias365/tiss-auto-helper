import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";
import Editor from 'react-simple-code-editor';
import React from "react"; // Importar React para os tipos de evento

interface XMLEditorProps {
  content: string;
  onChange: (content: string) => void;
  onTagQuery?: (tag: string) => void;
  title?: string;
}

export const XMLEditor = ({ content, onChange, onTagQuery, title = "Editor de XML" }: XMLEditorProps) => {
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTagQuery) return;
    
    // O componente Editor envolve o textarea em uma div, então o currentTarget pode ser a div.
    // Precisamos encontrar o textarea real para obter selectionStart.
    const textarea = e.currentTarget.querySelector('textarea') as HTMLTextAreaElement | null;

    if (!textarea) return; // Se não encontrar o textarea, sai.

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);
    // const textAfterCursor = content.substring(cursorPos); // Não utilizado, pode ser removido

    // Find the tag around cursor
    const tagStartMatch = textBeforeCursor.match(/<([a-zA-Z:_][\w:.-]*)(?:\s|>)?[^<]*$/);
    
    if (tagStartMatch) {
      e.preventDefault();
      const tagName = tagStartMatch[1];
      onTagQuery(tagName);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border rounded-md overflow-hidden">
          <Editor
            value={content}
            onValueChange={onChange}
            highlight={(code) => code} // Revertido para destaque simples
            padding={10}
            textareaId="xml-editor-textarea"
            className={cn("font-mono text-xs resize-none h-[1300px] bg-muted/30")}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 12,
              lineHeight: '1.5em',
              outline: 'none',
              whiteSpace: 'pre-wrap',
            }}
            onContextMenu={handleContextMenu}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Edite o XML diretamente. Clique com botão direito numa tag para ver sua explicação.
        </p>
      </CardContent>
    </Card>
  );
};