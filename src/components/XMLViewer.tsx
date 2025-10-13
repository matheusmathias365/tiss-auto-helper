import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code } from "lucide-react";

interface XMLViewerProps {
  content: string;
  title?: string;
}

export const XMLViewer = ({ content, title = "Conteudo XML" }: XMLViewerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <pre className="p-4 text-xs font-mono bg-muted/30">
            <code>{content}</code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
