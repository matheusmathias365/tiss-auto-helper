import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";
import Editor from 'react-simple-code-editor';
import React from "react"; // Importar React para os tipos de evento
// As importações do Prism.js foram removidas conforme solicitado.
// import Prism from 'prismjs';
// import 'prismjs/components/prism-markup.js';
// import 'prismjs/components/prism-xml.js';
// import 'prismjs/themes/prism.css';

interface XMLEditorProps {
  content: string;
  onChange: (content: string) => void;
  onTagQuery?: (tag: string) => void;
  title?: string;
}

export const XMLEditor = ({ content, onChange, onTagQuery, title = "Editor de XML" }: XMLEditorProps) => {
  // A função handleContextMenu agora aceita um evento de HTMLTextAreaElement
  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!onTagQuery) return;
    
    // e.currentTarget é o textarea diretamente
    const textarea = e.currentTarget;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);

    // Encontra a tag ao redor do cursor
    const tagStartMatch = textBeforeCursor.match(/<([a-zA-Z:_][\w:.-]*)(?:\s|>)?[^<]*$/);
    
    if (tagStartMatch) {
      e.preventDefault(); // Previne o menu de contexto padrão do navegador
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
            // A propriedade highlight foi removida conforme solicitado.
            // highlight={(code) => Prism.highlight(code, Prism.languages.xml, 'xml')}
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