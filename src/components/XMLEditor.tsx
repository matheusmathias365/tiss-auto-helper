import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-xml'; // Caminho ajustado
import 'prismjs/themes/prism.css'; // Ou um tema mais escuro se preferir

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
    
    if (tagStartMatch) {
      e.preventDefault();
      const tagName = tagStartMatch[1];
      onTagQuery(tagName);
    }
  };

  const highlightWithLineNumbers = (code: string) => {
    const highlightedCode = highlight(code, languages.xml, 'xml');
    const lines = highlightedCode.split('\n');
    return lines.map((line, i) => `<span class="editor-line-number">${i + 1}</span>${line}`).join('\n');
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
            highlight={highlightWithLineNumbers}
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