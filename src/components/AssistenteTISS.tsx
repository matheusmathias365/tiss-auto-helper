import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Tag as TagIcon, X } from "lucide-react";
import { searchTag, getTagInfo, TagInfo } from "@/utils/tissDatabase";
import { Badge } from "@/components/ui/badge";

interface AssistenteTISSProps {
  isOpen: boolean;
  onClose: () => void;
  initialTag?: string;
}

export const AssistenteTISS = ({ isOpen, onClose, initialTag = "" }: AssistenteTISSProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagResults, setTagResults] = useState<TagInfo[]>([]);
  const [selectedTagInfo, setSelectedTagInfo] = useState<TagInfo | null>(null);

  useEffect(() => {
    if (initialTag && isOpen) {
      setSearchQuery(initialTag);
      const info = getTagInfo(initialTag);
      if (info) {
        setSelectedTagInfo(info);
        setTagResults([info]);
      } else {
        handleSearch(initialTag);
      }
    }
  }, [initialTag, isOpen]);

  const handleSearch = (query: string = searchQuery) => {
    if (!query.trim()) {
      setTagResults([]);
      setSelectedTagInfo(null);
      return;
    }
    
    const tags = searchTag(query);
    setTagResults(tags);
    
    if (tags.length === 1) {
      setSelectedTagInfo(tags[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Assistente de Documento TISS
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Consulte tags XML do documento TISS e tire dúvidas sobre campos do lote.
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome da tag (ex: numeroGuiaPrestador)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={() => handleSearch()} size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {selectedTagInfo && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <TagIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {selectedTagInfo.tag}
                        </code>
                        {selectedTagInfo.required && (
                          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                        )}
                      </div>
                      <p className="font-semibold text-sm mb-1">{selectedTagInfo.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedTagInfo.description}
                      </p>
                      {selectedTagInfo.example && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-medium mb-1">Exemplo:</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded block">
                            {selectedTagInfo.example}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {tagResults.length > 0 && !selectedTagInfo && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Resultados da busca:</p>
                {tagResults.map((tag) => (
                  <Card 
                    key={tag.tag}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedTagInfo(tag)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <TagIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                            {tag.tag}
                          </code>
                          <p className="font-medium text-sm mt-1">{tag.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tag.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {tagResults.length === 0 && searchQuery && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tag encontrada. Tente outro termo de busca.
              </p>
            )}

            {!searchQuery && !selectedTagInfo && (
              <div className="text-center py-6 space-y-2">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">Como usar o Assistente</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Digite o nome de uma tag TISS no campo acima ou clique com o botão direito 
                  em qualquer tag no Editor de XML para ver sua explicação detalhada.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
