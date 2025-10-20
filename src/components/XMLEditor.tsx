import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";
import Editor from 'react-simple-code-editor';
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area"; // Importar ScrollArea

// Importar Prism.js e seus componentes para destaque de sintaxe XML
import Prism from 'prismjs';
import 'prismjs/components/prism-markup.js'; // Para estrutura XML/HTML
import 'prismjs/components/prism-xml.js';   // Para regras específicas de XML
import 'prismjs/themes/prism.css'; // Tema padrão do Prism para cores básicas

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
          <ScrollArea className="h-[600px] w-full"> {/* Envolve o editor com ScrollArea e define altura */}
            <Editor
              value={content}
              onValueChange={onChange}
              highlight={(code) => Prism.highlight(code, Prism.languages.xml, 'xml')} // Usando Prism para destaque de sintaxe XML
              padding={10}
              textareaId="xml-editor-textarea"
              className={cn("font-mono text-xs resize-none bg-muted/30")} // Removido 'h-[1300px]' e 'text-foreground' daqui
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 12,
                lineHeight: '1.5em',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                color: 'black', // Definido explicitamente para preto para garantir visibilidade
                minHeight: '100%', // Garante que o editor preencha a altura da ScrollArea
              }}
              onContextMenu={handleContextMenu}
            />
          </ScrollArea>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Edite o XML diretamente. Clique com botão direito numa tag para ver sua explicação.
        </p>
      </CardContent>
    </Card>
  );
};